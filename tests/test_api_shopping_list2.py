import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../api')))

import pytest
from fastapi.testclient import TestClient
from main import app
from bson import ObjectId
import json

from unittest.mock import MagicMock,patch

from fastapi.testclient import TestClient
from bson import ObjectId
import pytest
from main import app
from groq import Groq

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../api')))

import pytest
from fastapi.testclient import TestClient
from main import app
from bson import ObjectId
import json

from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from bson import ObjectId
import pytest
from main import app


@pytest.fixture
def setup_db():
    """Fixture to mock the database and avoid actual database calls."""
    app.database = MagicMock()
    yield app.database


def full_recipe_mock(object_id):
    """Return a full recipe matching the Recipe model exactly."""
    return {
        "_id": str(object_id),  # ✅ Ensured it's a string, not ObjectId
        "name": "Chocolate Cake",
        "user_email":"test@example.com",
        "cookTime": "1H",
        "prepTime": "30M",
        "totalTime": "1H30M",
        "description": "Delicious chocolate cake.",
        "images": ["https://example.com/cake.jpg"],
        "category": "Dessert",
        "tags": ["chocolate", "cake"],
        "ingredientQuantities": ["2 cups", "1 cup"],
        "ingredients": ["flour", "sugar", "chocolate"],
        "rating": "5",
        "calories": "450",
        "fat": "20",
        "sugar": "30",
        "protein": "6",
        "servings": "8",
        "instructions": ["Mix ingredients", "Bake for 30 minutes"],
        "checked": True,
    }

client = TestClient(app)

def test_get_shopping_list_empty(setup_db):
    """Test getting shopping list for a user with no items"""
    mocked_recipes = [full_recipe_mock(ObjectId()), full_recipe_mock(ObjectId())]
    # Properly mock the cursor with limit()
    cursor_mock = MagicMock()
    cursor_mock.limit.return_value = cursor_mock  # Chain limit() call
    cursor_mock.__iter__.return_value = iter(mocked_recipes)
    setup_db["recipes"].find.return_value = []
    response = client.get("/shopping-list?user_email=test@example.com")
    assert response.status_code == 200
    assert response.json() == {"shopping_list": []}

def test_add_to_shopping_list(setup_db):
    """Test adding items to shopping list"""
    mocked_recipes = [full_recipe_mock(ObjectId()), full_recipe_mock(ObjectId())]
    # Properly mock the cursor with limit()
    cursor_mock = MagicMock()
    cursor_mock.limit.return_value = cursor_mock  # Chain limit() call
    cursor_mock.__iter__.return_value = iter(mocked_recipes)
    setup_db["recipes"].find.return_value = cursor_mock
    items = [
        {
            "name": "Flour",
            "quantity": 2.0,
            "unit": "kg",
            "checked": False,
            "user_email": "test@example.com"
        },
        {
            "name": "Sugar",
            "quantity": 1.0,
            "unit": "kg",
            "checked": False,
            "user_email": "test@example.com"
        }
    ]
    response = client.post("/shopping-list/update", json=items)
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "shopping_list" in data
    assert len(data["shopping_list"]) == 2

def test_get_shopping_list_with_items(setup_db):
    mocked_recipes = [full_recipe_mock(ObjectId()), full_recipe_mock(ObjectId())]
    # Properly mock the cursor with limit()
    cursor_mock = MagicMock()
    cursor_mock.limit.return_value = cursor_mock  # Chain limit() call
    cursor_mock.__iter__.return_value = iter(mocked_recipes)
    setup_db["recipes"].find.return_value = cursor_mock
    """Test getting shopping list after adding items"""
    response = client.get("/shopping-list?user_email=test@example.com")
    assert response.status_code == 200
    data = response.json()
    assert len(data["shopping_list"]) == 2
    assert all(item["user_email"] == "test@example.com" for item in data["shopping_list"])

def test_update_shopping_list_item(setup_db):
    mocked_recipes = [full_recipe_mock(ObjectId()), full_recipe_mock(ObjectId())]
    # Properly mock the cursor with limit()
    cursor_mock = MagicMock()
    cursor_mock.limit.return_value = cursor_mock  # Chain limit() call
    cursor_mock.__iter__.return_value = iter(mocked_recipes)
    setup_db["recipes"].find.return_value = cursor_mock
    setup_db["recipes"].find_one.return_value = mocked_recipes[0]
    """Test updating a shopping list item"""
    # First get an item ID
    response = client.get("/shopping-list?user_email=test@example.com")
    item_id = response.json()["shopping_list"][0]["_id"]
    
    # Update the item
    updated_item = {
        "name": "Flour",
        "quantity": 3.0,
        "unit": "kg",
        "checked": True,
        "user_email": "test@example.com"
    }
    response = client.put(f"/shopping-list/{item_id}", json=updated_item)
    assert response.status_code == 200
    data = response.json()
    print(data)
    # assert data["shopping_list_item"]["quantity"] == 3.0
    assert data["shopping_list_item"]["checked"] == True

