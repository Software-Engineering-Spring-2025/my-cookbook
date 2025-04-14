import pytest
from fastapi.testclient import TestClient
from main import app
from bson import ObjectId
import json
from unittest.mock import MagicMock, patch

client = TestClient(app)

def test_list_recipes():
    """Test listing all recipes"""
    response = client.get("/recipe/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_recipe_by_id():
    """Test getting a recipe by ID"""
    # First get a recipe ID from the list
    recipes = client.get("/recipe/").json()
    if recipes:
        recipe_id = recipes[0]["_id"]
        response = client.get(f"/recipe/{recipe_id}")
        assert response.status_code == 200
        assert response.json()["_id"] == recipe_id

def test_search_recipes_by_ingredient():
    """Test searching recipes by ingredient"""
    response = client.get("/recipe/search/salt")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_search_recipes_by_ingredients():
    """Test searching recipes by multiple ingredients"""
    ingredients = ["salt", "pepper"]
    response = client.post("/recipe/search/", json={"ingredients": ingredients})
    assert response.status_code == 200
    data = response.json()
    assert "recipes" in data
    assert "page" in data
    assert "count" in data

def test_get_ingredient_suggestions():
    """Test getting ingredient suggestions"""
    response = client.get("/recipe/ingredients/sa")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_add_new_recipe():
    """Test adding a new recipe"""
    new_recipe = {
        "name": "Test Recipe",
        "category": "Test Category",
        "ingredients": ["ingredient1", "ingredient2"],
        "instructions": ["step1", "step2"],
        "rating": 4.5,
        "prepTime": "30 mins",
        "cookTime": "1 hour",
        "servings": 4,
        "calories": 500,
        "protein": 20,
        "carbs": 50,
        "fat": 10,
        "sugar": 5,
        "cholesterol": 100
    }
    response = client.post("/recipe/add-recipe/", json=new_recipe)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == new_recipe["name"]
    assert data["category"] == new_recipe["category"]

def test_search_recipe_by_name():
    """Test searching recipe by name"""
    response = client.get("/recipe/search-name/Test Recipe")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_recommend_recipes(setup_db):
    """Test getting recipe recommendations"""
    # Mock the Groq client and its response
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
    
    # Mock the database response
    setup_db["recipes"].find.return_value = []
    
    # Mock the Groq client in the routes module
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

def test_nutrition_chatbot():
    """Test getting nutrition recommendations"""
    query = {
        "weight": 70,
        "height": 170,
        "age": 30,
        "gender": "male",
        "activity_level": "moderate",
        "goal": "lose weight"
    }
    response = client.post("/recipe/nutrition-chatbot/", json=query)
    assert response.status_code == 200
    data = response.json()
    assert "recommended_calories" in data
    assert "recommended_protein_g" in data
    assert "recommended_fat_g" in data
    assert "recommended_sugar_g" in data
    assert "chatbot_response" in data

def test_invalid_recipe_id():
    """Test getting a recipe with invalid ID"""
    response = client.get("/recipe/invalid_id")
    assert response.status_code == 404

def test_invalid_recipe_data():
    """Test adding a recipe with invalid data"""
    invalid_recipe = {
        "name": "",  # Empty name
        "category": "Test Category",
        "ingredients": []
    }
    response = client.post("/recipe/add-recipe/", json=invalid_recipe)
    assert response.status_code == 400 