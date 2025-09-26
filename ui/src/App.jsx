import './App.css'

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

// Helper function to parse a markdown table string into a structured object
const parseMarkdownTable = (markdown) => {
  const lines = markdown.split('\n').filter(line => line.trim().startsWith('|'));
  if (lines.length < 2) return null;

  // Extract headers
  const headerLine = lines[0];
  const headers = headerLine.split('|').map(h => h.trim()).filter(h => h);

  // Extract data rows, skipping the header and separator lines
  const dataRows = lines.slice(2);
  const data = dataRows.map(row => {
    return row.split('|').map(cell => cell.trim()).filter(cell => cell);
  });

  return { headers, data };
};

const App = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll to the bottom of the chat on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Initial welcome message
  useEffect(() => {
    setMessages([{ role: "assistant", content: "Hey there! How can I help you with your data today?" }]);
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setTableData(null);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("http://127.0.0.1:5000/chat", {
        message: input,
        show_query: true,
      });

      const fullResponse = res.data.response;
      let botMessageContent = fullResponse;
      let parsedTable = null;
      let sqlQuery = null;

      // Extract SQL query if present
      const sqlMatch = fullResponse.match(/```sql([\s\S]*?)```/);
      if (sqlMatch && sqlMatch[1]) {
        sqlQuery = sqlMatch[1].trim();
        botMessageContent = botMessageContent.replace(sqlMatch[0], '').trim();
      }

      // Check for markdown table
      const markdownTableMatch = fullResponse.match(/\|.+\|(\n\|.+\|)+/s);
      if (markdownTableMatch) {
        parsedTable = parseMarkdownTable(markdownTableMatch[0]);
        botMessageContent = botMessageContent.replace(markdownTableMatch[0], '').trim();
      }

      const newMessages = [];
      if (botMessageContent) {
        newMessages.push({ role: "assistant", content: botMessageContent });
      }

      if (sqlQuery) {
        newMessages.push({ role: "assistant", content: `\`\`\`sql\n${sqlQuery}\n\`\`\`` });
      }

      if (newMessages.length === 0) {
        newMessages.push({ role: "assistant", content: "I found no text response for your query." });
      }
      
      setMessages((prev) => [...prev, ...newMessages]);
      setTableData(parsedTable);
      
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Server error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) sendMessage();
  };

  const copyToClipboard = (text, index) => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);

    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gradient-to-br from-gray-50 to-gray-200 text-gray-800 font-[Inter] overflow-hidden">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      </style>
      
      {/* Top Header/Navbar */}
      <header className="bg-white shadow-md h-16 flex items-center justify-between px-6 border-b border-gray-200 rounded-b-xl">
        <div className="flex items-center space-x-4">
          <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M12 14l9-5-9-5-9 5 9 5z" />
            <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.057a11.952 11.952 0 00-6.824-2.999 12.078 12.078 0 01.665-6.479L12 14z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.057a11.952 11.952 0 00-6.824-2.999 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900">Data Insights Dashboard</h1>
        </div>
        <div className="flex items-center space-x-3 text-base text-gray-600 font-medium">
          <p>Hi, Dawar Shah</p>
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shadow-md">DS</div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-1 p-6 space-x-6 overflow-hidden">
        
        {/* Left Chat Panel */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-xl border border-gray-200">
          <div className="py-5 px-6 border-b border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900">AI Assistant</h2>
            <p className="text-base text-gray-500">Your data analysis companion</p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thumb-rounded scrollbar-track-rounded scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`px-4 py-3 rounded-2xl text-base max-w-[75%] whitespace-pre-wrap ${
                    msg.role === "user" ? "bg-blue-600 text-white rounded-br-sm shadow-xl" : "bg-white text-gray-800 rounded-bl-sm shadow-md"
                  }`}>
                  {msg.content.includes("```sql") ? (
                    <div className="relative p-3 bg-gray-200 rounded-xl shadow-inner">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-gray-700 uppercase">SQL Query</span>
                        <button
                          onClick={() => copyToClipboard(msg.content.replace(/```sql|```/g, "").trim(), i)}
                          className="p-1 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm"
                        >
                            {copiedIndex === i ? (
                              <span className="text-xs font-semibold text-green-700">Copied!</span>
                            ) : (
                              <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 01-2 2h-2a2 2 0 01-2-2m-2-4h8" />
                              </svg>
                            )}
                        </button>
                      </div>
                      <pre className="text-sm font-mono overflow-x-auto text-gray-800 pt-1">
                        {msg.content.replace(/```sql|```/g, "").trim()}
                      </pre>
                    </div>
                  ) : (
                    <span>{msg.content}</span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-xl text-base max-w-[75%] bg-blue-50 animate-pulse shadow-md">
                  <span className="text-blue-500">Assistant is thinking...</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                placeholder="Ask about your data..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-2xl bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base placeholder-gray-400 transition-all duration-200"
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg ${
                  loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                }`}
              >
                <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Right Data Panel */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-xl border border-gray-200">
          <div className="py-5 px-6 border-b border-gray-200 flex items-center space-x-2">
            <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7-8v8m14-8v8" />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-900">Table Results</h2>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            {tableData ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {tableData.headers.map((header, i) => (
                        <th key={i} scope="col" className="px-6 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tableData.data.map((row, i) => (
                      <tr key={i} className="hover:bg-blue-50 transition-colors">
                        {row.map((cell, j) => (
                          <td key={j} className="px-6 py-4 whitespace-nowrap text-base text-gray-800">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 px-4">
                <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" className="h-28 w-28 mb-6 text-blue-300" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                </svg>
                <p className="text-xl font-semibold text-gray-600 mb-2">No table data to display</p>
                <p className="text-base text-gray-500 max-w-sm">Ask the AI assistant a question about your data to generate a table here.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;