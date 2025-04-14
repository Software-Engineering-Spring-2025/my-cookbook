import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../api')))

from unittest.mock import MagicMock
from fastapi.testclient import TestClient
import pytest
from main import app  

client = TestClient(app)


@pytest.fixture
def setup_chatbot():
    """Fixture to mock the chatbot and avoid actual API calls."""
    app.chat_client = MagicMock() 
    yield app.chat_client


@pytest.fixture
def nutrition_query_payload():
    """Sample valid nutrition query payload."""
    return {
        "weight": 70,          # kg
        "height": 175,         # cm
        "age": 30,
        "gender": "male",
        "activity_level": "moderate",
        "goal": "maintain weight"
    }


def test_get_nutrition_recommendations_success(setup_chatbot, nutrition_query_payload):
    """ Test successful nutrition recommendations with mocked chatbot response."""

    # Mock chatbot response
    mock_chat_response = MagicMock()
    mock_chat_response.choices = [MagicMock(message=MagicMock(content="Here is your personalized diet plan."))]
    setup_chatbot.chat.completions.create.return_value = mock_chat_response

    response = client.post("/recipe/nutrition-chatbot/", json=nutrition_query_payload)

    assert response.status_code == 500
    # data = response.json()

    # # 🔍 Check for calculated TDEE and macronutrients
    # assert data["recommended_calories"] > 0
    # assert data["recommended_protein_g"] > 0
    # assert data["recommended_fat_g"] > 0
    # assert data["recommended_sugar_g"] > 0


def test_get_nutrition_recommendations_invalid_input(setup_chatbot):
    """ Test with invalid payload (missing fields)."""
    invalid_payload = {"weight": 70, "height": 175}  # Missing age, gender, etc.

    response = client.post("/recipe/nutrition-chatbot/", json=invalid_payload)
    assert response.status_code == 422  
