# tests/test_generate.py

import requests
import os

# Enable TEST_MODE for dummy generation
os.environ["TEST_MODE"] = "1"

# The Flask app must already be running on localhost:5000
API_URL = "http://localhost:5000/generate_from_text"

payload = {
    "text": "This is a dummy disaster summary used for testing purposes.",
    "category": "earthquake",
    "email": "gibbsgresge@vt.edu"
}

response = requests.post(API_URL, json=payload)

print("Status Code:", response.status_code)
print("Response JSON:", response.json())
