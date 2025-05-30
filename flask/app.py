from flask import Flask, request, jsonify
import requests
from bs4 import BeautifulSoup

from flask_cors import CORS
from transformers import pipeline, TextStreamer
import re
from email_utils import send_email
from db_utils import save_template, save_summary, get_template_by_id
import threading
import os
from dotenv import load_dotenv
import torch
import time
import asyncio
import aiohttp



from langchain.llms import LlamaCpp
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from huggingface_hub import hf_hub_download

load_dotenv()

# Check if CUDA is available
print("torch version", torch.__version__)  # Check PyTorch version
print("cuda version", torch.version.cuda)  # Check the CUDA version PyTorch is built with. if none, only cpu version of torch is installed
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

# --- 1) SETUP THE MODEL IN A GLOBAL SCOPE ---
# It is generally better to load large models once on application start.
# This can help avoid re-initializing the model on every request.
# One issue is that your model is large (16GB). Ensure your environment can handle it.
# try:
#     text_generation_pipeline = pipeline("text-generation", 
#         model="TheBloke/CapybaraHermes-2.5-Mistral-7B-GGUF",  # Use a long-context model
#         # max_length=2048,  # Increase max tokens
#         truncation=True,  # Ensure no overflow issues)
#         device=0 if USE_CUDA else -1  # Use GPU if available, otherwise CPU
#     )
# except Exception as e:
#     text_generation_pipeline = None
#     print(f"Failed to load model pipeline. Error: {e}")
# Load LlamaCpp model - Adjust with your Llama model path
model_path = hf_hub_download(repo_id="TheBloke/CapybaraHermes-2.5-Mistral-7B-GGUF", filename="capybarahermes-2.5-mistral-7b.Q4_K_M.gguf", cache_dir=".")

# The number of layers of the model that are offloaded to your GPU (Graphics Processing Unit).
# In a transformer (LLM) model, the model architecture is often composed of multiple layers. Each layer performs a specific transformation on the input data.
# Offloading layers to the GPU can significantly accelerate computations, as GPUs are optimized for parallel processing.
n_gpu_layers = -1  # Metal set to 1 is enough. If -1, all layers are offloaded.

# how many tokens are processed in parallel for prediction, default is 8. You can set to a bigger number
n_batch = 512  # Should be between 1 and n_ctx, consider the amount of RAM of your Apple Silicon Chip / CUDA GPU.

# The context size is the maximum number of tokens that the model can account for when processing a response. this includes the prompt, and the response itself, so the context needs to be set large enough for both the question, and answer. The important thing to note, is that the model must process its own response as part of the context in order to write it, since it can only predict one token at a time
# Most models are trained with a context size of 2048. Going over a models context limit is advised against, since it hasn't been trained to account for data sets larger than its suggested context limit.
# If n_ctx is set higher than 512, the model will process the input in chunks of 512 tokens at a time.
# This means it will generate text based on the most recent 512 tokens of context, potentially leading to inconsistencies if the context spans beyond that window.
n_ctx = 7000

#   if top_k > 0: keep only top k tokens with highest probability (top-k filtering). (I didn't use here)
top_k = None

#   if top_p < 1.0: keep the top tokens with cumulative probability >= top_p (nucleus filtering).
top_p = 0.8

# Number of tokens to generate
# Default: Unlimited, depending on n_ctx.
max_tokens = 4000

# Explained in the slides
temperature = 0.2

llm = LlamaCpp(
      model_path=model_path,
      n_gpu_layers=n_gpu_layers,
      n_batch=n_batch,
      f16_kv=True,  # MUST set to True, otherwise you will run into problem after a couple of calls if Metal.
    #   callbacks=callback_manager,
      n_ctx=n_ctx,
      max_tokens=max_tokens,
      temperature=temperature, # Critical for good results
      top_p=top_p,
  )

# --- 2) HELPER FUNCTIONS (SCRAPE, GENERATE SUMMARY, PARSE) ---
#the backgorund generation - now the endpoints just generate a autogenerated response 
# while the actual tempante generation happens in this method 
def background_generate_and_notify(user, category, source_text):
    try:
        if TEST_MODE:
            print("Running in TEST MODE")
            template = f"<dummy-tag> Template for {category} generated from test input."
            attributes = ["dummy-tag"]
        else:
            start_time = time.time()  # Start timer
            template = generate_template(category, source_text)
            end_time = time.time()  # End timer
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
            f"Template generation took {end_time - start_time:.2f} seconds\n\n"
            "You can now return to the site to view the summary."
        )
        if (user['emailNotifications'] == True):
            send_email(SENDER_EMAIL, SENDER_PASSWORD, user['email'],
                    f"Your {category} Template is Ready!", body)

    except Exception as e:
        print(f"Error in background processing: {e}")

