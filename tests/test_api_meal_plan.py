import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../api')))
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
import pytest
from main import app
from bson import ObjectId
from pydantic import BaseModel, conint, conlist, PositiveInt

class MealPlanEntry(BaseModel):
    day: int  # 0-6 representing Monday-Sunday
    recipe: dict  # The recipe details (name, instructions, etc.)

@pytest.fixture
def setup_db():
    """Fixture to mock the database and avoid actual database calls."""
    app.database = MagicMock()
    yield app.database

def test_save_meal_plan_success(setup_db):
    """Test saving a meal plan for a specific day successfully."""
    
    meal_plan_data = {
        "day": 2,
        "recipe": {"name": "Pasta", "calories": "500"}
    }

    # Mock the update_one response
    setup_db["meal_plans"].update_one.return_value = MagicMock(matched_count=1, upserted_id=None)

    client = TestClient(app)
    response = client.post("/recipe/meal-plan/", json=meal_plan_data)

    # Assertions
    assert response.status_code == 200
    assert response.json()["message"] == "Meal plan saved successfully."
    setup_db["meal_plans"].update_one.assert_called_once_with(
        {"day": meal_plan_data["day"]},
        {"$set": {"recipe": meal_plan_data["recipe"]}},
        upsert=True
    )

def test_get_meal_plan_success(setup_db):
    """Test retrieving the meal plan for the week successfully."""
    # Mocked meal plan entries
    mocked_meal_plan = [
        {"_id": "1", "day": 0, "recipe": {"name": "Pasta"}},
        {"_id": "2", "day": 1, "recipe": {"name": "Salad"}}
    ]

    # Mock the find response
    setup_db["meal_plans"].find.return_value = mocked_meal_plan

    client = TestClient(app)
    response = client.get("/recipe/meal-plan/")

    # Expected full plan with missing days as None
    expected_response = [
        {"_id": "1", "day": 0, "recipe": {"name": "Pasta"}},
        {"_id": "2", "day": 1, "recipe": {"name": "Salad"}},
        {"2": None},
        {"3": None},
        {"4": None},
        {"5": None},
        {"6": None}
    ]

    assert response.status_code == 200
    assert response.json() == expected_response
    setup_db["meal_plans"].find.assert_called_once_with({})


def test_save_meal_plan_failure(setup_db):
    """Test failure scenario when saving a meal plan."""
    meal_plan_data = {"day": 3, "recipe": {"name": "Burger", "calories": "700"}}

    # Simulate a database exception
    setup_db["meal_plans"].update_one.side_effect = Exception("Database error")

    client = TestClient(app)
    response = client.post("/recipe/meal-plan/", json=meal_plan_data)

    assert response.status_code == 500
    assert response.json()["detail"] == "An error occurred while saving the meal plan."


def test_get_meal_plan_failure(setup_db):
    """Test failure scenario when retrieving the meal plan."""
    # Simulate a database exception
    setup_db["meal_plans"].find.side_effect = Exception("Database error")

    client = TestClient(app)
    response = client.get("/recipe/meal-plan/")

    assert response.status_code == 500
    

def test_save_meal_plan():
    """✅ Test saving a meal plan for a specific day."""
    client = TestClient(app)
    entry = {
        "day": 2,  # Tuesday
        "recipe": {
            "name": "Grilled Cheese Sandwich",
            "instructions": "Butter bread, add cheese, and grill until golden."
        }
    }
    response = client.post("/recipe/meal-plan/", json=entry)
    assert response.status_code == 200
    assert response.json()["message"] == "Meal plan saved successfully."

def test_advanced_search_by_ingredient_and_calories(setup_db):
    """ Test searching recipes by ingredient and calorie range."""
    ingredient = "chicken"
    calories_low = 100
    calories_up = 500

    mocked_recipes = [
        {"_id": str(ObjectId()), "name": "Grilled Chicken", "ingredients": ["chicken"], "calories": "300"},
        {"_id": str(ObjectId()), "name": "Chicken Salad", "ingredients": ["chicken", "lettuce"], "calories": "200"}
    ]

    cursor_mock = MagicMock()
    cursor_mock.__iter__.return_value = iter(mocked_recipes)
    app.database["recipes"].find.return_value = cursor_mock

    client = TestClient(app)
    response = client.get(f"/recipe/search2/{ingredient},{calories_low},{calories_up}")

    assert response.status_code == 200
    recipes = response.json()
    assert isinstance(recipes, list)
    for recipe in recipes:
        assert ingredient in recipe["ingredients"]
        assert calories_low <= float(recipe["calories"]) <= calories_up


def test_advanced_search_valid_calorie_range(setup_db):
    """ Test searching with an invalid calorie range."""
    client = TestClient(app)
    response = client.get("/recipe/search2/chicken,500,100")  
    assert response.status_code == 200


def test_advanced_search_no_results(setup_db):
    """ Test searching with no matching results."""
    app.database["recipes"].find.return_value.__iter__.return_value = iter([])  # No results
    client = TestClient(app)
    response = client.get("/recipe/search2/fish,100,300")
    assert response.status_code == 200
    assert response.json() == []  # Empty list when no matches