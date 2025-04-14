import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, IconButton, Typography } from '@mui/material';
import { ChatBubbleOutline } from '@mui/icons-material';
import axios from 'axios';
import { useTheme } from '../Themes/themeContext';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await axios.post(
        'http://localhost:8000/recipe/recommend-recipes/',
        { 
          query: input,
          context: "I am a general cooking and recipe assistant. Please help me with my query."
        }
      );
      setResponse(result.data.response);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      setResponse('Sorry, I encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        style: {
          backgroundColor: theme.background,
          color: theme.color,
        }
      }}
    >
      <DialogTitle style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `1px solid ${theme.headerColor}`
      }}>
        <Typography variant="h6">AI Cooking Assistant</Typography>
        <IconButton onClick={onClose} style={{ color: theme.color }}>
          ✕
        </IconButton>
      </DialogTitle>
      <DialogContent style={{ minHeight: '300px', padding: '20px' }}>
        {response && (
          <div style={{ 
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: theme.headerColor,
            borderRadius: '8px',
            color: theme.color
          }}>
            <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
              {response}
            </Typography>
          </div>
        )}
        <TextField
          fullWidth
          multiline
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything about cooking, recipes, or meal planning..."
          variant="outlined"
          style={{
            backgroundColor: theme.background,
            color: theme.color,
            borderColor: theme.headerColor,
          }}
          InputProps={{
            style: { color: theme.color }
          }}
        />
      </DialogContent>
      <DialogActions style={{ 
        padding: '20px',
        borderTop: `1px solid ${theme.headerColor}`
      }}>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={isLoading || !input.trim()}
          style={{
            backgroundColor: theme.headerColor,
            color: theme.color,
          }}
        >
          {isLoading ? 'Thinking...' : 'Send'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AIAssistant; 