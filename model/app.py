import os
from typing import TypedDict, List
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, END
from sqlalchemy import create_engine, text, inspect
from dotenv import load_dotenv
import pandas as pd
import re
import json
from datetime import datetime
import subprocess
import platform

load_dotenv()

try:
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        print("Error: GEMINI_API_KEY not found in environment variables.")
        print("Please create a .env file with your GEMINI_API_KEY")
        exit(1)
    
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0,
        google_api_key=gemini_api_key
    )
    print("Gemini model initialized successfully!")
except Exception as e:
    print(f"Error initializing Gemini model: {e}")
    exit(1)

try:
    db_connection_string = os.getenv("DB_CONNECTION_STRING")
    db_engine = create_engine(db_connection_string)
    
    with db_engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("Database connection established successfully!")
except Exception as e:
    print(f"Error connecting to database: {e}")
    exit(1)

def get_database_schema():
    """Extract schema information from the database"""
    inspector = inspect(db_engine)
    schema_info = {}
    
    tables = inspector.get_table_names()
    
    for table_name in tables:
        columns = inspector.get_columns(table_name)
        column_info = []
        
        for column in columns:
            column_info.append({
                'name': column['name'],
                'type': str(column['type']),
                'nullable': column['nullable'],
                'default': column['default']
            })
        
        foreign_keys = inspector.get_foreign_keys(table_name)
        fk_info = []
        
        for fk in foreign_keys:
            fk_info.append({
                'constrained_columns': fk['constrained_columns'],
                'referred_table': fk['referred_table'],
                'referred_columns': fk['referred_columns']
            })
        
        schema_info[table_name] = {
            'columns': column_info,
            'foreign_keys': fk_info
        }
    
    return schema_info

def format_schema_for_prompt(schema_info):
    """Format schema information for inclusion in the prompt"""
    schema_text = "DATABASE SCHEMA:\n"
    
    for table_name, table_info in schema_info.items():
        schema_text += f"- {table_name}: "
        columns = [f"{col['name']} ({col['type']})" for col in table_info['columns']]
        schema_text += ", ".join(columns) + "\n"
        
        if table_info['foreign_keys']:
            schema_text += "  Foreign keys: "
            fk_descriptions = []
            for fk in table_info['foreign_keys']:
                fk_desc = f"{fk['constrained_columns']} -> {fk['referred_table']}({fk['referred_columns']})"
                fk_descriptions.append(fk_desc)
            schema_text += ", ".join(fk_descriptions) + "\n"
    
    return schema_text

try:
    schema_info = get_database_schema()
    schema_prompt = format_schema_for_prompt(schema_info)
    print("Database schema loaded successfully!")
except Exception as e:
    print(f"Error loading database schema: {e}")
    print("Please check your database connection and permissions.")
    exit(1)

class AgentState(TypedDict):
    user_input: str
    sql_query: str
    query_result: List
    error: str
    response: str
    show_query: bool
    chat_history: List[dict]
    schema_info: str
    intent: str

def check_intent(state: AgentState):
    """Classifies user intent to route to the correct action."""
    prompt = f"""
    Classify the user's input into one of the following categories:
    - 'greeting': A friendly greeting or simple small talk (e.g., 'hi', 'hello', 'how are you?').
    - 'database_query': A request for information from the database (e.g., 'what are the top 5 products?', 'show me all users').
    - 'other': Any input that does not fit the above categories.

    User Input: "{state['user_input']}"

    Provide only the category name as a single word in your response.
    """
    try:
        response = llm.invoke(prompt)
        intent = response.content.strip().lower()
        if intent not in ['greeting', 'database_query', 'other']:
            intent = 'other' # Default to 'other' for unexpected classifications
        return {"intent": intent}
    except Exception as e:
        print(f"Error classifying intent: {e}")
        return {"intent": "other", "error": f"Error classifying intent: {str(e)}"}

def handle_greeting(state: AgentState):
    """Generates a friendly response for greetings."""
    return {"response": "Hey there! How can I help you with your data today?"}

def handle_other(state: AgentState):
    """Generates a conversational response for non-database queries."""
    prompt = f"""
    The user's input is "{state['user_input']}". This is not a request for data from the database.
    Your task is to generate a polite, conversational response.

    If the user's input is a direct question about my capabilities (e.g., "what can you do?", "what is your purpose?"), provide a detailed explanation of my database agent role.
    
    For all other inputs, generate a short, helpful, and polite response that acknowledges the user without repeating my purpose.
    
    Examples:
    - User: "thanks" -> Assistant: "You're welcome! Is there anything else I can help with?"
    - User: "what's the weather" -> Assistant: "I cannot provide that information."
    - User: "what can you do?" -> Assistant: "I'm an AI database agent. I can answer your questions by converting your natural language into SQL queries and retrieving the data from the database."
    - User: "okay" -> Assistant: "Ready when you are!"
    - User: "so i need help" -> Assistant: "Okay, I'm ready to help with your database queries."

    Response:
    """
    response = llm.invoke(prompt)
    return {"response": response.content.strip()}

