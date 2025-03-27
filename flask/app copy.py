from flask import Flask, request, jsonify
import requests
from bs4 import BeautifulSoup

from flask_cors import CORS
from transformers import pipeline, TextStreamer
import re
from email_utils import send_email
from db_utils import save_template
import threading
import os
from dotenv import load_dotenv
load_dotenv()
import torch

# Check if CUDA is available
USE_CUDA = torch.cuda.is_available()
device = "cuda" if USE_CUDA else "cpu"
print(f"CUDA Available: {USE_CUDA}, Using Device: {device}")


#testing
TEST_MODE = os.environ.get("TEST_MODE") == "1"


app = Flask(__name__)

# Enable CORS for all routes
CORS(app)

# Credentials
SENDER_EMAIL = "crisiseventtemplant@gmail.com"
SENDER_PASSWORD = "awhh hmvo syfp yiyn"  # Use env vars in prod!


#the backgorund generation - now the endpoints just generate a autogenerated response 
# while the actual tempante generation happens in this method 
def background_generate_and_notify(user, category, source_text):
    try:
        if TEST_MODE:
            print("Running in TEST MODE")
            template = f"<dummy-tag> Template for {category} generated from test input."
            attributes = ["dummy-tag"]
        else:
            template = generate_template(category, source_text)
            attributes = parse_attributes(template)

        # Save to MongoDB
        result = save_template(user['email'], category, template, attributes)

        # Verify insert
        if result and result.inserted_id:
            print(f"[MongoDB] Inserted Template for {user['email']} with ID: {result.inserted_id}")
        else:
            print(f"[MongoDB] Failed to insert Template for {user['email']}")

        # Send email
        body = (
            f"Hi {user['name']},\n\n"
            f"Your Template for '{category}' has been generated.\n\n"
            f"Template:\n{template}\n\n"
            f"Attributes: {', '.join(attributes)}\n\n"
            "You can now return to the site to view the summary."
        )
        send_email(SENDER_EMAIL, SENDER_PASSWORD, user['email'],
                   f"Your {category} Template is Ready!", body)

    except Exception as e:
        print(f"Error in background processing: {e}")





# --- 1) SETUP THE MODEL IN A GLOBAL SCOPE ---
# It is generally better to load large models once on application start.
# This can help avoid re-initializing the model on every request.
# One issue is that your model is large (16GB). Ensure your environment can handle it.
try:
    text_generation_pipeline = pipeline("text-generation", 
        model="TheBloke/CapybaraHermes-2.5-Mistral-7B-GGUF",  # Use a long-context model
        # max_length=2048,  # Increase max tokens
        truncation=True,  # Ensure no overflow issues)
        device=0 if USE_CUDA else -1  # Use GPU if available, otherwise CPU
    )
except Exception as e:
    text_generation_pipeline = None
    print(f"Failed to load model pipeline. Error: {e}")

# --- 2) HELPER FUNCTIONS (SCRAPE, GENERATE SUMMARY, PARSE) ---

def scrape_body_text(url):
    """
    Given a URL, scrape all text content contained in <p> tags.
    Return the combined text as a string.
    """
    response = requests.get(url)
    if response.status_code != 200:
        raise ValueError(f"Received non-200 status code while scraping: {response.status_code}")
    soup = BeautifulSoup(response.content, 'html.parser')
    paragraphs = soup.find_all('p')
    body_text = "\n".join([p.get_text() for p in paragraphs])
    return body_text


def generate_template(disaster_type: str, disaster_context: str) -> str:
    prompt = f"""
You are a professional news reporter whose job is to create a summary template for {disaster_type}. Identify key attributes across all given examples and structure them into a standardized 5-sentence format.

Each context paragraph describes a past {disaster_type} event. Your goal is to generate ONE summary template with key attributes left as tags in this format: <example-attribute>. The template must be specific to {disaster_type}.

### Example Format:
<hurricane-name> made landfall as a <category> hurricane, impacting <primary-location> with <primary-impact>. 
The storm caused <death-toll> deaths and resulted in <damage-cost> in damages. 
<secondary-impact> displaced thousands and left widespread destruction. 
The response and recovery efforts were <response-evaluation>. 
<unique-extra-info>.

### Generate a template for {disaster_type}:
Return the template below, using <tags> for key attributes.

{disaster_context}
---
**Return only the template in the requested format. No explanations, no additional text.**"""

    messages = [{"role": "system", "content": prompt}]

    streamer = TextStreamer(text_generation_pipeline.tokenizer)

    # Generate text
    response = text_generation_pipeline(prompt, max_length=512, streamer=streamer)
    
    return response[0]["generated_text"].strip()


def parse_attributes(template: str) -> list[str]:
    attributes = re.findall(r"<(.*?)>", template)

    return attributes

# --- 3) FLASK ENDPOINTS ---

@app.route('/', methods=['GET'])
def index():
    """
    A simple health-check endpoint.
    """
    return jsonify({"message": "Server is up and running"}), 200

@app.route('/generate_from_url', methods=['POST'])
def generate_from_url():
    """
    This endpoint accepts a URL, disaster category, and email.
    It:
    1. Scrapes the text from the URL.
    2. Immediately returns a response to the user saying the Template is being generated.
    3. In the background:
        - Generates the Template using the model
        - Extracts attributes
        - Saves it to MongoDB
        - Emails the user
    """
    data = request.get_json()

    if not data or 'url' not in data or 'category' not in data or 'email' not in data:
        return jsonify({"error": "Request JSON must contain 'url', 'category', and 'email'."}), 400

    url = data['url']
    category = data['category']
    recipient_email = data['email']

    try:
        # Scrape the article content
        scraped_content = scrape_body_text(url)

        # Launch generation and email in background
        thread = threading.Thread(
            target=background_generate_and_notify,
            args=(recipient_email, category, scraped_content)
        )
        thread.start()

        # Immediate response to user
        return jsonify({
            "message": "Your Template is being generated. You will receive an email when it's ready."
        }), 202

    except Exception as e:
        return jsonify({"error": f"Failed to process request: {e}"}), 500


@app.route('/generate_from_text', methods=['POST'])
def generate_from_text():
    """
    This endpoint accepts raw disaster text, disaster category, and user object.
    It:
    1. Immediately returns a response to the user saying the Template is being generated.
    2. In the background:
        - Generates the Template using the model
        - Extracts attributes
        - Saves it to MongoDB
        - Emails the user
    """
    data = request.get_json()

    if not data or 'text' not in data or 'category' not in data or 'user' not in data:
        return jsonify({"error": "Request JSON must contain 'text', 'category', and 'user' object."}), 400

    raw_text = data['text']
    category = data['category']
    user = data['user']

    if not all(key in user for key in ['name', 'email', '_id', 'role']):
        return jsonify({"error": "User object must contain 'name', 'email', '_id', and 'role'."}), 400

    try:
        # Launch generation and email in background
        thread = threading.Thread(
            target=background_generate_and_notify,
            args=(user, category, raw_text)
        )
        thread.start()

        # Immediate response to user
        return jsonify({
            "message": "Your Template is being generated. You will receive an email when it's ready."
        }), 202

    except Exception as e:
        return jsonify({"error": f"Failed to process request: {e}"}), 500



# --- 4) RUN THE SERVER ---
if __name__ == '__main__':
    # debug=True reloads code automatically, only use for development
    app.run(host='0.0.0.0', port=5000, debug=True)
