/*

Copyright (C) 2022 SE CookBook - All Rights Reserved
You may use, distribute and modify this code under the
terms of the MIT license.
You should have received a copy of the MIT license with
this file. If not, please write to: help.cookbook@gmail.com

*/

/**
 * File name: RecipeInformation.tsx
 * Task - This component displays images for recipe making, the procedure to make the dish and the
 * trivia and factual info related to it.
 * This component is a dynamic component and is seen only when you click on a recipe from the recipe list
 * @author Priyanka Ambawane - dearpriyankasa@gmail.com
 */
import {
  IconButton,
  Grid,
  Paper,
  Stack,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Box,
} from '@mui/material'
import { BrowserRouter as Router } from 'react-router-dom';
import StarIcon from '@mui/icons-material/Star'
import React, { useEffect, useState } from 'react'
import { Provider } from 'react-redux'
import applicationStore from '../../../store'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { getRecipeInfoInitiator } from './getRecipeInformation.action'
import './RecipeInformation.css'
import noImage from './no-image.png'
import { FaWhatsapp, FaSlack, FaDiscord } from 'react-icons/fa'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';


import axios from 'axios'

import { useTheme } from '../../Themes/themeContext'
import { useNavigate } from 'react-router-dom'; 
import RecipeFavoriteButton from './RecipeFavoriteButton'


let triviaPaperStyles = {
  backgroundColor: '#f2f4f4',
  marginTop: '20px',
  padding: '20px',
  marginLeft: '30px',
  marginRight: '30px',
}

const store = applicationStore()

const shareOnWhatsApp = (recipeUrl: string) => {
  const baseUrl =
    process.env.NODE_ENV === 'production'
      ? process.env.REACT_APP_WHATSAPP_URL_PROD ||
        'https://api.whatsapp.com/send?text='
      : process.env.REACT_APP_WHATSAPP_URL_TEST ||
        'https://api.whatsapp.com/send?text='

  const whatsappUrl = `${baseUrl}Check out this recipe: ${encodeURIComponent(
    recipeUrl
  )}`
  window.open(whatsappUrl, '_blank')
  // const whatsappUrl = `https://api.whatsapp.com/send?text=Check out this recipe: ${encodeURIComponent(recipeUrl)}`;
}

const shareOnPlatform = (recipeUrl: string, platform: 'slack' | 'discord') => {
  const baseUrls = {
    slack:
      process.env.NODE_ENV === 'production'
        ? process.env.REACT_APP_SLACK_URL_PROD ||
          'https://slack.com/intl/en-us/share?text='
        : process.env.REACT_APP_SLACK_URL_TEST ||
          'https://slack.com/intl/en-us/share?text=',
    discord: 'https://discord.com/channels/@me?message=',
  }

  const encodedRecipe = encodeURIComponent(recipeUrl)
  const shareUrl =
    platform === 'slack'
      ? `${baseUrls.slack}Check out this recipe: ${encodedRecipe}`
      : `${baseUrls.discord}Check out this recipe: ${encodedRecipe}`

  window.open(shareUrl, '_blank')
}

