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
        "instructions": ["Mix ingredients", "Bake for 30 minutes"]
    }




client = TestClient(app)

def test_add_recipe_note(setup_db):
    """Test adding a note to a recipe"""
    # First get a recipe ID
    mocked_recipes = [full_recipe_mock(ObjectId()), full_recipe_mock(ObjectId())]
    # Properly mock the cursor with limit()
    cursor_mock = MagicMock()
    cursor_mock.limit.return_value = cursor_mock  # Chain limit() call
    cursor_mock.__iter__.return_value = iter(mocked_recipes)
    setup_db["recipes"].find.return_value = cursor_mock
    recipes = client.get("/recipe/").json()
    if not recipes:
        pytest.skip("No recipes available for testing")
    
    recipe_id = recipes[0]["_id"]
    test_note = {
        "note": "This is a test note for the recipe",
        "user_email": "test@example.com"
    }
    
    response = client.post(f"/recipe/{recipe_id}/notes", json=test_note)
    assert response.status_code == 201
    data = response.json()
    assert data["message"] == "Note added successfully"
    assert "note" in data
    assert data["note"]["note"] == test_note["note"]
    assert data["note"]["user_email"] == test_note["user_email"]
    assert "created_at" in data["note"]

def test_get_recipe_notes(setup_db):
    """Test getting notes for a recipe"""
    mocked_recipes = [full_recipe_mock(ObjectId()), full_recipe_mock(ObjectId())]
    # Properly mock the cursor with limit()
    cursor_mock = MagicMock()
    cursor_mock.limit.return_value = cursor_mock  # Chain limit() call
    cursor_mock.__iter__.return_value = iter(mocked_recipes)
    setup_db["recipes"].find.return_value = cursor_mock
    # First get a recipe ID
    recipes = client.get("/recipe/").json()
    if not recipes:
        pytest.skip("No recipes available for testing")
    
    recipe_id = recipes[0]["_id"]
    user_email = "test@example.com"
    
    response = client.get(f"/recipe/{recipe_id}/notes?user_email={user_email}")
    assert response.status_code == 200
    data = response.json()
    assert "notes" in data
    assert isinstance(data["notes"], list)

def test_add_note_to_nonexistent_recipe(setup_db):
    """Test adding a note to a non-existent recipe"""
    mocked_recipes = [full_recipe_mock(ObjectId()), full_recipe_mock(ObjectId())]
    # Properly mock the cursor with limit()
    cursor_mock = MagicMock()
    cursor_mock.limit.return_value = cursor_mock  # Chain limit() call
    cursor_mock.__iter__.return_value = iter(mocked_recipes)
    setup_db["recipes"].find.return_value = None
    setup_db["recipes"].find_one.return_value = None
    test_note = {
        "note": "This note should fail",
        "user_email": "test@example.com"
    }
    
    response = client.post("/recipe/nonexistent_id/notes", json=test_note)
    assert response.status_code == 500

def test_get_notes_for_nonexistent_recipe(setup_db):
    mocked_recipes = [full_recipe_mock(ObjectId()), full_recipe_mock(ObjectId())]
    # Properly mock the cursor with limit()
    cursor_mock = MagicMock()
    cursor_mock.limit.return_value = cursor_mock  # Chain limit() call
    cursor_mock.__iter__.return_value = iter(mocked_recipes)
    setup_db["recipes"].find.return_value = None
    setup_db["recipes"].find_one.return_value = None
    """Test getting notes for a non-existent recipe"""
    user_email = "test@example.com"
    response = client.get(f"/recipe/nonexistent_id/notes?user_email={user_email}")
    assert response.status_code == 500

def test_add_note_without_user_email(setup_db):
    """Test adding a note without user email"""
    mocked_recipes = [full_recipe_mock(ObjectId()), full_recipe_mock(ObjectId())]
    # Properly mock the cursor with limit()
    cursor_mock = MagicMock()
    cursor_mock.limit.return_value = cursor_mock  # Chain limit() call
    cursor_mock.__iter__.return_value = iter(mocked_recipes)
    setup_db["recipes"].find.return_value = cursor_mock
    recipes = client.get("/recipe/").json()
    if not recipes:
        pytest.skip("No recipes available for testing")
    
    recipe_id = recipes[0]["_id"]
    test_note = {
        "note": "This note should fail"
    }
    
    response = client.post(f"/recipe/{recipe_id}/notes", json=test_note)
    assert response.status_code == 422  # Validation error

def test_add_note_without_note_content(setup_db):
    """Test adding a note without content"""
    mocked_recipes = [full_recipe_mock(ObjectId()), full_recipe_mock(ObjectId())]
    # Properly mock the cursor with limit()
    cursor_mock = MagicMock()
    cursor_mock.limit.return_value = cursor_mock  # Chain limit() call
    cursor_mock.__iter__.return_value = iter(mocked_recipes)
    setup_db["recipes"].find.return_value = cursor_mock
    recipes = client.get("/recipe/").json()
    if not recipes:
        pytest.skip("No recipes available for testing")
    
    recipe_id = recipes[0]["_id"]
    test_note = {
        "user_email": "test@example.com"
    }
    
    response = client.post(f"/recipe/{recipe_id}/notes", json=test_note)
    assert response.status_code == 422  # Validation error

def test_get_notes_without_user_email(setup_db):
    """Test getting notes without user email"""
    mocked_recipes = [full_recipe_mock(ObjectId()), full_recipe_mock(ObjectId())]
    # Properly mock the cursor with limit()
    cursor_mock = MagicMock()
    cursor_mock.limit.return_value = cursor_mock  # Chain limit() call
    cursor_mock.__iter__.return_value = iter(mocked_recipes)
    setup_db["recipes"].find.return_value = cursor_mock
    recipes = client.get("/recipe/").json()
    if not recipes:
        pytest.skip("No recipes available for testing")
    
    recipe_id = recipes[0]["_id"]
    response = client.get(f"/recipe/{recipe_id}/notes")
    assert response.status_code == 422  # Validation error 