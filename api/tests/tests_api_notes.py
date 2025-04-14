import pytest
from fastapi.testclient import TestClient
from main import app
from bson import ObjectId
import json

client = TestClient(app)


def test_add_recipe_note():
    """Test adding a note to a recipe"""
    # First get a recipe ID
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

def test_get_recipe_notes():
    """Test getting notes for a recipe"""
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

def test_add_note_to_nonexistent_recipe():
    """Test adding a note to a non-existent recipe"""
    test_note = {
        "note": "This note should fail",
        "user_email": "test@example.com"
    }
    
    response = client.post("/recipe/nonexistent_id/notes", json=test_note)
    assert response.status_code == 404

def test_get_notes_for_nonexistent_recipe():
    """Test getting notes for a non-existent recipe"""
    user_email = "test@example.com"
    response = client.get(f"/recipe/nonexistent_id/notes?user_email={user_email}")
    assert response.status_code == 404

def test_add_note_without_user_email():
    """Test adding a note without user email"""
    recipes = client.get("/recipe/").json()
    if not recipes:
        pytest.skip("No recipes available for testing")
    
    recipe_id = recipes[0]["_id"]
    test_note = {
        "note": "This note should fail"
    }
    
    response = client.post(f"/recipe/{recipe_id}/notes", json=test_note)
    assert response.status_code == 422  # Validation error

def test_add_note_without_note_content():
    """Test adding a note without content"""
    recipes = client.get("/recipe/").json()
    if not recipes:
        pytest.skip("No recipes available for testing")
    
    recipe_id = recipes[0]["_id"]
    test_note = {
        "user_email": "test@example.com"
    }
    
    response = client.post(f"/recipe/{recipe_id}/notes", json=test_note)
    assert response.status_code == 422  # Validation error

def test_get_notes_without_user_email():
    """Test getting notes without user email"""
    recipes = client.get("/recipe/").json()
    if not recipes:
        pytest.skip("No recipes available for testing")
    
    recipe_id = recipes[0]["_id"]
    response = client.get(f"/recipe/{recipe_id}/notes")
    assert response.status_code == 422  # Validation error 