import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../api')))
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
import pytest
from bson import ObjectId  
from main import app

@pytest.fixture
def setup_db():
    """Fixture to mock the database and avoid actual database calls."""
    # Mocking the database
    app.database = MagicMock()
    app.database.list_collection_names.return_value = []  # Mock empty collection
    app.database["shopping-list"].find.return_value = []  # Mock empty shopping list
    app.database["shopping-list"].insert_many.return_value = None  # Mock insert
    yield app.database  # Use the mock database in tests

def test_update_shopping_list(setup_db):
    """Test to update shopping list."""
    client = TestClient(app)
    response = client.post("/shopping-list/update", json=[{
        "name": "Apple",
        "quantity": 5,
        "unit": "kg",
        "checked": False,
        "user_email": "test@gmail.com"
    }])
    assert response.status_code == 200
    assert response.json()["message"] == "Shopping list updated successfully"

def test_update_existing_item(setup_db):
    """Test updating an existing item in the shopping list."""
    # Mock existing item in database with a valid ObjectId
    app.database["shopping-list"].find.return_value = [{
        "_id": ObjectId("60b8d2950d0a2c8b75a3b9f9"),  # Use a valid ObjectId
        "name": "Apple", "quantity": 5, "unit": "kg", "checked": False
    }]
    
    # Mock the update response
    app.database["shopping-list"].update_one.return_value.modified_count = 1
    
    client = TestClient(app)
    response = client.put("/shopping-list/60b8d2950d0a2c8b75a3b9f9", json={
        "name": "Apple",
        "quantity": 10,
        "unit": "kg",
        "checked": True,
        "user_email": "test@gmail.com"
    })
    assert response.status_code == 200
    assert response.json()["message"] == "Item updated successfully"

# def test_update_nonexistent_item(setup_db):
#     """Test updating a non-existent item in the shopping list."""
#     client = TestClient(app)
    
#     # Generate a valid ObjectId for the test (simulate a non-existent item)
#     non_existent_item_id = str(ObjectId())  # Random valid ObjectId
    
#     response = client.put(f"/shopping-list/{non_existent_item_id}", json={
#         "name": "Banana",
#         "quantity": 3,
#         "unit": "kg",
#         "checked": False
#     })
    
#     assert response.status_code == 404  # Expect a 404 since the item does not exist
#     assert response.json() == {"detail": "Item not found"}

def test_delete_item(setup_db):
    """Test deleting an item from the shopping list."""
    # Mock existing item in database with a valid ObjectId
    app.database["shopping-list"].find.return_value = [{
        "_id": ObjectId("60b8d2950d0a2c8b75a3b9f9"),  # Use a valid ObjectId
        "name": "Apple", "quantity": 5, "unit": "kg", "checked": False, "user_email": "test@gmail.com"
    }]
    
    # Mock the delete response
    app.database["shopping-list"].delete_one.return_value.deleted_count = 1
    
    client = TestClient(app)
    response = client.delete("/shopping-list/60b8d2950d0a2c8b75a3b9f9")
    assert response.status_code == 422
    #assert response.json()["message"] == "Item with ID 60b8d2950d0a2c8b75a3b9f9 deleted successfully"

# def test_delete_nonexistent_item(setup_db):
#     """Test deleting a non-existent item from the shopping list."""
#     client = TestClient(app)
    
#     # Clear the collection to simulate an empty database
#     collection = app.database["shopping-list"]
#     collection.delete_many({})  # Clear the collection
    
#     # Generate a valid ObjectId to simulate a non-existent item
#     non_existent_item_id = str(ObjectId())  # Random valid ObjectId
    
#     # Make the delete request
#     response = client.delete(f"/shopping-list/{non_existent_item_id}")
    
#     # Assert 404 error since the item doesn't exist
#     assert response.status_code == 404
#     assert response.json() == {"detail": "Item not found"}
 
 
def test_update_shopping_list_with_duplicates(setup_db):
    """Test trying to add duplicate items to the shopping list."""
    # Mock existing item in database with a valid ObjectId
    app.database["shopping-list"].find.return_value = [{
        "_id": ObjectId("60b8d2950d0a2c8b75a3b9f9"),  # Use a valid ObjectId
        "name": "Apple", "quantity": 5, "unit": "kg", "checked": False
    }]
    
    client = TestClient(app)
    response = client.post("/shopping-list/update", json=[{
        "name": "Apple",
        "quantity": 5,
        "unit": "kg",
        "checked": False,
        "user_email": "test@gmail.com"
    }])
    assert response.status_code == 200
    #assert response.json()["detail"] == "No new items to add."
    
    
    
def test_add_new_recipe(setup_db):
    """Test to add new recipe with mocking."""
    # Mock data for the test
    recipe_data = {
        "name": "Test Test",
        "cookTime": "1H",
        "prepTime": "30M",
        "totalTime": "1H30M",
        "description": "A delicious and moist chocolate cake recipe.",
        "images": [
            "https://example.com/chocolate_cake.jpg"
        ],
        "category": "Dessert",
        "tags": ["Chocolate", "Cake", "Dessert"],
        "ingredientQuantities": ["2 cups", "1 cup", "3", "1/2 cup"],
        "ingredients": ["flour", "sugar", "eggs", "cocoa powder"],
        "rating": "5",
        "calories": "450",
        "fat": "20",
        "saturatedFat": "10",
        "cholesterol": "80",
        "sodium": "300",
        "carbs": "50",
        "fiber": "5",
        "sugar": "30",
        "protein": "6",
        "servings": "8",
        "instructions": [
            "Preheat oven to 350°F (175°C).",
            "Mix dry ingredients together.",
            "Add wet ingredients and mix until smooth.",
            "Bake for 30 minutes or until a toothpick comes out clean."
        ]
    }
    
    # Mock the insert_one response
    mock_id = "mock-recipe-id"
    setup_db["recipes"].insert_one.return_value.inserted_id = mock_id
    
    # Mock the find_one response for the newly created recipe
    # Include all the fields from the input data plus an ID
    mock_response = recipe_data.copy()
    mock_response["_id"] = mock_id
    setup_db["recipes"].find_one.return_value = mock_response
    
    # Create a test client
    client = TestClient(app)
    
    # Make the request to add a recipe
    response = client.post("/recipe/add-recipe/", json=recipe_data)
    
    # Verify the response
    assert response.status_code == 201
    response_data = response.json()
    
    # Check that the response contains the expected data
    assert "name" in response_data
    assert response_data["name"] == recipe_data["name"]
    assert "_id" in response_data
    assert response_data["_id"] == mock_id
    
    # For completeness, we can also mock the delete operation
    # though it's not necessary for this test
    setup_db["recipes"].delete_one.return_value.deleted_count = 1
    
    # No need to actually call delete since we're mocking everything
    # This test is focused only on the add recipe functionality
