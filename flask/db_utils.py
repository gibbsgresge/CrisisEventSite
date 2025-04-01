# db_utils.py

from bson import ObjectId
from pymongo import MongoClient
import datetime

client = MongoClient("mongodb://localhost:27017")
db = client["capstone"]
templates_collection = db["generated_templates"]

summaries_collection = db["generated_summaries"]



def save_template(recipient, category, template, attributes):
    now = datetime.datetime.now()
    formatted_time = now.strftime("%Y-%m-%d %H:%M:%S")
    result = templates_collection.insert_one({
        "recipient": recipient,
        "category": category,
        "template": template,
        "attributes": attributes,
        "created_at": formatted_time
    })
    return result

def get_template_by_id(template_id):
    try:
        template = templates_collection.find_one({"_id": ObjectId(template_id)})
        return template
    except Exception as e:
        print(f"Error retrieving template: {e}")
        return None

def save_summary(recipient, category, summary, title):
    now = datetime.datetime.now()
    formatted_time = now.strftime("%Y-%m-%d %H:%M:%S")
    result = summaries_collection.insert_one({
        "recipient": recipient,
        "category": category,
        "summary": summary,
        "title": title,
        "created_at": formatted_time
    })
    return result

