// import React, { useState, useEffect } from 'react'
// import './HomePage.css'
// import { useTheme } from '../../Themes/themeContext'
// import axios from 'axios'

// const MealPage = () => {
//   const { theme } = useTheme()
//   const [mealPlan, setMealPlan] = useState<any[]>(Array(7).fill(null)) // One meal per day

//   useEffect(() => {
//     const fetchMealPlan = async () => {
//       try {
//         const response = await axios.get(
//           'http://localhost:8000/recipe/meal-plan/'
//         )
//         const updatedMealPlan = Array(7).fill(null)
//         response.data.forEach((entry: any) => {
//           if (entry.recipe) {
//             updatedMealPlan[entry.day] = entry.recipe
//           }
//         })
//         setMealPlan(updatedMealPlan) // Update the state with the fetched meal plan
//       } catch (error) {
//         console.error('Error fetching meal plan:', error)
//       }
//     }

//     fetchMealPlan()
//   }, [])

//   const printMealPlan = () => {
//     window.print()
//   }

//   return (
//     <div
//       style={{
//         backgroundColor: theme.background,
//         color: theme.color,
//         padding: '20px',
//       }}
//     >
//       <h2>My Meal Plan</h2>
//       <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//         <thead>
//           <tr>
//             <th style={{ border: '1px solid', padding: '8px' }}>Day</th>
//             <th style={{ border: '1px solid', padding: '8px' }}>Recipe</th>
//             <th style={{ border: '1px solid', padding: '8px' }}>Steps</th>
//           </tr>
//         </thead>
//         <tbody>
//           {[
//             'Monday',
//             'Tuesday',
//             'Wednesday',
//             'Thursday',
//             'Friday',
//             'Saturday',
//             'Sunday',
//           ].map((day, index) => (
//             <tr key={index}>
//               <td style={{ border: '1px solid', padding: '8px' }}>{day}</td>
//               <td style={{ border: '1px solid', padding: '8px' }}>
//                 {mealPlan[index]?.name || 'No meal planned'}
//               </td>
//               <td style={{ border: '1px solid', padding: '8px' }}>
//                 {Array.isArray(mealPlan[index]?.instructions)
//                   ? mealPlan[index]?.instructions.join(', ')
//                   : mealPlan[index]?.instructions || '-'}
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//       <button
//         onClick={printMealPlan}
//         style={{
//           backgroundColor: theme.headerColor,
//           color: theme.color,
//           marginRight: '10px',
//           transition: 'transform 0.2s ease, background-color 0.2s ease',
//           marginTop: '20px',
//           padding: '10px 20px',
//         }}
//         onMouseEnter={(e) =>
//           (e.currentTarget.style.backgroundColor = theme.background)
//         }
//         onMouseLeave={(e) =>
//           (e.currentTarget.style.backgroundColor = theme.headerColor)
//         }
//       >
//         Print Meal Plan
//       </button>
//     </div>
//   )
// }

// export default MealPage


import React, { useState, useEffect } from 'react'
import './HomePage.css'
import { useTheme } from '../../Themes/themeContext'
import axios from 'axios'

const daysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

const MealPage = () => {
  const { theme } = useTheme()
  const [mealPlan, setMealPlan] = useState<any[]>(Array(7).fill(null))
  const [showForm, setShowForm] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number>(0)
  const [recipeName, setRecipeName] = useState('')

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

    fetchMealPlan()
  }, [])

  const handleSave = async () => {
    const updatedMeal = { name: recipeName }

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
    <div style={{ backgroundColor: theme.background, color: theme.color, padding: '20px' }}>
      <h2>My Meal Plan</h2>

      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          backgroundColor: theme.headerColor,
          color: theme.color,
          marginBottom: '20px',
          padding: '10px 20px',
          border: 'none',
          cursor: 'pointer',
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
              style={{ marginLeft: '10px' }}
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
              style={{ marginLeft: '10px' }}
            />
          </label>
          <br />
          <button onClick={handleSave} style={{ marginTop: '10px', padding: '5px 10px' }}>
            Save
          </button>
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
              <td style={{ border: '1px solid', padding: '8px' }}>
                {mealPlan[index]?.name || 'No meal planned'}
              </td>
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
        }}
      >
        Print Meal Plan
      </button>
    </div>
  )
}

export default MealPage

