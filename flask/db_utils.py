# db_utils.py

from pymongo import MongoClient
import datetime

client = MongoClient("mongodb://localhost:27017")
db = client["capstone"]
templates_collection = db["generated_templates"]



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

