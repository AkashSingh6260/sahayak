import urllib.request
import json

url = "http://localhost:8000/chat"
data = {
    "user_message": "Hello, what is this document about?",
    "session_id": "test_session_1"
}

req = urllib.request.Request(
    url, 
    data=json.dumps(data).encode('utf-8'), 
    headers={'Content-Type': 'application/json'}
)

try:
    print(f"Sending request to {url}...")
    print(f"Input: {data['user_message']}")
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode('utf-8'))
        print("\n--- Response received from Chatbot ---")
        print(result.get("bot_response", result))
except Exception as e:
    print(f"Error communicating with Chatbot: {e}")
