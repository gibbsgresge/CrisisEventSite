# db_utils.py

from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
db = client["CrisisEventManager"]
templants_collection = db["generated_templants"]

def save_templant(recipient, category, template, attributes):
    templants_collection.insert_one({
        "recipient": recipient,
        "category": category,
        "template": template,
        "attributes": attributes
    })
