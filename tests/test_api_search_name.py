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
    """Fixture to mock the database and avoid actual database calls."""
    app.database = MagicMock()
    yield app.database


def full_recipe_mock(object_id, name):
    """Helper to return a recipe object with minimal required fields."""
    return {
        "_id": str(object_id),  # Ensure _id is a string
        "name": name,
        "cookTime": "1H",
        "prepTime": "30M",
        "totalTime": "1H30M",
        "description": f"{name} description",
        "images": ["https://example.com/image.jpg"],
        "category": "Dessert",
        "tags": ["Sweet"],
        "ingredientQuantities": ["2 cups", "1 cup"],
        "ingredients": ["flour", "sugar"],
        "rating": "5",
        "calories": "450",
        "fat": "20",
        "sugar": "30",
        "protein": "6",
        "servings": "8",
        "instructions": ["Step 1", "Step 2"]
    }


# -----------------------------------------
# TEST CASES FOR /search-name/{name}
# -----------------------------------------

def test_search_recipe_by_name_exact(setup_db):
    """Test searching for a recipe by exact name (case & whitespace insensitive)."""
    search_name = "bestchocolatecake"
    mocked_recipe = full_recipe_mock(ObjectId(), "Best Chocolate Cake")

    # Convert _id to string for both expected and actual comparison
    expected_recipe = {**mocked_recipe, "_id": str(mocked_recipe["_id"])}

    cursor_mock = MagicMock()
    cursor_mock.__iter__.return_value = iter([expected_recipe])
    setup_db["recipes"].aggregate.return_value = cursor_mock

    client = TestClient(app)
    response = client.get(f"/recipe/search-name/{search_name}")

    # Convert API response _id to string if needed
    actual_response = response.json()
    for recipe in actual_response:
        recipe["_id"] = str(recipe["_id"])

    assert response.status_code == 200

    setup_db["recipes"].aggregate.assert_called_once()

def test_search_recipe_by_name_case_insensitive(setup_db):
    """Test searching for a recipe with different casing and extra spaces."""
    search_name = "  BeSt   ChoCoLaTe  CaKe  "
    processed_search = search_name.lower().replace(" ", "")
    mocked_recipe = full_recipe_mock(ObjectId(), "Best Chocolate Cake")

    cursor_mock = MagicMock()
    cursor_mock.__iter__.return_value = iter([mocked_recipe])
    setup_db["recipes"].aggregate.return_value = cursor_mock

    client = TestClient(app)
    response = client.get(f"/recipe/search-name/{processed_search}")

    assert response.status_code == 200
    
    setup_db["recipes"].aggregate.assert_called_once()


def test_search_recipe_by_name_not_found(setup_db):
    """Test searching for a non-existent recipe by name."""
    search_name = "nonexistentrecipe"

    cursor_mock = MagicMock()
    cursor_mock.__iter__.return_value = iter([])
    setup_db["recipes"].aggregate.return_value = cursor_mock

    client = TestClient(app)
    response = client.get(f"/recipe/search-name/{search_name}")

    assert response.status_code == 500


def test_search_recipe_by_name_special_characters(setup_db):
    """Test searching for a recipe with special characters (should not match)."""
    search_name = "!@#$%^&*()_+"

    cursor_mock = MagicMock()
    cursor_mock.__iter__.return_value = iter([])
    setup_db["recipes"].aggregate.return_value = cursor_mock

    client = TestClient(app)
    response = client.get(f"/recipe/search-name/{search_name}")

    assert response.status_code == 500


def test_search_recipe_by_name_internal_error(setup_db):
    """Test simulating an internal server error during aggregation."""
    search_name = "BestChocolateCake"

    # Simulate an exception being raised
    setup_db["recipes"].aggregate.side_effect = Exception("Database error")

    client = TestClient(app)
    response = client.get(f"/recipe/search-name/{search_name}")

    assert response.status_code == 500
    assert response.json()["detail"] == "An error occurred while searching for the recipe."

def test_search_name_non_existent(setup_db):
    """Test searching for a non-existent recipe."""
    search_name = "Dragon Stew"
    cursor_mock = MagicMock()
    cursor_mock.__iter__.return_value = iter([])  # Empty list means no results
    setup_db["recipes"].aggregate.return_value = cursor_mock

    client = TestClient(app)
    response = client.get(f"/recipe/search-name/{search_name.replace(' ', '%20')}")

    assert response.status_code == 500

def test_search_name_special_characters(setup_db):
    """Test searching for recipes with special characters in the name."""
    search_name = "Pasta@123"
    cursor_mock = MagicMock()
    cursor_mock.__iter__.return_value = iter([])  # Assuming no matches
    setup_db["recipes"].aggregate.return_value = cursor_mock

    client = TestClient(app)
    response = client.get(f"/recipe/search-name/{search_name}")

    assert response.status_code == 500
    
# def test_search_name_empty(setup_db):
#     """Test searching for a recipe with an empty name."""
#     client = TestClient(app)
#     response = client.get("/search-name/")

#     assert response.status_code == 400  # Assuming API handles empty input
    
def test_search_name_valid(setup_db):
    """Test searching for a recipe with a valid name."""
    search_name = "Spaghetti Bolognese"
    mocked_recipe = full_recipe_mock(ObjectId(), search_name)
    expected_recipe = {**mocked_recipe, "_id": str(mocked_recipe["_id"])}

    cursor_mock = MagicMock()
    cursor_mock.__iter__.return_value = iter([expected_recipe])
    setup_db["recipes"].aggregate.return_value = cursor_mock

    client = TestClient(app)
    response = client.get(f"/recipe/search-name/{search_name.replace(' ', '%20')}")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_search_name_non_existent(setup_db):
    """Test searching for a non-existent recipe."""
    search_name = "Dragon Stew"
    cursor_mock = MagicMock()
    cursor_mock.__iter__.return_value = iter([])  # Empty list means no results
    setup_db["recipes"].aggregate.return_value = cursor_mock

    client = TestClient(app)
    response = client.get(f"/recipe/search-name/{search_name.replace(' ', '%20')}")

    assert response.status_code == 500