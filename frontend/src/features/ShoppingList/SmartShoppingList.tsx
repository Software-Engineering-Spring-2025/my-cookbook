import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  IconButton,
  Typography,
  InputAdornment,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { jsPDF } from 'jspdf'
import shoppingListImage from './image/shopping-list.jpg'
import { useTheme } from '../Themes/themeContext'

interface ShoppingItem {
  _id: string
  name: string
  quantity: number
  unit: string
  checked: boolean
  user_email?: string
}

const SmartShoppingList: React.FC = () => {
  const { theme } = useTheme();
  const [listItems, setListItems] = useState<ShoppingItem[]>([])
  const [newItem, setNewItem] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [unit, setUnit] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const units = [
    'kg',
    'g',
    'lb',
    'oz',
    'liter',
    'ml',
    'dozen',
    'bunch',
    'head',
    'loaf',
    'piece',
    'cup',
    'tablespoon',
    'teaspoon',
    'can',
    'pack',
    'box',
    'jar',
    'bottle',
    'slice',
    'packet',
  ]

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    setUserEmail(email);
  }, []);

  useEffect(() => {
    const fetchListItems = async () => {
      if (!userEmail) return;
      
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:8000/shopping-list?user_email=${userEmail}`);
        setListItems(response.data.shopping_list);
      } catch (error) {
        console.error('Error fetching shopping list:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchListItems();
  }, [userEmail]);

  const addItemToList = async () => {
    if (!userEmail) {
      alert('Please log in to add items to your shopping list');
      return;
    }

    if (!newItem.trim() || !unit.trim()) {
      window.alert('Please fill in all fields.');
      return;
    }
    setIsProcessing(true);

    try {
      const newItemData = {
        name: newItem,
        quantity,
        unit,
        checked: false,
        user_email: userEmail
      };

      const response = await axios.post(
        'http://localhost:8000/shopping-list/update',
        [newItemData]
      );

      setListItems(response.data.shopping_list);
      setNewItem('');
      setQuantity(1);
      setUnit('');
    } catch (error) {
      console.error('Error adding item:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleItemCheck = async (itemId: string) => {
    if (!userEmail) return;

    const itemIndex = listItems.findIndex((item) => item._id === itemId);
    if (itemIndex === -1) return;

    const updatedItem = {
      ...listItems[itemIndex],
      checked: !listItems[itemIndex].checked,
      user_email: userEmail
    };

    try {
      await axios.put(
        `http://localhost:8000/shopping-list/${itemId}`,
        updatedItem
      );

      const updatedItems = [...listItems];
      updatedItems[itemIndex] = updatedItem;
      setListItems(updatedItems);
    } catch (error) {
      console.error('Error updating item check status:', error);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!userEmail) return;

    try {
      await axios.delete(`http://localhost:8000/shopping-list/${itemId}?user_email=${userEmail}`);
      setListItems((prevItems) =>
        prevItems.filter((item) => item._id !== itemId)
      );
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const exportListToPDF = () => {
    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.text('Shopping List', 20, 20)

    let yOffset = 30
    listItems.forEach((item) => {
      doc.setFontSize(12)
      doc.text(
        `${item.name} - Quantity: ${item.quantity} ${item.unit}`,
        20,
        yOffset
      )
      yOffset += 10
    })

    doc.save('shopping_list.pdf')
  }

  return (
    <div
      style={{ width: '40%', textAlign: 'center', fontFamily: 'RobotoThin' }}
    >
      <h2>Smart Shopping List</h2>
      <img
        src={shoppingListImage}
        alt="Shopping List"
        style={{
          width: 'auto',
          height: 'auto',
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'cover',
          padding: 0,
          margin: 0,
        }}
      />
      <TextField
        label="Add a shopping item"
        value={newItem}
        onChange={(e) => setNewItem(e.target.value)}
        fullWidth
        variant="outlined"
        disabled={isProcessing}
        margin="normal"
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: theme.color,
            },
            '&:hover fieldset': {
              borderColor: theme.headerColor,
            },
            '&.Mui-focused fieldset': {
              borderColor: theme.color,
            },
            '& .MuiInputBase-input': {
              color: theme.color,
            },
          },
          '& .MuiInputLabel-root': {
            color: theme.color,
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: theme.color,
          },
        }}
      />
      <TextField
        label="Quantity"
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        fullWidth
        variant="outlined"
        margin="normal"
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: theme.color,
            },
            '&:hover fieldset': {
              borderColor: theme.color,
            },
            '&.Mui-focused fieldset': {
              borderColor: theme.color,
            },
            '& .MuiInputBase-input': {
              color: theme.color,
            },
          },
          '& .MuiInputLabel-root': {
            color: theme.color,
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: theme.color,
          },
        }}
      />
      <FormControl
        fullWidth
        variant="outlined"
        margin="normal"
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: theme.color,
            },
            '&:hover fieldset': {
              borderColor: theme.color,
            },
            '&.Mui-focused fieldset': {
              borderColor: theme.color,
            },
          },
          '& .MuiSelect-select': {
            textAlign: 'left',
          },
          '& .MuiInputLabel-root': {
            color: theme.color,
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: theme.color,
          },
        }}
      >
        <InputLabel>Unit</InputLabel>
        <Select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          label="Unit"
          disabled={isProcessing}
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: 200,
                overflowY: 'auto',
              },
            },
          }}
        >
          {units.map((unitOption, index) => (
            <MenuItem key={index} value={unitOption}>
              {unitOption}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button
        variant="contained"
        color="primary"
        onClick={addItemToList}
        disabled={isProcessing}
        fullWidth
        sx={{
          backgroundColor: theme.headerColor,
          '&:hover': {
            backgroundColor: theme.color,
          },
          marginBottom: '20px',
        }}
      >
        {isProcessing ? 'Adding...' : 'Add Item'}
      </Button>
      {loading ? (
        <CircularProgress />
      ) : (
        <List>
          {listItems.map((item) => (
            <ListItem key={item._id} style={{ marginBottom: '10px' }}>
              <Checkbox
                checked={item.checked}
                onChange={() => toggleItemCheck(item._id)}
                sx={{
                  '& .MuiSvgIcon-root': {
                    color: 'black',
                  },
                  '&.Mui-checked .MuiSvgIcon-root': {
                    color: 'green',
                  },
                  '&:hover': {
                    backgroundColor: 'transparent',
                  },
                }}
              />
              <ListItemText
                primary={`${item.name} (Unit: ${item.unit})`}
                secondary={`Quantity: ${item.quantity}`}
              />
              <IconButton onClick={() => deleteItem(item._id)} color="error">
                <DeleteIcon />
              </IconButton>
            </ListItem>
          ))}
        </List>
      )}

      <div>
        <Button
          variant="outlined"
          onClick={exportListToPDF}
          style={{ marginTop: '20px' }}
          fullWidth
          sx={{
            borderColor: theme.headerColor,
            color: theme.color,
            '&:hover': {
              borderColor: theme.color,
              color: theme.headerColor,
            },
          }}
        >
          Export List
        </Button>
      </div>
    </div>
  )
}

export default SmartShoppingList
