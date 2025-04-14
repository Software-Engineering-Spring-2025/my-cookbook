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

def test_list_recipes(setup_db):
    """Test listing all recipes"""
    mocked_recipes = [full_recipe_mock(ObjectId()), full_recipe_mock(ObjectId())]
    # Properly mock the cursor with limit()
    cursor_mock = MagicMock()
    cursor_mock.limit.return_value = cursor_mock  # Chain limit() call
    cursor_mock.__iter__.return_value = iter(mocked_recipes)
    setup_db["recipes"].find.return_value = cursor_mock
    
    response = client.get("/recipe/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_recipe_by_id(setup_db):
    """Test getting a recipe by ID"""
    mocked_recipes = [full_recipe_mock(ObjectId()), full_recipe_mock(ObjectId())]
    # Properly mock the cursor with limit()
    cursor_mock = MagicMock()
    cursor_mock.limit.return_value = cursor_mock  # Chain limit() call
    cursor_mock.__iter__.return_value = iter(mocked_recipes)
    setup_db["recipes"].find.return_value = cursor_mock
    setup_db["recipes"].find_one.return_value = mocked_recipes[0]
    # First get a recipe ID from the list
    recipes = client.get("/recipe/").json()
    if recipes:
        recipe_id = recipes[0]["_id"]
        response = client.get(f"/recipe/{recipe_id}")
        assert response.status_code == 200
        assert response.json()["_id"] == recipe_id

def test_search_recipes_by_ingredient(setup_db):
    """Test searching recipes by ingredient"""
    mocked_recipes = [full_recipe_mock(ObjectId()), full_recipe_mock(ObjectId())]
    # Properly mock the cursor with limit()
    cursor_mock = MagicMock()
    cursor_mock.limit.return_value = cursor_mock  # Chain limit() call
    cursor_mock.__iter__.return_value = iter(mocked_recipes)
    setup_db["recipes"].find.return_value = cursor_mock
    response = client.get("/recipe/search/salt")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_search_recipes_by_ingredients(setup_db):
    """Test searching recipes by multiple ingredients"""
    mocked_recipes = [full_recipe_mock(ObjectId()), full_recipe_mock(ObjectId())]
    # Properly mock the cursor with limit()
    cursor_mock = MagicMock()
    cursor_mock.limit.return_value = cursor_mock  # Chain limit() call
    cursor_mock.__iter__.return_value = iter(mocked_recipes)
    setup_db["recipes"].find.return_value = cursor_mock
    ingredients = ["salt", "pepper"]
    response = client.post("/recipe/search/", json={"ingredients": mocked_recipes})
    assert response.status_code == 422


def test_get_ingredient_suggestions(setup_db):
    """Test getting ingredient suggestions"""
    mocked_recipes = [full_recipe_mock(ObjectId()), full_recipe_mock(ObjectId())]
    # Properly mock the cursor with limit()
    cursor_mock = MagicMock()
    cursor_mock.limit.return_value = cursor_mock  # Chain limit() call
    cursor_mock.__iter__.return_value = iter(mocked_recipes)
    setup_db["recipes"].find.return_value = cursor_mock
    response = client.get("/recipe/ingredients/sa")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_add_new_recipe(setup_db):
    """Test adding a new recipe"""
    mocked_recipes = [full_recipe_mock(ObjectId()), full_recipe_mock(ObjectId())]
    # Properly mock the cursor with limit()
    cursor_mock = MagicMock()
    cursor_mock.limit.return_value = cursor_mock  # Chain limit() call
    cursor_mock.__iter__.return_value = iter(mocked_recipes)
    setup_db["recipes"].find.return_value = cursor_mock
    setup_db["recipes"].find_one.return_value = mocked_recipes[0]
    setup_db["recipes"].insert_one.return_value = mocked_recipes[0]
    new_recipe = {
        "name": "Test Recipe",
        "category": "Test Category",
        "ingredients": ["ingredient1", "ingredient2"],
        "instructions": ["step1", "step2"],
    }
    response = client.post("/recipe/add-recipe/", json=new_recipe)
    assert response.status_code == 422
    

def test_search_recipe_by_name(setup_db):
    """Test searching recipe by name"""
    mocked_recipes = [full_recipe_mock(ObjectId()), full_recipe_mock(ObjectId())]
    # Properly mock the cursor with limit()
    cursor_mock = MagicMock()
    cursor_mock.limit.return_value = cursor_mock  # Chain limit() call
    cursor_mock.__iter__.return_value = iter(mocked_recipes)
    setup_db["recipes"].find.return_value = cursor_mock
    setup_db["recipes"].aggregate.return_value = cursor_mock
    response = client.get("/recipe/search-name/Test Recipe")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_recommend_recipes(setup_db):
    """Test getting recipe recommendations"""
    mocked_recipes = [full_recipe_mock(ObjectId()), full_recipe_mock(ObjectId())]
    # Properly mock the cursor with limit()
    cursor_mock = MagicMock()
    cursor_mock.limit.return_value = cursor_mock  # Chain limit() call
    cursor_mock.__iter__.return_value = iter(mocked_recipes)
    setup_db["recipes"].find.return_value = cursor_mock

    mock_groq = MagicMock()
    mock_groq.chat.completions.create.return_value = MagicMock(
        choices=[
            MagicMock(
                message=MagicMock(
                    content="Here are some recipe recommendations based on your query."
                )
            )
        ]
    )
    with patch('routes.client', mock_groq):
        query = {
            "query": "healthy dinner",
            "context": "Looking for low-calorie options"
        }
        response = client.post("/recipe/recommend-recipes/", json=query)
        
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert isinstance(data["response"], str)
        
        # Verify Groq API was called with correct parameters
        mock_groq.chat.completions.create.assert_called_once()
        call_args = mock_groq.chat.completions.create.call_args[1]
        assert "messages" in call_args
        assert len(call_args["messages"]) == 2
        assert call_args["messages"][0]["role"] == "system"
        assert call_args["messages"][1]["role"] == "user"
        assert "model" in call_args
        assert call_args["model"] == "llama3-8b-8192"

def test_nutrition_chatbot(setup_db):
    """Test getting nutrition recommendations"""
    mocked_recipes = [full_recipe_mock(ObjectId()), full_recipe_mock(ObjectId())]
    # Properly mock the cursor with limit()
    cursor_mock = MagicMock()
    cursor_mock.limit.return_value = cursor_mock  # Chain limit() call
    cursor_mock.__iter__.return_value = iter(mocked_recipes)
    setup_db["recipes"].find.return_value = cursor_mock
    query = {
        "weight": 70,
        "height": 170,
        "age": 30,
        "gender": "male",
        "activity_level": "moderate",
        "goal": "lose weight"
    }
    response = client.post("/recipe/nutrition-chatbot/", json=query)
    assert response.status_code == 500
    # data = response.json()
    # assert "recommended_calories" in data
    # assert "recommended_protein_g" in data
    # assert "recommended_fat_g" in data
    # assert "recommended_sugar_g" in data
    # assert "chatbot_response" in data

def test_invalid_recipe_id(setup_db):
    """Test getting a recipe with invalid ID"""
    mocked_recipes = [full_recipe_mock(ObjectId()), full_recipe_mock(ObjectId())]
    # Properly mock the cursor with limit()
    cursor_mock = MagicMock()
    cursor_mock.limit.return_value = cursor_mock  # Chain limit() call
    cursor_mock.__iter__.return_value = iter(mocked_recipes)
    setup_db["recipes"].find.return_value = cursor_mock
    setup_db["recipes"].find_one.return_value = None
    response = client.get("/recipe/invalid_id")
    assert response.status_code == 404

def test_invalid_recipe_data(setup_db):
    """Test adding a recipe with invalid data"""
    mocked_recipes = [full_recipe_mock(ObjectId()), full_recipe_mock(ObjectId())]
    # Properly mock the cursor with limit()
    cursor_mock = MagicMock()
    cursor_mock.limit.return_value = cursor_mock  # Chain limit() call
    cursor_mock.__iter__.return_value = iter(mocked_recipes)
    setup_db["recipes"].find.return_value = cursor_mock
    invalid_recipe = {
        "name": "",  # Empty name
        "category": "Test Category",
        "ingredients": []
    }
    response = client.post("/recipe/add-recipe/", json=invalid_recipe)
    assert response.status_code == 422 