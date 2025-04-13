
import React, { useState, useEffect } from 'react'
import './HomePage.css'
import { useTheme } from '../../Themes/themeContext'
import axios from 'axios'
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragEndEvent,
} from '@dnd-kit/core'

const daysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

const RecipeCard = ({ recipe }: { recipe: any }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: recipe.name,
    data: recipe,
  })

  const style = {
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px)`
      : undefined,
    padding: '10px',
    border: '1px solid gray',
    marginBottom: '10px',
    cursor: 'grab',
    backgroundColor: 'white',
    fontSize: '12px',
  }

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {recipe.name}
    </div>
  )
}

const DroppableCell = ({ index, children }: any) => {
  const { setNodeRef } = useDroppable({
    id: `day-${index}`,
  })

  return (
    <td
      ref={setNodeRef}
      style={{ border: '1px solid', padding: '8px', minHeight: '40px', fontSize: '12px' }}
      onDrop={(e) => e.preventDefault()}
    >
      {children}
    </td>
  )
}

const MealPage = () => {
  console.log('MealPage loaded')
  const { theme } = useTheme()
  const [mealPlan, setMealPlan] = useState<any[]>(Array(7).fill(null))
  const [showForm, setShowForm] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number>(0)
  const [recipeName, setRecipeName] = useState('')
  const [recipeInstructions, setRecipeInstructions] = useState('')
  const [recipeLibrary, setRecipeLibrary] = useState<any[]>([])

  useEffect(() => {
    const fetchMealPlan = async () => {
      try {
        const response = await axios.get('http://localhost:8000/recipe/meal-plan/')
        const updatedMealPlan = Array(7).fill(null)
        response.data.forEach((entry: any) => {
          if (entry.recipe) {
            updatedMealPlan[entry.day] = entry.recipe
          }
        })
        setMealPlan(updatedMealPlan)
      } catch (error) {
        console.error('Error fetching meal plan:', error)
      }
    }

    const fetchRecipes = async () => {
      try {
        const response = await axios.get('http://localhost:8000/recipe/')
        setRecipeLibrary(response.data)
      } catch (error) {
        console.error('Error loading recipes:', error)
      }
    }

    fetchMealPlan()
    fetchRecipes()
  }, [])

  const fetchNewRecipe = async () => {
    try {
      const response = await axios.get('http://localhost:8000/recipe/random')
      const newRecipe = response.data
      if (!recipeLibrary.some((r) => r.name === newRecipe.name)) {
        setRecipeLibrary((prev) => [...prev, newRecipe])
      }
    } catch (error) {
      console.error('Error fetching new recipe:', error)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && over.id.toString().startsWith('day-')) {
      const dayIndex = parseInt(over.id.toString().split('-')[1])
      const droppedRecipe = active.data.current

      const updatedPlan = [...mealPlan]
      updatedPlan[dayIndex] = droppedRecipe
      setMealPlan(updatedPlan)

      fetchNewRecipe()
    }
  }

  const handleSave = async () => {
    const updatedMeal = {
      name: recipeName,
      instructions: recipeInstructions.includes('\n')
        ? recipeInstructions.split('\n')
        : recipeInstructions.split(','),
    }

    const updatedPlan = [...mealPlan]
    updatedPlan[selectedDay] = updatedMeal
    setMealPlan(updatedPlan)

    try {
      await axios.put('http://localhost:8000/recipe/meal-plan/', {
        day: selectedDay,
        recipe: updatedMeal,
      })
    } catch (error) {
      console.error('Error saving meal:', error)
    }

    setShowForm(false)
    setRecipeName('')
    setRecipeInstructions('')
  }

  const handleDelete = async (index: number) => {
    const updatedPlan = [...mealPlan]
    updatedPlan[index] = null
    setMealPlan(updatedPlan)

    try {
      await axios.put('http://localhost:8000/recipe/meal-plan/', {
        day: index,
        recipe: null,
      })
    } catch (error) {
      console.error('Error deleting meal:', error)
    }
  }

  const printMealPlan = () => {
    window.print()
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div style={{ backgroundColor: theme.background, color: theme.color, padding: '20px', fontSize: '12px' }}>
        <h2 style={{ fontSize: '14px' }}>My Meal Plan</h2>

        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            backgroundColor: theme.headerColor,
            color: theme.color,
            marginBottom: '20px',
            padding: '10px 20px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          {showForm ? 'Cancel Edit' : 'Edit Meal Plan'}
        </button>

        {showForm && (
          <div style={{ marginBottom: '20px' }}>
            <label>
              Day:
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                style={{ marginLeft: '10px', fontSize: '12px' }}
              >
                {daysOfWeek.map((day, idx) => (
                  <option key={idx} value={idx}>
                    {day}
                  </option>
                ))}
              </select>
            </label>
            <br />
            <label>
              Recipe:
              <input
                type="text"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                style={{ marginLeft: '10px', fontSize: '12px' }}
              />
            </label>
            <br />
            <label>
              Instructions:
              <textarea
                value={recipeInstructions}
                onChange={(e) => setRecipeInstructions(e.target.value)}
                style={{ display: 'block', width: '100%', height: '60px', fontSize: '12px', marginTop: '5px' }}
                placeholder="Enter steps, separated by commas or line breaks"
              />
            </label>
            <br />
            <button
              onClick={handleSave}
              style={{ marginTop: '10px', padding: '5px 10px', fontSize: '12px' }}
            >
              Save
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '13px' }}>Recipe Library</h3>
            {recipeLibrary.map((recipe) => (
              <RecipeCard key={recipe.name} recipe={recipe} />
            ))}
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid', padding: '8px' }}>Day</th>
              <th style={{ border: '1px solid', padding: '8px' }}>Recipe</th>
              <th style={{ border: '1px solid', padding: '8px' }}>Steps</th>
              <th style={{ border: '1px solid', padding: '8px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {daysOfWeek.map((day, index) => (
              <tr key={index}>
                <td style={{ border: '1px solid', padding: '8px' }}>{day}</td>
                <DroppableCell index={index}>
                  {mealPlan[index]?.name || 'No meal planned'}
                </DroppableCell>
                <td style={{ border: '1px solid', padding: '8px' }}>
                  {Array.isArray(mealPlan[index]?.instructions)
                    ? mealPlan[index]?.instructions.join(', ')
                    : mealPlan[index]?.instructions || '-'}
                </td>
                <td style={{ border: '1px solid', padding: '8px' }}>
                  <button
                    onClick={() => handleDelete(index)}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: '#e74c3c',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          onClick={printMealPlan}
          style={{
            backgroundColor: theme.headerColor,
            color: theme.color,
            marginTop: '20px',
            padding: '10px 20px',
            fontSize: '12px',
          }}
        >
          Print Meal Plan
        </button>
      </div>
    </DndContext>
  )
}

export default MealPage


