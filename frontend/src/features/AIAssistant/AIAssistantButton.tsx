import React, { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { ChatBubbleOutline } from '@mui/icons-material';
import { useTheme } from '../Themes/themeContext';
import AIAssistant from './AIAssistant';

const AIAssistantButton: React.FC = () => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Tooltip title="Ask AI Assistant" placement="left">
        <IconButton
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: theme.headerColor,
            color: theme.color,
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            zIndex: 1000,
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <ChatBubbleOutline style={{ fontSize: '30px' }} />
        </IconButton>
      </Tooltip>
      <AIAssistant isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default AIAssistantButton; 