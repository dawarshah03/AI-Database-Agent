from flask import Flask, request, jsonify
from flask_cors import CORS
from app import run_agent

app = Flask(__name__)
CORS(app)

chat_history = []

@app.route("/chat", methods=["POST"])
def chat():
    global chat_history
    data = request.json
    user_input = data.get("message", "")
    show_query = data.get("show_query", True)

    if not user_input:
        return jsonify({"response": "Please provide a message."}), 400

    result = run_agent(user_input, show_query, chat_history)
    chat_history = result.get("chat_history", chat_history)

    return jsonify({"response": result["response"]})


if __name__ == "__main__":
    app.run(debug=True)