import requests
from bs4 import BeautifulSoup
from transformers import pipeline
import re

def scrape_body_text(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')

    #get all text in p tags, may not all be the actual article content
    paragraphs = soup.find_all('p')
    body_text = "\n".join([p.get_text() for p in paragraphs])

    return body_text

def generate_summary(content, categories):
    categories_text = "\n".join([f"{category}: []" for category in categories])

    #custom prompt depending on categories passed in
    system_prompt = f"""
    You are an expert at parsing news articles about disaster events.
    Summarize the information about the given article and return it in the following format:
    
    {categories_text}

    Return only the above information.
    Disregard any miscelaneous or extra information in the article.
    REMOVE THE BRACKETS AND RETURN THE TEXT SEPERATED BY A COLON
    DO NOT RETURN ANY EXTRA TEXT.
    """

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": content}
    ]

    #one issue is that this model is 16 gigs
    pipe = pipeline("text-generation", model="allenai/Llama-3.1-Tulu-3-8B")
    summary = pipe(messages, max_length=10_000)

    return summary

def parse_summary_to_dict(summary_text, categories):
    summary_dict = {}
    
    for category in categories:
        #parse string and store the categories as keys and the description text as values
        match = re.search(rf"{category}:\s*(.*)", summary_text, re.IGNORECASE)
        summary_dict[category] = match.group(1).strip() if match else "N/A"

    return summary_dict

#example usage

categories = [
    "Title",
    "Short Description",
    "How Many People Involved",
    "Article Summary",
    "Disaster Type",
    "Location"
]

url = "https://www.yahoo.com/news/officials-declare-california-wildfires-contained-021641057.html"
content = scrape_body_text(url)

summary_text = generate_summary(content, categories)[-1]["generated_text"][-1]["content"]

summary_dict = parse_summary_to_dict(summary_text, categories)
print(summary_dict)