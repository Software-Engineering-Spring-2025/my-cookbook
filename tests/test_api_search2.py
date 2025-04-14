import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../api')))
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from bson import ObjectId
import pytest
from main import app


@pytest.fixture
def setup_db():
    """Fixture to mock the database and cursor behavior."""
    app.database = MagicMock()
    mock_collection = MagicMock()
    app.database.__getitem__.return_value = mock_collection

    mock_cursor = MagicMock()
    mock_cursor.limit.return_value = mock_cursor
    mock_cursor.sort.return_value = mock_cursor
    mock_cursor.skip.return_value = mock_cursor
    mock_cursor.__iter__.return_value = iter([])

    mock_collection.find.return_value = mock_cursor
    mock_collection.count_documents.return_value = 0
    yield app.database


def full_recipe_mock(object_id, name, ingredients, calories="450", rating=5):
    """Helper function to return a full recipe with all fields filled."""
    return {
        "_id": str(object_id),
        "name": name,
        "cookTime": "1H",
        "prepTime": "30M",
        "totalTime": "1H30M",
        "description": f"{name} description",
        "images": ["https://example.com/image.jpg"],
        "category": "Dessert",
        "tags": ["Sweet"],
        "ingredientQuantities": ["2 cups", "1 cup"],
        "ingredients": ingredients,
        "rating": str(rating),
        "calories": calories,
        "fat": "20",
        "saturatedFat": "10",
        "cholesterol": "80",
        "sodium": "300",
        "carbs": "50",
        "fiber": "5",
        "sugar": "30",
        "protein": "6",
        "servings": "8",
        "instructions": ["Step 1", "Step 2"]
    }


# ----------------------------------------------
# Test Cases for GET /search2/{ingredient},{min_cal},{max_cal}
# ----------------------------------------------

def test_search2_valid_input(setup_db):
    """Test searching for recipes within a valid calorie range."""
    mocked_recipes = [
        full_recipe_mock(ObjectId(), "Chicken Salad", ["chicken", "lettuce"], calories="300")
    ]
    cursor_mock = MagicMock()
    cursor_mock.__iter__.return_value = iter(mocked_recipes)
    setup_db["recipes"].find.return_value = cursor_mock

    client = TestClient(app)
    response = client.get("/recipe/search2/chicken,200,500")

    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert response.json() == mocked_recipes


def test_search2_valid_calorie_range(setup_db):
    """Test searching for recipes with an valid calorie range (min > max)."""
    client = TestClient(app)
    response = client.get("/recipe/search2/chicken,100,200")
    assert response.status_code == 200


def test_search2_missing_ingredient(setup_db):
    """Test searching for recipes with a missing ingredient."""
    client = TestClient(app)
    response = client.get("/recipe/search2/,100,300")
    assert response.status_code == 404


def test_search2_boundary_calories(setup_db):
    """Test searching for recipes with boundary calorie values."""
    client = TestClient(app)
    response = client.get("/recipe/search2/beef,0,1000")
    assert response.status_code == 200


def test_search2_non_existent_ingredient(setup_db):
    """Test searching for recipes with a non-existent ingredient."""
    cursor_mock = MagicMock()
    cursor_mock.__iter__.return_value = iter([])  # Empty result
    setup_db["recipes"].find.return_value = cursor_mock

    client = TestClient(app)
    response = client.get("/recipe/search2/unicorn,100,300")

    assert response.status_code == 200
    assert response.json() == []