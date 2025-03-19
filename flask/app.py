from flask import Flask, request, jsonify
import requests
from bs4 import BeautifulSoup
from transformers import pipeline
from flask_cors import CORS
import re

app = Flask(__name__)

# Enable CORS for all routes
CORS(app)

# --- 1) SETUP THE MODEL IN A GLOBAL SCOPE ---
# It is generally better to load large models once on application start.
# This can help avoid re-initializing the model on every request.
# One issue is that your model is large (16GB). Ensure your environment can handle it.
try:
    text_generation_pipeline = pipeline("text2text-generation", 
        model="google/flan-t5-large",  # Use a long-context model
        max_length=2048,  # Increase max tokens
        truncation=True  # Ensure no overflow issues)
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
You are a professional news reporter whose job is to create a summary template for {disaster_type}. You should pick up on key attributes found across all the given paragraphs.

Each context paragraph is a separate instance of a {disaster_type} event that has happened. 
Your goal is to return ONE 5 sentence summary template that has key attributes left as tags in this format <example-attribute>. 
The template should end with a tag specifically for unique/extra info about a specific {disaster_type}.

Only use the provided summaries of crisis events

For example, the template for a hurricane would look like this:

<hurricane-name> made landfall as a <category> hurricane, impacting <primary-location> with <primary-impact>. 
The storm caused <death-toll> deaths and resulted in <damage-cost> in damages. 
<secondary-impact> displaced thousands and left widespread destruction. 
The response and recovery efforts were <response-evaluation>. 
<unique-extra-info>.

RETURN ONLY THE TEMPLATE IN THE DESCRIBED FORMAT, NO OTHER TEXT.
ONLY RETURN ONE TEMPLATE THAT COULD BE USED FOR THE DISASTER TYPE 
MAKE SURE THE ATTRIBUTES/TEMPLATE ARE SPECIFIC TO THAT DISASTER TYPE AND ARE SURROUNDED BY THE <>.

--

    """

    messages = [
        {"role": "system", "content": prompt},
        {"role": "user", "content": disaster_context},
    ]

    response = text_generation_pipeline(prompt, max_length=2048)

    print(response)
    template = response[0]["generated_text"]  # Directly access the generated string

    print("made it here")
    return template

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
    Endpoint that accepts JSON with 'url' and 'categories'.
    1) Scrape the text from the URL.
    2) Generate the summary using the pipeline.
    3) Parse the summary text into a dictionary.
    4) Return JSON response.
    Example JSON body:
    {
        "url": "https://some-news-article",
        "category": "hurricane"
    }
    """
    data = request.get_json()
    
    # Validate the incoming request JSON
    if not data or 'url' not in data or 'category' not in data:
        return jsonify({"error": "Request JSON must contain 'url' and 'category'."}), 400

    url = data['url']
    category = data['category']

    if not isinstance(category, str):
        return jsonify({"error": "'category' must be strings."}), 400

    if text_generation_pipeline is None:
        return jsonify({"error": "Text generation pipeline is not loaded on the server."}), 500

    try:
        # Step 1: Scrape
        scraped_content = scrape_body_text(url)

        # Step 2: Generate
        template = generate_template(category, scraped_content)

        # Step 3: Parse
        attributes = parse_attributes(template)

        # Return JSON
        return jsonify({
            "template": template,
            "attributes": attributes 
        }), 200

    except Exception as e:
        return jsonify({"error": f"An error occurred during summarization: {e}"}), 500

@app.route('/generate_from_text', methods=['POST'])
def generate_from_text():
    """
    Alternative endpoint that accepts raw text (instead of a URL) and returns the model generation
    based on user-provided category.
    Example JSON body:
    {
        "text": "some raw text about a disaster event...",
        "category": "hurricane"
    }
    """
    data = request.get_json()
    if not data or 'text' not in data or 'category' not in data:
        return jsonify({"error": "Request JSON must contain 'text' and 'category'."}), 400

    text = data['text']
    category = data['category']

    if text_generation_pipeline is None:
        return jsonify({"error": "Text generation pipeline is not loaded on the server."}), 500

    try:
        template = generate_template(category, text)
        attributes = parse_attributes(template)

        # Return JSON
        return jsonify({
            "template": template,
            "attributes": attributes 
        }), 200

    except Exception as e:
        return jsonify({"error": f"An error occurred: {e}"}), 500

# --- 4) RUN THE SERVER ---
if __name__ == '__main__':
    # debug=True reloads code automatically, only use for development
    app.run(host='0.0.0.0', port=5000, debug=True)