const CopyUrlModal = ({ open, onClose, url, platform }: any) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    onClose()
    shareOnPlatform(url, platform)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Copy URL</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          value={url}
          variant="outlined"
          inputProps={{ readOnly: true }}
          multiline
          rows={2}
          style={{ wordWrap: 'break-word', height: 'auto' }}
        />
        <Typography
          variant="body2"
          color="textSecondary"
          style={{ marginTop: 10 }}
        >
          Click the "COPY" button to copy the URL. Then, Paste it into the
          message box on selected platform.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCopy} color="primary">
          Copy
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const RecipeInformationWrapped = () => {
  const { theme } = useTheme();
  const navigate = useNavigate(); // For redirecting to Meal Plan page
  const [mealPlan, setMealPlan] = useState<any[]>([]); // Local state for meal plan
  let { id } = useParams()
  const dispatch = useDispatch()
  const [input, setInput] = useState('')
  const [response, setResponse] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [openModal, setOpenModal] = useState<boolean>(false)
  const [selectedPlatform, setSelectedPlatform] = useState('slack')
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [notes, setNotes] = useState<string>('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [userNotes, setUserNotes] = useState<any[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  // Get current user email from localStorage
  useEffect(() => {
    const userEmail = localStorage.getItem('userEmail');
    setCurrentUserEmail(userEmail);
  }, []);

  // Fetch user's notes when component mounts
  useEffect(() => {
    const fetchNotes = async () => {
      if (currentUserEmail && id) {
        try {
          const notesresponse = await axios.get(`http://localhost:8000/recipe/${id}/notes?user_email=${currentUserEmail}`);
          setUserNotes(notesresponse.data.notes);
          // Set the most recent note as the current note
          if (notesresponse.data.notes.length > 0) {
            setNotes(notesresponse.data.notes[notesresponse.data.notes.length - 1].note);
          }
        } catch (error) {
          console.error('Error fetching notes:', error);
        }
      }
    };
    fetchNotes();
  }, [currentUserEmail, id]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleSaveNotes = async () => {
    if (!currentUserEmail) {
      alert('Please log in to save notes');
      return;
    }

    try {
      await axios.post(`http://localhost:8000/recipe/${id}/notes`, { 
        note: notes,
        user_email: currentUserEmail
      });
      setIsEditingNotes(false);
      // Refresh notes after saving
      const notesresponse = await axios.get(`http://localhost:8000/recipe/${id}/notes?user_email=${currentUserEmail}`);
      setUserNotes(notesresponse.data.notes);
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes. Please try again.');
    }
  };

  const handleShareClick = (urlId: string, platform: 'slack' | 'discord') => {
    setOpenModal(true)
    setSelectedPlatform(platform)
  }

  const handleButtonClick = () => {
    setShowInput(true)
  }

  const handleInputChange = (e: any) => {
    setInput(e.target.value)
  }

  // accesses the state of the component from the app's store
  const recipeInfo = useSelector((state: any) => state.getRecipeInfoAppState)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  const loadVoices = () => {
    if (window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      if (voices.length > 0) {
        setSelectedVoice(voices[0]); // Default to the first voice
      }
    }
  };
  
  // Ensure voices are loaded after the window is loaded
  useEffect(() => {
    const handleVoiceChange = () => loadVoices(); // Re-run on voice change
    if (typeof window.speechSynthesis !== "undefined") {
      window.speechSynthesis.onvoiceschanged = handleVoiceChange; // Event to detect voice changes
      loadVoices(); // Initial load
    }
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const speakInstructions = (instruction: string) => {
    if (!isSpeaking && selectedVoice) {
      const synth = window.speechSynthesis
      const utterance = new SpeechSynthesisUtterance(instruction)
      utterance.voice = selectedVoice;
      utterance.onend = () => setIsSpeaking(false);
      synth.speak(utterance);
      setIsSpeaking(true);
    }
  }
  /* the effect hook below does an api call to get the recipe details
      using the recipe id as soon as the compnent gets loaded up */
  useEffect(() => {
    dispatch(getRecipeInfoInitiator('http://localhost:8000/recipe/' + id))
    return () => {
      // state cleanup here
    }
  }, [])

  const handleAddToShoppingList = async () => {
    if (!currentUserEmail) {
      alert('Please log in to add ingredients to your shopping list');
      return;
    }

    try {
      const ingredients = recipeInfo.getRecipeInfoData?.ingredients.map((ingredient: any) => ({
        name: ingredient || '',
        quantity: parseFloat(ingredient.quantity) || 1, // Convert to float, default to 1 if invalid
        unit: ingredient.unit || 'piece', // Default to 'piece' if no unit specified
        checked: false,
        user_email: currentUserEmail || ''
      })) || [];

      await axios.post('http://localhost:8000/shopping-list/update', ingredients);
      alert('Ingredients added to shopping list!');
    } catch (error) {
      console.error('Error adding ingredients to shopping list:', error);
      alert('Failed to add ingredients to shopping list');
    }
  };

  
  if (recipeInfo.isGetRecipeInfoLoading) {
    return <div data-testid="loading-spinner"> Loading ... </div>
  }  else if (recipeInfo.isGetRecipeInfoError) {
    return <div data-testid="error-message">Failed to load recipe data</div>;
  } else if (recipeInfo.isGetRecipeInfoSuccess) {
    const recipe = recipeInfo.getRecipeInfoData // The recipe object containing all necessary information
    const recipeDetailsforLLM = `
      Name: ${recipe.name}
      Ingredients: ${Array.isArray(recipe.ingredients) ? recipe.ingredients.join(', ') : 'No ingredients available'}
      Rating: ${recipe.rating}
      Rating: ${recipe.rating}
      Prep Time: ${recipe.prepTime}
      Sugar: ${recipe.sugar}g
      Carbs: ${recipe.carbs}g
      Protein: ${recipe.protein}g
      Cuisine: ${recipe.category}
      Servings: ${recipe.servings}
      Cook Time: ${recipe.cookTime}
      Cholesterol: ${recipe.cholesterol}mg/dl
      Fat: ${recipe.fat}g
      Instructions: ${Array.isArray(recipe.instructions) ? recipe.instructions.join(' ') : 'No instructions available'}
    `
    const handleSubmit = async () => {
      try {
        const result = await axios.post(
          'http://localhost:8000/recipe/recommend-recipes/',
          { query: input, context: recipeDetailsforLLM }
        )
        setResponse(result.data.response)
      } catch (error) {
        console.error('Error fetching recipe recommendations:', error)
      }
    }
    // Function to handle formatting
    const formatText = (text: string) => {
      return text.split('\n').map((line, index) => {
        // Check for "**" bold markers first
        const boldRegex = /\*\*(.*?)\*\*/g
        let formattedLine = line
        if (boldRegex.test(line)) {
          // Replace "**text**" with <strong>text</strong>
          formattedLine = line.replace(
            boldRegex,
            (match, p1) => `<strong>${p1}</strong>`
          )
        }

        // Check if the line starts with "*", convert to list items
        if (formattedLine.trim().startsWith('*')) {
          return <li key={index}>{formattedLine.replace('*', '').trim()}</li>
        }

        // Return as a paragraph for other lines
        return (
          <p
            key={index}
            dangerouslySetInnerHTML={{ __html: formattedLine }}
          ></p>
        )
      })
    }

    const handleAddToMealPlan = async (recipee: any, dayIndex: number) => {
      try {
        const responsee = await axios.post("http://localhost:8000/recipe/meal-plan/", {
          day: dayIndex,
          recipe: recipee,
        });
        console.log(responsee.data.message); // Success message
        alert(`${recipee.name} added to the meal plan for ${
          ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][dayIndex]
        }!`);
      } catch (error) {
        console.error("Error saving meal plan:", error);
        alert("Failed to save the meal plan. Please try again.");
      }
    };

    return (
      <div
        style={{ width: '100vw', color: theme.color, paddingTop: '20px', background: theme.background }}
        data-testid="RecipeInfo-comp-43"
      >
        {openModal && (
          <CopyUrlModal
            open={openModal}
            onClose={() => setOpenModal(false)}
            url={`https://cookbook-alpha.vercel.app/recipe-details/${id}`}
            platform={selectedPlatform}
          />
        )}
       <Typography variant="h4" gutterBottom className="recipe-header">
  {recipe.name}
</Typography>
<div style={{ marginTop: '10px' }}>
<select
style={{
  backgroundColor: theme.headerColor,
  color: theme.color,
  border: `1px solid ${theme.headerColor}`,
  borderRadius: '4px',
  padding: '8px 12px',
  marginRight: '10px',
  fontSize: '16px',
  transition: 'transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease',
  cursor: 'pointer',
}}
  onChange={(e) => setSelectedDayIndex(Number(e.target.value))}
  value={selectedDayIndex}
>
  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => (
    <option key={index} value={index} style={{
      backgroundColor: theme.background,
      color: theme.color,
      fontSize: '16px',
    }}>
      {day}
    </option>
  ))}
</select>
  <Button
    variant="contained"
    style={{
      backgroundColor: theme.headerColor,
      color: theme.color,
      marginRight: '10px',
      transition: 'transform 0.2s ease, background-color 0.2s ease',
    }}
    onMouseEnter={(e) =>
      (e.currentTarget.style.backgroundColor = theme.background)
    }
    onMouseLeave={(e) =>
      (e.currentTarget.style.backgroundColor = theme.headerColor)
    }
    onClick={() => handleAddToMealPlan(recipe, selectedDayIndex)}
  >
    Add to Meal Plan
  </Button>
  <Button
            variant="contained"
            color="primary"
            onClick={handleAddToShoppingList}
            startIcon={<ShoppingCartIcon />}
          >
            Add to Shopping List
  </Button>
  <Button
    variant="outlined"
    style={{
      borderColor: theme.headerColor,
      color: theme.headerColor,
      transition: 'transform 0.2s ease, border-color 0.2s ease',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.color = theme.color;
      e.currentTarget.style.borderColor = theme.color;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.color = theme.headerColor;
      e.currentTarget.style.borderColor = theme.headerColor;
    }}
    onClick={() => navigate('/meal')}
  >
    Go to Meal Plan
  </Button>
</div>        
        <div style={{ float: 'left', width: '30vw',color: theme.color , background: theme.background}}>
          <Paper elevation={24} style={triviaPaperStyles}>
            <Grid container spacing={3} style={{ background: theme.background, color: theme.color,  }}>
              <Grid item xs={12} style={{ textAlign: 'center', color: theme.color, background: theme.background}}>
                <Typography variant="h5" gutterBottom style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  Summary
                    <RecipeFavoriteButton recipe={recipe} />
                </Typography>

              </Grid>
              <Grid item xs={12} textAlign={'left'} style={{ background: theme.background, color: theme.color,  }}>
                <Typography variant="h6">
                  Ingredients:
                  <Typography variant="subtitle1" gutterBottom>
                    {recipe?.ingredients?.map((ele: any, idx: number) => {
                      return (
                        <>
                          {ele}
                          {recipe?.ingredients?.length - 1 === idx ? `` : `, `}
                        </>
                      )
                    })}
                  </Typography>
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Stack
                  direction="column"
                  spacing={2}
                  paddingBottom="20px"
                  textAlign={'left'}
                >
                  <Typography variant="h6">
                    Rating:
                    <Typography variant="subtitle1" gutterBottom>
                      {Array.from({
                        length: Math.floor(Number(recipe?.rating)),
                      }).map((ele: any) => {
                        return <StarIcon fontSize="small" />
                      })}
                    </Typography>
                  </Typography>
                  <Typography variant="h6">
                    Prep Time:
                    <Typography variant="subtitle1" gutterBottom>
                      {recipe?.prepTime}
                    </Typography>
                  </Typography>
                  <Typography variant="h6">
                    Sugar:
                    <Typography variant="subtitle1" gutterBottom>
                      {recipe?.sugar}g
                    </Typography>
                  </Typography>
                  <Typography variant="h6">
                    Carbs:
                    <Typography variant="subtitle1" gutterBottom>
                      {recipe?.carbs}g
                    </Typography>
                  </Typography>
                  <Typography variant="h6">
                    Proteins:
                    <Typography variant="subtitle1" gutterBottom>
                      {recipe?.protein}g
                    </Typography>
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={6}>
                <Stack
                  direction="column"
                  spacing={2}
                  paddingBottom="20px"
                  textAlign={'left'}
                >
                  <Typography variant="h6">
                    Cuisine:
                    <Typography variant="subtitle1" gutterBottom>
                      {recipe?.category}
                    </Typography>
                  </Typography>
                  <Typography variant="h6">
                    Servings:
                    <Typography variant="subtitle1" gutterBottom>
                      {recipe?.servings}
                    </Typography>
                  </Typography>
                  <Typography variant="h6">
                    Cook Time:
                    <Typography variant="subtitle1" gutterBottom>
                      {recipe?.cookTime}
                    </Typography>
                  </Typography>
                  <Typography variant="h6">
                    Cholestrol:
                    <Typography variant="subtitle1" gutterBottom>
                      {recipe?.cholesterol}mg/dl
                    </Typography>
                  </Typography>
                  <Typography variant="h6">
                    Fats:
                    <Typography variant="subtitle1" gutterBottom>
                      {recipe?.fat}g
                    </Typography>
                  </Typography>
                </Stack>
              </Grid>
              <Grid
                item
                xs={12}
                style={{
                  marginTop: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  
                }}
              >
                <button
                  onClick={() => shareOnWhatsApp(window.location.href)} // Generates a WhatsApp sharing link for the recipe
                  style={{
                    backgroundColor: '#25D366',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = 'scale(1.05)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = 'scale(1)')
                  }
                >
                  <FaWhatsapp
                    style={{ marginRight: '10px', fontSize: '1.2em' }}
                  />
                  WhatsApp
                </button>
                <button
                  onClick={() =>
                    handleShareClick(window.location.href, 'slack')
                  }
                  style={{
                    backgroundColor: '#7C3085',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = 'scale(1.05)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = 'scale(1)')
                  }
                >
                  <FaSlack style={{ marginRight: '10px', fontSize: '1.2em' }} />
                  Slack
                </button>
                <button
                  onClick={() =>
                    handleShareClick(window.location.href, 'discord')
                  }
                  style={{
                    backgroundColor: '#5865F2',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = 'scale(1.05)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = 'scale(1)')
                  }
                >
                  <FaDiscord
                    style={{ marginRight: '10px', fontSize: '1.2em' }}
                  />
                  Discord
                </button>
              </Grid>

            </Grid>
          </Paper>
        </div>
        <div style={{ float: 'left', width: '40vw', marginTop: '15px' , }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Stack
                direction="column"
                spacing={2}
                paddingBottom="20px"
                textAlign={'left'}
                
              >
                <div data-testid="help-icon"
                className="helper-text" style={{ color: theme.color }}>
                  Tap on any step below to hear the instructions read aloud.
                  Follow along with the recipe as you cook, and feel free to
                  pause or repeat any step!
                </div>
                <div style={{ marginBottom: '20px' }}>
        <label htmlFor="voiceSelector" style={{ marginRight: '10px' }}>
          Select Voice:
        </label>
        <select
          id="voiceSelector"
          style={{ backgroundColor: theme.headerColor, 
            color: theme.color, 
            borderColor: theme.color,
            padding: '10px 20px',
            borderRadius: '5px',
            boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease',
  cursor: 'pointer', }}
          onChange={(e) => {
            const selected = availableVoices.find((voice) => voice.name === e.target.value);
            setSelectedVoice(selected || null);
          }}
          value={selectedVoice?.name || ''}
        >
          {availableVoices.map((voice) => (
            <option key={voice.name} value={voice.name}>
              {voice.name} ({voice.lang})
            </option>
          ))}
        </select>
      </div>
                {Array.isArray(recipe?.instructions) && recipe.instructions.map((inst: string, idx: number) => (
                  <div
                  style={{  backgroundColor: theme.background, // Card background from theme
                    color: theme.color, // Card text color
                    borderColor: theme.headerColor,
                    borderWidth: '2px', // Set the desired border thickness
                    borderStyle: 'solid',
                   }}
                                      key={idx}
                    className="step"
                    onClick={() => speakInstructions(inst)}
                  >
                    <Typography variant="h6">
                      Step {idx + 1}:
                      <Typography variant="subtitle1" gutterBottom>
                        {inst}
                      </Typography>
                    </Typography>
                  </div>
                ))}
              </Stack>
              <Stack
                direction="column"
                spacing={2}
                paddingBottom="20px"
                textAlign={'left'}
              >
                <Button
                  onClick={handleButtonClick}
                  variant="contained"
                  color="primary"
                  style={{ width: '200px', color:theme.color, background: theme.headerColor }}
                >
                  CUSTOMIZE
                </Button>
                {showInput && (
                  <div className="input-group"  style={{  backgroundColor: theme.headerColor, // Card background from theme
                    color: theme.color, // Card text color
                    
                   }} >
                    <input
                      type="text"
                      value={input}
                      onChange={handleInputChange}
                      className="input-textbox"
                    />
                    {input.length > 0 && (
                      <button
                        onClick={handleSubmit}
                        className="submit-button"
                      ></button>
                    )}
                  </div>
                )}
                <Typography variant="subtitle1" gutterBottom>
                  {formatText(response)}
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        </div>
        <div style={{ float: 'left', width: '30vw' , color: theme.color, background:theme.headerColor}}>
          <Grid container spacing={2}> 
            <Grid item xs={12}>
              {recipe?.images?.length > 0 && recipe?.images[0] !== '' ? (
                <Typography variant="subtitle1" gutterBottom>
                  <Stack direction="column" spacing={2} padding="25px">
                    {recipe.images
                      .reverse()
                      .slice(0, 3)
                      .map((imageLink: string, idx: number) => {
                        imageLink = imageLink.replaceAll('"', '')
                        return (
                          <img
                            src={imageLink}
                            alt={`Cannot display pic ${idx + 1}`}
                          />
                        )
                      })}
                  </Stack>
                </Typography>
              ) : (
                <img src={noImage} alt={`Cannot display pic`} />
              )}
            </Grid>
            <Grid item xs={12}>
              <Paper elevation={24} style={{
                backgroundColor: theme.background,
                padding: '20px',
                margin: '20px',
                border: `2px solid ${theme.headerColor}`,
              }}>
                <Typography variant="h5" gutterBottom style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  color: theme.color 
                }}>
                  Notes
                  <IconButton 
                    onClick={() => setIsEditingNotes(!isEditingNotes)}
                    style={{ color: theme.color }}
                  >
                    {isEditingNotes ? '✕' : '✎'}
                  </IconButton>
                </Typography>
                
                {isEditingNotes ? (
                  <div>
                    <textarea
                      value={notes}
                      onChange={handleNotesChange}
                      style={{
                        width: '100%',
                        minHeight: '150px',
                        padding: '10px',
                        marginBottom: '10px',
                        backgroundColor: theme.background,
                        color: theme.color,
                        border: `1px solid ${theme.headerColor}`,
                        borderRadius: '4px',
                      }}
                      placeholder="Add your notes here..."
                    />
                    <Button
                      variant="contained"
                      onClick={handleSaveNotes}
                      style={{
                        backgroundColor: theme.headerColor,
                        color: theme.color,
                      }}
                    >
                      Save Notes
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Typography variant="body1" style={{ 
                      color: theme.color,
                      whiteSpace: 'pre-wrap',
                      minHeight: '150px',
                    }}>
                      {notes || 'No notes added yet.'}
                    </Typography>
                    {userNotes.length > 0 && (
                      <div style={{ marginTop: '20px' }}>
                        <Typography variant="subtitle2" style={{ color: theme.color }}>
                          Previous Notes:
                        </Typography>
                        {userNotes.slice(0, -1).reverse().map((note, index) => (
                          <Paper key={index} style={{
                            backgroundColor: theme.background,
                            padding: '10px',
                            marginTop: '10px',
                            border: `1px solid ${theme.headerColor}`,
                          }}>
                            <Typography variant="body2" style={{ color: theme.color }}>
                              {note.note}
                            </Typography>
                            <Typography variant="caption" style={{ color: theme.color }}>
                              {new Date(note.created_at).toLocaleString()}
                            </Typography>
                          </Paper>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Paper>
            </Grid>
          </Grid>
        </div>
        </div>
        
        
        
      
    
    )
  } else {
    return <> Error! Recipe not found! </>
  }
}

const RecipeInformation = () => {
  return (
    <Provider store={store}>
      <RecipeInformationWrapped />
    </Provider>
  )
}

export default RecipeInformation