def generate_sql(state: AgentState):
    """Generate SQL query from natural language with context"""
    try:
        history_context = ""
        if state.get('chat_history'):
            history_context = "PREVIOUS CONVERSATION:\n"
            for msg in state['chat_history'][-5:]:
                if msg['role'] == 'user':
                    history_context += f"User: {msg['content']}\n"
                else:
                    history_context += f"Assistant: {msg['content']}\n"
            history_context += "\n"
        
        prompt = f"""
        You are an expert SQL programmer. Based on the user's natural language request, generate a valid, efficient MySQL query.

        {history_context}

        USER REQUEST: "{state['user_input']}"

        {schema_prompt}

        IMPORTANT:
        1. Generate only a SELECT query - no other SQL statements
        2. Return only the SQL query without any explanations or markdown formatting
        3. Use proper JOIN syntax to connect related tables
        4. Use the `DISTINCT` keyword if the result should contain unique rows, like a list of unique students or unique products.
        5. Include appropriate WHERE clauses to filter results
        6. Use meaningful column aliases when needed
        7. Consider the conversation history when interpreting the current request

        Now generate the SQL query for the user request above.
        """
        
        response = llm.invoke(prompt)
        sql_query = response.content.strip()
        
        sql_query = re.sub(r'```sql|```', '', sql_query).strip()
        
        return {"sql_query": sql_query, "error": ""}
    except Exception as e:
        return {"error": f"Error generating SQL: {str(e)}"}

def execute_sql(state: AgentState):
    """Execute the SQL query against the database"""
    if state.get('error'):
        return state
        
    try:
        with db_engine.connect() as conn:
            result = conn.execute(text(state['sql_query']))
            rows = result.fetchall()
            columns = result.keys()
            
            result_data = [dict(zip(columns, row)) for row in rows]
            
            return {"query_result": result_data, "error": ""}
    except Exception as e:
        return {"error": f"Error executing SQL: {str(e)}"}

def process_results(state: AgentState):
    """
    Formats the SQL query result into a conversational, human-readable response.
    """
    if state.get('error'):
        return {"response": f"I'm sorry, something went wrong while processing your request: {state['error']}"}

    if not state.get('query_result'):
        return {"response": "I couldn't find any data that matched your request. It's possible there are no records that fit the criteria."}

    try:
        df = pd.DataFrame(state['query_result'])
        
        if len(df) == 1 and len(df.columns) == 1:
            result_text = f"The answer to your question is: {df.iloc[0,0]}."
        else:
            result_text = f"I found {len(df)} records matching your request. Here are the results:\n\n" + df.to_markdown(index=False)

        response_parts = []
        if state.get('show_query', True):
            response_parts.append(f"To get that data, I ran the following SQL query:\n```sql\n{state['sql_query']}\n```")
        
        response_parts.append(result_text)
        response_text = "\n\n".join(response_parts)

        chat_history = state.get('chat_history', [])
        chat_history.append({"role": "user", "content": state['user_input'], "timestamp": datetime.now().isoformat()})
        chat_history.append({"role": "assistant", "content": response_text, "timestamp": datetime.now().isoformat()})
        
        if len(chat_history) > 10:
            chat_history = chat_history[-10:]
        
        return {"response": response_text, "chat_history": chat_history}
    except Exception as e:
        return {"response": f"I had trouble formatting the results. Here is the raw data I retrieved: {str(state['query_result'])}"}

workflow = StateGraph(AgentState)

workflow.add_node("check_intent", check_intent)
workflow.add_node("handle_greeting", handle_greeting)
workflow.add_node("handle_other", handle_other)
workflow.add_node("generate_sql", generate_sql)
workflow.add_node("execute_sql", execute_sql)
workflow.add_node("process_results", process_results)

workflow.set_entry_point("check_intent")
workflow.add_conditional_edges(
    'check_intent',
    lambda x: x['intent'],
    {
        "greeting": "handle_greeting",
        "database_query": "generate_sql",
        "other": "handle_other"
    }
)
workflow.add_edge("handle_greeting", END)
workflow.add_edge("handle_other", END)
workflow.add_edge("generate_sql", "execute_sql")
workflow.add_edge("execute_sql", "process_results")
workflow.add_edge("process_results", END)

app = workflow.compile()

def run_agent(question, show_query=True, chat_history=None):
    """Run the agent with a natural language question"""
    initial_state = {
        "user_input": question, 
        "show_query": show_query,
        "chat_history": chat_history or [],
        "schema_info": schema_prompt
    }
    
    final_state = app.invoke(initial_state)
    
    return final_state

def interactive_chat():
    print("============================================================")
    print("Hey there! I'm your AI database agent.")
    print("You can ask me questions in plain English, and I'll get the data for you.")
    print("============================================================")
    print("\nFeatures:")
    print("- Works with any database schema")
    print("- Maintains conversation history for context")
    print("- Shows generated SQL queries")
    print("============================================================")
    print("Type your questions or use one of these commands:")
    print("- 'hide query' to hide SQL queries in responses")
    print("- 'show query' to show SQL queries in responses")
    print("- 'clear history' to clear conversation history")
    print("- 'show schema' to display database schema")
    print("- 'quit', 'exit', or 'q' to exit")
    print("============================================================")
    
    show_query = True
    chat_history = []
    
    while True:
        user_input = input("\nYour question: ").strip()
        
        if user_input.lower() in ['quit', 'exit', 'q']:
            print("Goodbye! It was a pleasure helping you.")
            break
            
        if not user_input:
            continue
            
        # Handle special commands
        if user_input.lower() == 'hide query':
            show_query = False
            print("Okay, SQL queries will now be hidden in my responses.")
            continue
            
        if user_input.lower() == 'show query':
            show_query = True
            print("Got it. I'll include the SQL queries in my responses from now on.")
            continue
            
        if user_input.lower() == 'clear history':
            chat_history = []
            print("Conversation history cleared. We can start a fresh conversation.")
            continue
            
        if user_input.lower() == 'show schema':
            print("\nHere is the database schema I'm working with:")
            print(schema_prompt)
            continue
            
        print("Processing your question, one moment please...")
        result = run_agent(user_input, show_query, chat_history)
        
        chat_history = result.get('chat_history', chat_history)
        
        print("\n" + result['response'])

if __name__ == "__main__":
    interactive_chat()