# def test_delete_shopping_list_item(setup_db):
#     mocked_recipes = [full_recipe_mock(ObjectId()), full_recipe_mock(ObjectId())]
#     # Properly mock the cursor with limit()
#     cursor_mock = MagicMock()
#     cursor_mock.limit.return_value = cursor_mock  # Chain limit() call
#     cursor_mock.__iter__.return_value = iter(mocked_recipes)
#     setup_db["recipes"].find.return_value = cursor_mock
#     """Test deleting a shopping list item"""
#     # First get an item ID
#     response = client.get("/shopping-list?user_email=test@example.com")
#     item_id = response.json()["shopping_list"][0]["_id"]
    
#     # Delete the item
#     response = client.delete(f"/shopping-list/{item_id}?user_email=test@example.com")
#     assert response.status_code == 200
    
#     # Verify item is deleted
#     response = client.get("/shopping-list?user_email=test@example.com")
#     assert len(response.json()["shopping_list"]) == 1

# def test_add_duplicate_item(setup_db):
#     mocked_recipes = [full_recipe_mock(ObjectId()), full_recipe_mock(ObjectId())]
#     # Properly mock the cursor with limit()
#     cursor_mock = MagicMock()
#     cursor_mock.limit.return_value = cursor_mock  # Chain limit() call
#     cursor_mock.__iter__.return_value = iter(mocked_recipes)
#     setup_db["recipes"].find.return_value = cursor_mock
#     """Test adding duplicate items (should merge quantities)"""
#     items = [
#         {
#             "name": "Flour",
#             "quantity": 1.0,
#             "unit": "kg",
#             "checked": False,
#             "user_email": "test@example.com"
#         }
#     ]
#     response = client.post("/shopping-list/update", json=items)
#     assert response.status_code == 200
#     data = response.json()
#     assert len(data["shopping_list"]) == 2  # Should still have 2 items
#     flour_item = next(item for item in data["shopping_list"] if item["name"] == "Flour")
#     assert flour_item["quantity"] == 4.0  # 3.0 from previous test + 1.0 from this test

# def test_invalid_item_data(setup_db):
#     mocked_recipes = [full_recipe_mock(ObjectId()), full_recipe_mock(ObjectId())]
#     # Properly mock the cursor with limit()
#     cursor_mock = MagicMock()
#     cursor_mock.limit.return_value = cursor_mock  # Chain limit() call
#     cursor_mock.__iter__.return_value = iter(mocked_recipes)
#     setup_db["recipes"].find.return_value = cursor_mock
#     """Test adding items with invalid data"""
#     items = [
#         {
#             "name": "Invalid Item",
#             "quantity": "not a number",  # Invalid quantity
#             "unit": "kg",
#             "checked": False,
#             "user_email": "test@example.com"
#         }
#     ]
#     response = client.post("/shopping-list/update", json=items)
#     assert response.status_code == 422  # Validation error

# def test_get_nonexistent_user(setup_db):
#     mocked_recipes = [full_recipe_mock(ObjectId()), full_recipe_mock(ObjectId())]
#     # Properly mock the cursor with limit()
#     cursor_mock = MagicMock()
#     cursor_mock.limit.return_value = cursor_mock  # Chain limit() call
#     cursor_mock.__iter__.return_value = iter(mocked_recipes)
#     setup_db["recipes"].find.return_value = cursor_mock
#     """Test getting shopping list for non-existent user"""
#     response = client.get("/shopping-list?user_email=nonexistent@example.com")
#     assert response.status_code == 200
#     assert response.json() == {"shopping_list": []}

# def test_delete_nonexistent_item(setup_db):
#     mocked_recipes = [full_recipe_mock(ObjectId()), full_recipe_mock(ObjectId())]
#     # Properly mock the cursor with limit()
#     cursor_mock = MagicMock()
#     cursor_mock.limit.return_value = cursor_mock  # Chain limit() call
#     cursor_mock.__iter__.return_value = iter(mocked_recipes)
#     setup_db["recipes"].find.return_value = cursor_mock
#     """Test deleting a non-existent item"""
#     response = client.delete("/shopping-list/123456789012?user_email=test@example.com")
#     assert response.status_code == 404

# def test_update_nonexistent_item(setup_db):
#     mocked_recipes = [full_recipe_mock(ObjectId()), full_recipe_mock(ObjectId())]
#     # Properly mock the cursor with limit()
#     cursor_mock = MagicMock()
#     cursor_mock.limit.return_value = cursor_mock  # Chain limit() call
#     cursor_mock.__iter__.return_value = iter(mocked_recipes)
#     setup_db["recipes"].find.return_value = cursor_mock
#     """Test updating a non-existent item"""
#     updated_item = {
#         "name": "Nonexistent",
#         "quantity": 1.0,
#         "unit": "kg",
#         "checked": False,
#         "user_email": "test@example.com"
#     }
#     response = client.put("/shopping-list/123456789012", json=updated_item)
#     assert response.status_code == 404 