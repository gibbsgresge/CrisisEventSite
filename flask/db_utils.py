# db_utils.py

from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
db = client["CrisisEventManager"]
templates_collection = db["generated_templates"]

def save_template(recipient, category, template, attributes):
    result = templates_collection.insert_one({
        "recipient": recipient,
        "category": category,
        "template": template,
        "attributes": attributes
    })
    return result