async def fetch_article(session, url):
    #this is to trick the website to think we are not bot
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Connection": "keep-alive",
    }
    try:
        async with session.get(url, headers=headers, timeout=10) as response:
            html = await response.text()
            soup = BeautifulSoup(html, "html.parser")
            paragraphs = soup.find_all("p")
            return "\n".join([p.get_text() for p in paragraphs])
    except Exception as e:
        print(f"[ERROR] Fetching {url}: {e}")
        return ""


async def scrape_all(urls):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_article(session, url) for url in urls]
        return await asyncio.gather(*tasks)

def summarize_with_llm(article_text: str, category: str) -> str:
    prompt_template = PromptTemplate(
        input_variables=["article_text", "category"],
template = """
You are an expert crisis event summarizer.

Your task is to analyze the following news article about a {category} and extract **as many relevant facts and insights as possible**.

Focus on:
- Where the event occurred
- When it happened
- Who was affected (people, communities, organizations)
- What exactly happened (cause, scale, damage)
- How authorities or officials responded (evacuations, policies, statements)
- Broader context if mentioned (patterns, comparisons, history)

Avoid any personal opinions or vague statements.
Do not add any irrelevant informations thats not related to {category} such as advertisements
Present the summary in **7–10 detailed LINES OF PARAGRAPH**, keeping it objective and information-rich. This summary will be used in a later step to generate a high-level overview across multiple articles.
Just give me summary test do not add any heading.
### Article:
{article_text}
"""


    )
    chain = LLMChain(llm=llm, prompt=prompt_template)
    try:
        return chain.run(article_text=article_text, category=category).strip()
    except Exception as e:
        print(f"[ERROR] Failed to summarize article with LLM: {e}")
        return ""

def summarize_multiple_summaries(combined: str, category: str, template, attributes):
    prompt_template = PromptTemplate(
    input_variables=["category", "combined", "template"],
    template="""
        You are an expert crisis analysis assistant.

        Below is a list of summaries from different news articles, all related to the same type of crisis event: a {category}.

        Your task is to analyze these summaries and extract the necessary details to fill in the placeholders within the provided template.

        The placeholders are enclosed in angle brackets (e.g., <magnitude>, <primary-affected-location>). Each placeholder should be replaced with the most relevant information from the summaries.

        ### Multiple Summaries:
        {combined}

        ### Template:
        {template}

        Carefully extract the information and replace each placeholder with the most appropriate details found in the summaries. Ensure accuracy, clarity, and objectivity in the final filled-out template.
    """
)

    chain = LLMChain(llm=llm, prompt=prompt_template)
    
    try:
        return chain.run(category=category, combined=combined, template=template).strip()
    except Exception as e:
        print(f"[ERROR] Failed to summarize combined summaries: {e}")
        return ""

def background_generate_from_urls_and_notify(user, category, template_id, urls):
    try:
        print(f"[INFO] Starting scrape for {len(urls)} URLs")
        start_time = time.time()
        all_texts = asyncio.run(scrape_all(urls))

        summaries = []
        for idx, text in enumerate(all_texts):
            if not text or len(text.strip()) < 100:
                continue
            print(f"[INFO] Summarizing article {idx+1}/{len(all_texts)}")
            summary = summarize_with_llm(text, category)
            if summary:
                summaries.append(summary)

        combined_summary = "\n".join(summaries)

        # get template
        template = get_template_by_id(template_id)

        print(f"[INFO] Starting final summary generation")
        final_summary = summarize_multiple_summaries(combined_summary, category, template['template'], template['attributes'])
        print(f"[INFO] Starting title generation")
        title = generate_title(category, final_summary)
        end_time = time.time()

        result = save_summary(user, category, final_summary, title)

        if result and result.inserted_id:
            print(f"[MongoDB] Inserted Summary for {user['email']} with ID: {result.inserted_id}")
        else:
            print(f"[MongoDB] Failed to insert Summary for {user['email']}")

        body = (
            f"Hi {user['name']},\n\n"
            f"Your summary for '{category}' has been generated from {len(summaries)} articles.\n\n"
            f"Summary:\n{final_summary}\n\n"
            f"Summary generation took {end_time - start_time:.2f} seconds\n\n"
            "You can now return to the site to view the summary."
        )
        if (user['emailNotifications'] == True):
            send_email(SENDER_EMAIL, SENDER_PASSWORD, user['email'],
                    f"Your {category} Summary is Ready!", body)

    except Exception as e:
        print(f"[ERROR] Background processing failed: {e}")



