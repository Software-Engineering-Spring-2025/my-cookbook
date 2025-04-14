import pytest
from fastapi.testclient import TestClient
from main import app
from bson import ObjectId
import json

client = TestClient(app)

def test_get_shopping_list_empty():
    """Test getting shopping list for a user with no items"""
    response = client.get("/shopping-list?user_email=test@example.com")
    assert response.status_code == 200
    assert response.json() == {"shopping_list": []}

def test_add_to_shopping_list():
    """Test adding items to shopping list"""
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

def test_get_shopping_list_with_items():
    """Test getting shopping list after adding items"""
    response = client.get("/shopping-list?user_email=test@example.com")
    assert response.status_code == 200
    data = response.json()
    assert len(data["shopping_list"]) == 2
    assert all(item["user_email"] == "test@example.com" for item in data["shopping_list"])

def test_update_shopping_list_item():
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
    assert data["shopping_list_item"]["quantity"] == 3.0
    assert data["shopping_list_item"]["checked"] == True

def test_delete_shopping_list_item():
    """Test deleting a shopping list item"""
    # First get an item ID
    response = client.get("/shopping-list?user_email=test@example.com")
    item_id = response.json()["shopping_list"][0]["_id"]
    
    # Delete the item
    response = client.delete(f"/shopping-list/{item_id}?user_email=test@example.com")
    assert response.status_code == 200
    
    # Verify item is deleted
    response = client.get("/shopping-list?user_email=test@example.com")
    assert len(response.json()["shopping_list"]) == 1

def test_add_duplicate_item():
    """Test adding duplicate items (should merge quantities)"""
    items = [
        {
            "name": "Flour",
            "quantity": 1.0,
            "unit": "kg",
            "checked": False,
            "user_email": "test@example.com"
        }
    ]
    response = client.post("/shopping-list/update", json=items)
    assert response.status_code == 200
    data = response.json()
    assert len(data["shopping_list"]) == 2  # Should still have 2 items
    flour_item = next(item for item in data["shopping_list"] if item["name"] == "Flour")
    assert flour_item["quantity"] == 4.0  # 3.0 from previous test + 1.0 from this test

def test_invalid_item_data():
    """Test adding items with invalid data"""
    items = [
        {
            "name": "Invalid Item",
            "quantity": "not a number",  # Invalid quantity
            "unit": "kg",
            "checked": False,
            "user_email": "test@example.com"
        }
    ]
    response = client.post("/shopping-list/update", json=items)
    assert response.status_code == 422  # Validation error

def test_get_nonexistent_user():
    """Test getting shopping list for non-existent user"""
    response = client.get("/shopping-list?user_email=nonexistent@example.com")
    assert response.status_code == 200
    assert response.json() == {"shopping_list": []}

def test_delete_nonexistent_item():
    """Test deleting a non-existent item"""
    response = client.delete("/shopping-list/123456789012?user_email=test@example.com")
    assert response.status_code == 404

def test_update_nonexistent_item():
    """Test updating a non-existent item"""
    updated_item = {
        "name": "Nonexistent",
        "quantity": 1.0,
        "unit": "kg",
        "checked": False,
        "user_email": "test@example.com"
    }
    response = client.put("/shopping-list/123456789012", json=updated_item)
    assert response.status_code == 404 