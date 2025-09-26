# Data Insights AI Agent
## Problem

Working with databases can be hard for non-technical users.
- People need to learn SQL to get answers from data.
- Writing correct queries is time-consuming and confusing.
- Simple business questions like “How many students are enrolled in Physics?” require technical knowledge.

This slows down decision-making and makes teams dependent on database experts.

## Solution

This project is an AI-powered Database Assistant.
It allows users to type natural language questions (English sentences) and automatically:

1. Understands the question using AI.
2. Converts it into an SQL query with Gemini + LangGraph.
3. Runs the query on the MySQL database.
4. Returns clean, formatted answers in a chatbot style + data tables.

The result: employees can get insights from the database without writing SQL.

## What We Built

We built a system that:

- Acts like a chatbot for your database.
- Converts natural language to SQL queries.
- Returns results as both chat answers and data tables.
- Supports conversation memory (remembers last questions).
- Works with any database schema (not limited to one dataset).

## Dataset

For demo purposes, we used a School Database with:

- **Teachers** – teacher_id, name, department
- **Students** – student_id, name, age, major
- **Courses** – course_id, name, credits
- **Lectures** – lecture_id, course_id, teacher_id, topic, date
- **Enrollments** – enrollment_id, student_id, course_id

These tables are connected with foreign keys (e.g., students → enrollments → courses).

## Backend

- app.py
  - Loads database schema dynamically.
  - Uses LangGraph to build workflow of intent detection → SQL generation → execution → response formatting.
  - Uses Gemini API for natural language to SQL conversion.
- server.py
  - Flask REST API (/chat).
  - Frontend sends user questions here.
  - Calls run_agent() from app.py.

 ## Frontend

- Built with React + Tailwind CSS.
- Features:
  - Left panel: chatbot interface (talk with AI agent).
  - Right panel: data table view (clean results).
  - SQL query display with copy to clipboard.
  - Loading state: “Assistant is thinking…”

## Tech Stack

- **Frontend:** React, Tailwind CSS, Axios
- **Backend:** Flask, Flask-CORS, SQLAlchemy, Pandas
- **AI:** LangGraph, Gemini API (Google Generative AI)
- **Database:** MySQL (Workbench 8.0)

## How It Works

1. User enters a question like:
  “Show me all students enrolled in Computer Science.”
2. Frontend sends request → Flask backend (/chat).
3. Backend workflow:
  - Detect intent (greeting / query / other).
  - If query → Gemini generates SQL using schema.
  - SQLAlchemy executes query on MySQL.
  - Results are formatted into chat + markdown table.
4. Response goes back to frontend:
  - Chat message explains the answer.
  - SQL query shown separately.
  - Results displayed in a table view.

## Requirements
### Backend requires:

- flask
- flask-cors
- sqlalchemy
- pymysql
- pandas
- python-dotenv
- langchain
- langgraph
- langchain-google-genai
- google-generativeai

### Frontend requires:

- react
- tailwindcss
- axios

## Screenshots

<img width="1919" height="904" alt="image" src="https://github.com/user-attachments/assets/101e7ecd-232e-4ba3-a92e-e520fd09bd39" />
<img width="1919" height="903" alt="image" src="https://github.com/user-attachments/assets/dfc5d6cb-6cfd-4cf5-bf21-b03d3ebc5cfb" />
<img width="1919" height="901" alt="image" src="https://github.com/user-attachments/assets/d8c1d1ee-42bd-408d-afeb-e4d02f7efcb0" />