def generate_template(disaster_type: str, disaster_context: str) -> str:
    template = """You are a professional news reporter. Your task is to generate a generalized summary template for {disaster_type}, ensuring that it applies to any event of this type.

Each input paragraph describes a past {disaster_type} event. Identify common key attributes across all examples and structure them into a standardized template.

Instructions:
The template must be fully generalized for {disaster_type}s—DO NOT insert specific details from the given context.  
Use descriptive placeholder tags in this format: <attribute-name>.  
DO NOT add extra commentary or change the output structure.  
The template must remain neutral and applicable to all {disaster_type} events.
The template must end with a <unique-extra-info> tag for unique info about a specific {disaster_type}.

Here are some examples of summaries that were used to create a template for a Hurricane disaster.
Context of Hurricanes:
Hurricane Katrina made landfall on August 29, 2005, as a Category 3 hurricane along the Gulf Coast, primarily affecting Louisiana and Mississippi. It caused catastrophic flooding in New Orleans due to levee failures and had maximum sustained winds of 175 mph. Coastal areas experienced significant storm surge. The aftermath involved widespread displacement and long-term recovery efforts.
Hurricane Maria struck Puerto Rico on September 20, 2017, as a Category 4 hurricane with winds reaching 155 mph. It caused widespread devastation to infrastructure, including power grids and communication systems. The entire island experienced significant damage, and recovery took years. Heavy rainfall led to severe flooding and landslides.
Generated Template:
Hurricane <hurricane-name> was a Category <category> hurricane that affected <primary-affected-location> and caused <primary-effect> on <hurricane-date>. The hurricane had winds up to <max-wind-speed>. Hurricane <hurricane-name> also affected <secondary-affected-area>. <unique-extra-info>.

Here are some examples of summaries that were used to create a template for a Wildfire disaster.
Context of Wildfires:
The Camp Fire in November 2018 in Northern California rapidly spread through dry vegetation, destroying the town of Paradise and causing significant loss of life. High winds and dry conditions fueled the fire, which burned over 153,000 acres and destroyed thousands of structures. The investigation pointed to a power line as the ignition source.
The Australian bushfires of 2019-2020 were unprecedented in scale, burning millions of hectares across multiple states. Prolonged drought and extreme heat created highly flammable conditions. The fires resulted in significant ecological damage, loss of wildlife, and widespread smoke pollution affecting major cities. Multiple ignition sources, including lightning and human activity, were identified.
Generated Template:
Wildfire <wildfire-name> began on <start-date> and burned approximately <acres-burned> acres in <primary-affected-region>, impacting <number-of-structures> structures. The cause of the wildfire is currently <cause-of-fire>. Evacuation orders were issued for <evacuated-areas>. <unique-extra-info>.

Now given the follow context, create a template for {disaster_type}s like the examples above:
{disaster_context}

Return ONLY the structured template above without explanations or additional text.
"""

    prompt = PromptTemplate(input_variables=["disaster_type", "disaster_context"], template=template)
    chain = LLMChain(llm=llm, prompt=prompt)
    
    # Run the prompt through LangChain
    result = chain.run(disaster_type=disaster_type, disaster_context=disaster_context)
    
    return result.strip()


def parse_attributes(template: str) -> list[str]:
    attributes = re.findall(r"<(.*?)>", template)

    return attributes


def generate_title(category: str, summary_or_template_text: str) -> str:
    prompt_template = PromptTemplate(
        input_variables=["category", "summary_text"],
        template="""
        You are an expert news aggregator. Generate a short, catchy, and informative title for a text about a {category}. 
        Below is the text that needs a title. 
        - Keep it less than 5 words. 
        - Avoid extra details or filler.

        ### Text:
        {summary_text}

        Give me a title only.
        """
    )

    chain = LLMChain(llm=llm, prompt=prompt_template)
    
    try:
        return chain.run(category=category, summary_text=summary_or_template_text).strip()
    except Exception as e:
        print(f"[ERROR] Failed to generate title: {e}")
        return "Untitled"

# --- 3) FLASK ENDPOINTS ---

@app.route('/', methods=['GET'])
def index():
    """
    A simple health-check endpoint.
    """
    return jsonify({"message": "Server is up and running"}), 200

@app.route('/generate-summary', methods=['POST'])
def generate_summary():
    data = request.get_json()

    if not data or 'urls' not in data or 'category' not in data or 'template_id' not in data or 'user' not in data:
        return jsonify({"error": "Request JSON must contain 'urls', 'template_id', and 'user' object."}), 400

    urls = data['urls']
    category = data['category']
    template_id = data['template_id']
    user = data['user']

    if not isinstance(urls, list):
        return jsonify({"error": "'urls' must be a list."}), 400

    try:
        thread = threading.Thread(
            target=background_generate_from_urls_and_notify,
            args=(user, category, template_id, urls)
        )
        thread.start()

        return jsonify({
            "message": "Your Summary is being generated. You will receive an email when it's ready."
        }), 202

    except Exception as e:
        return jsonify({"error": f"Failed to process request: {e}"}), 500



@app.route('/generate-template', methods=['POST'])
def generate_template_endpoint():
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

    print(user)

    if not all(key in user for key in ['name', 'email', 'id', 'role']):
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
