from flask import Flask, request, jsonify
import requests
from bs4 import BeautifulSoup
from transformers import pipeline
import re

app = Flask(__name__)

# --- 1) SETUP THE MODEL IN A GLOBAL SCOPE ---
# It is generally better to load large models once on application start.
# This can help avoid re-initializing the model on every request.
# One issue is that your model is large (16GB). Ensure your environment can handle it.
try:
    text_generation_pipeline = pipeline("text-generation", model="allenai/Llama-3.1-Tulu-3-8B")
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

def generate_summary(content, categories):
    """
    Using a text generation pipeline to produce a summary based on `content` and `categories`.
    """
    # Create a categories template
    categories_text = "\n".join([f"{category}: []" for category in categories])
    
    # Create a system prompt that instructs how to summarize
    system_prompt = f"""
    You are an expert at parsing news articles about disaster events.
    Summarize the information about the given article and return it in the following format:
    
    {categories_text}

    Return only the above information.
    Disregard any miscellaneous or extra information in the article.
    REMOVE THE BRACKETS AND RETURN THE TEXT SEPARATED BY A COLON
    DO NOT RETURN ANY EXTRA TEXT.
    """

    # The pipeline expects a prompt string. 
    # If your pipeline is specialized to a Chat-like model, you might have to adapt for "system"/"user" roles differently.
    # Below is an example if the pipeline was purely text-generation based:
    prompt = system_prompt + "\n\n" + content

    # Increase max_length if you expect a long summary, but watch out for memory usage.
    # Temperature or other hyperparameters can be tuned.
    # Example: text_generation_pipeline(prompt, max_length=1000, temperature=0.7)
    # For a chat-based model that expects messages, you’d pass them in a slightly different structure.
    result = text_generation_pipeline(prompt, max_length=2000, do_sample=False)
    
    # result is typically a list of dicts with a "generated_text" key
    if not result or "generated_text" not in result[0]:
        return "ERROR: No output from model."

    summary_text = result[0]["generated_text"]
    return summary_text

def parse_summary_to_dict(summary_text, categories):
    """
    Parse the generated summary text, extracting the text after each 'Category:'.
    Return a dictionary {category -> text}.
    """
    summary_dict = {}
    for category in categories:
        # e.g., if category is "Title", we look for "Title: something"
        # we search with re.IGNORECASE in case the model changes capitalization
        # handle missing or partial matches
        pattern = rf"{category}:\s*(.*)"
        match = re.search(pattern, summary_text, re.IGNORECASE)
        if match:
            # We take everything after 'Category:' up until the next newline
            # or if your model prints them line-by-line, you might want to refine how you parse
            # For now, we just take the entire match to the end of the line.
            captured_text = match.group(1).strip()
            # If the model lumps them together, you could also parse up to the next category
            # but let's keep it simple for now
        else:
            captured_text = "N/A"

        summary_dict[category] = captured_text

    return summary_dict

# --- 3) FLASK ENDPOINTS ---

@app.route('/', methods=['GET'])
def index():
    """
    A simple health-check endpoint.
    """
    return jsonify({"message": "Server is up and running"}), 200

@app.route('/summarize', methods=['POST'])
def summarize():
    """
    Endpoint that accepts JSON with 'url' and 'categories'.
    1) Scrape the text from the URL.
    2) Generate the summary using the pipeline.
    3) Parse the summary text into a dictionary.
    4) Return JSON response.
    Example JSON body:
    {
        "url": "https://some-news-article",
        "categories": ["Title","Short Description","How Many People Involved","Article Summary","Disaster Type","Location"]
    }
    """
    data = request.get_json()
    
    # Validate the incoming request JSON
    if not data or 'url' not in data or 'categories' not in data:
        return jsonify({"error": "Request JSON must contain 'url' and 'categories'."}), 400

    url = data['url']
    categories = data['categories']

    # Optional: limit the length of categories or do additional validations
    if not isinstance(categories, list) or not all(isinstance(cat, str) for cat in categories):
        return jsonify({"error": "'categories' must be a list of strings."}), 400

    if text_generation_pipeline is None:
        return jsonify({"error": "Text generation pipeline is not loaded on the server."}), 500

    try:
        # Step 1: Scrape
        scraped_content = scrape_body_text(url)

        # Step 2: Generate
        summary_text = generate_summary(scraped_content, categories)

        # Step 3: Parse
        summary_dict = parse_summary_to_dict(summary_text, categories)

        # Return JSON
        return jsonify({
            "summary": summary_dict,
            "raw_generation": summary_text  # in case you want to see the raw generation
        }), 200

    except Exception as e:
        return jsonify({"error": f"An error occurred during summarization: {e}"}), 500

@app.route('/prompt', methods=['POST'])
def prompt():
    """
    Alternative endpoint that accepts raw text (instead of a URL) and returns the model generation
    based on user-provided categories.
    Example JSON body:
    {
        "text": "some raw text about a disaster event...",
        "categories": ["Title", "Short Description", "Disaster Type", "Location"]
    }
    """
    data = request.get_json()
    if not data or 'text' not in data or 'categories' not in data:
        return jsonify({"error": "Request JSON must contain 'text' and 'categories'."}), 400

    raw_text = data['text']
    categories = data['categories']

    if text_generation_pipeline is None:
        return jsonify({"error": "Text generation pipeline is not loaded on the server."}), 500

    try:
        summary_text = generate_summary(raw_text, categories)
        summary_dict = parse_summary_to_dict(summary_text, categories)

        return jsonify({
            "summary": summary_dict,
            "raw_generation": summary_text
        }), 200

    except Exception as e:
        return jsonify({"error": f"An error occurred: {e}"}), 500

# --- 4) RUN THE SERVER ---
if __name__ == '__main__':
    # debug=True reloads code automatically, only use for development
    app.run(host='0.0.0.0', port=5000, debug=True)
