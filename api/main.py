"""

Copyright (C) 2022 SE CookBook - All Rights Reserved
You may use, distribute and modify this code under the
terms of the MIT license.
You should have received a copy of the MIT license with
this file. If not, please write to: help.cookbook@gmail.com

"""

from fastapi.middleware.cors import CORSMiddleware
from routes import router
from pymongo import MongoClient
from fastapi import FastAPI, HTTPException, Query
from models import ShoppingListItem
from bson import ObjectId
from typing import List
import sys
import os
import certifi
from pydantic import BaseModel

sys.path.insert(0, '../')

app = FastAPI()

ca = certifi.where()

print(os.getenv("DB_NAME"))

config = {
    "ATLAS_URI": os.getenv("ATLAS_URI"),
    "DB_NAME": os.getenv("DB_NAME"),
    "GROQ_API_KEY": os.getenv("GROQ_API_KEY"),
    "PORT": os.getenv("PORT")
}

origins = ['http://localhost:3000', "*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.on_event("startup")
def startup_db_client():
    """Initializes the database client when the application starts"""
    app.mongodb_client = MongoClient(config["ATLAS_URI"], tlsCAFile = ca)
    app.database = app.mongodb_client[config["DB_NAME"]]


@app.on_event("shutdown")
def shutdown_db_client():
    """Closes the database client when the application shuts down"""
    app.mongodb_client.close()


app.include_router(router, tags=["recipes"], prefix="/recipe")

""" This api functions is for shopping list."""

class ShoppingListItem(BaseModel):
    name: str
    quantity: float
    unit: str
    checked: bool = False
    user_email: str

@app.get("/shopping-list")
async def get_shopping_list(user_email: str = Query(...)):
    """Fetches the shopping list for a specific user"""
    collection_name = "shopping-list"
    print(user_email, 'user_email')
    if collection_name not in app.database.list_collection_names():
        app.database.create_collection(collection_name)

    shopping_list = list(app.database[collection_name].find({"user_email": user_email}))
    shopping_list = [{**item, "_id": str(item["_id"])} for item in shopping_list]

    return {"shopping_list": shopping_list}

@app.post("/shopping-list/update")
async def update_shopping_list(items: List[ShoppingListItem]):
    """
    Updates the shopping list for a specific user.
    Merges quantities for duplicate items.
    """
    collection_name = "shopping-list"
    print(collection_name, 'collection_name')
    if collection_name not in app.database.list_collection_names():
        app.database.create_collection(collection_name)

    collection = app.database[collection_name]

    # Process each item
    
    for item in items:
        print(item, 'item')
        # Check if item with same name and unit exists for this user
        existing_item = collection.find_one({
            "name": item.name,
            "unit": item.unit,
            "user_email": item.user_email
        })

        if existing_item:
            # Update quantity for existing item
            collection.update_one(
                {"_id": existing_item["_id"]},
                {"$inc": {"quantity": item.quantity}}
            )
        else:
            # Insert new item
            
            collection.insert_one({
                "name": item.name,
                "quantity": item.quantity,
                "unit": item.unit,
                "checked": False,
                "user_email": item.user_email
            })

    
    # Return updated list for this user
    print(items[0].user_email, 'updated till here')
    updated_list = list(collection.find({"user_email": items[0].user_email}))
    updated_list = [{**item, "_id": str(item["_id"])} for item in updated_list]

    return {"message": "Shopping list updated successfully", "shopping_list": updated_list}

@app.put("/shopping-list/{item_id}")
async def update_shopping_list_item(item_id: str, item: ShoppingListItem):
    """Updates a shopping list item for a specific user"""
    collection_name = "shopping-list"
    collection = app.database[collection_name]

    # Verify the item belongs to the user
    existing_item = collection.find_one({
        "_id": ObjectId(item_id),
        "user_email": item.user_email
    })

    if not existing_item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Update the item
    result = collection.update_one(
        {"_id": ObjectId(item_id)},
        {"$set": {
            "name": item.name,
            "quantity": item.quantity,
            "unit": item.unit,
            "checked": item.checked
        }}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update item")

    # Return updated item
    updated_item = collection.find_one({"_id": ObjectId(item_id)})
    updated_item = {**updated_item, "_id": str(updated_item["_id"])}

    return {"message": "Item updated successfully", "shopping_list_item": updated_item}

@app.delete("/shopping-list/{item_id}")
async def delete_shopping_list_item(item_id: str, user_email: str):
    """Deletes a shopping list item for a specific user"""
    collection_name = "shopping-list"
    collection = app.database[collection_name]

    # Verify the item belongs to the user
    existing_item = collection.find_one({
        "_id": ObjectId(item_id),
        "user_email": user_email
    })

    if not existing_item:
        raise HTTPException(status_code=404, detail="Item not found")

    result = collection.delete_one({"_id": ObjectId(item_id)})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")

    return {"message": f"Item with ID {item_id} deleted successfully"}

def get_database():
    """Returns the database connection."""
    return app.database
