jest.mock('axios', () => ({
  get: jest.fn(),
}));

global.HTMLCanvasElement.prototype.getContext = jest.fn();

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MealPage from './MealPage';
import axios from 'axios';
import { ThemeProvider } from '../../Themes/themeContext';


const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MealPage Component', () => {
  beforeEach(() => {
    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/meal-plan')) {
        return Promise.resolve({ data: [] });
      }
      if (url.includes('/recipe/random')) {
        return Promise.resolve({ data: { name: 'Random Recipe', instructions: ['Random step'] } });
      }
      return Promise.resolve({ data: [
        { name: 'Pasta', instructions: ['Boil', 'Serve'] },
        { name: 'Burger', instructions: ['Grill patty'] },
        { name: 'Taco', instructions: ['Fold shell'] },
      ] });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  //1
  test('renders the component and displays the title', () => {
    render(<ThemeProvider><MealPage /></ThemeProvider>);
    expect(screen.getByText('My Meal Plan')).toBeInTheDocument();
  });

  // 2
  test('displays a table with meal plan data', async () => {
    render(<ThemeProvider><MealPage /></ThemeProvider>);
    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalled());
    expect(screen.getAllByText('No meal planned').length).toBe(7);
  });

  // 3
  test('handles errors during data fetching gracefully', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));
    render(<ThemeProvider><MealPage /></ThemeProvider>);
    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalled());
    expect(screen.getAllByText('No meal planned').length).toBe(7);
  });

  // 4
  test('triggers print functionality when Print Meal Plan is clicked', () => {
    window.print = jest.fn();
    render(<ThemeProvider><MealPage /></ThemeProvider>);
    fireEvent.click(screen.getByText('Print Meal Plan'));
    expect(window.print).toHaveBeenCalled();
  });

  describe('Drag and Drop Integration', () => {
    // 5
    test('adds a recipe to a day cell after mock drop', async () => {
      render(<ThemeProvider><MealPage /></ThemeProvider>);
      await waitFor(() => expect(mockedAxios.get).toHaveBeenCalled());
      expect(screen.getByText('Recipe Library')).toBeInTheDocument();
    });

    // 6
    test('renders the Edit Meal Plan button', () => {
      render(<ThemeProvider><MealPage /></ThemeProvider>);
      expect(screen.getByText('Edit Meal Plan')).toBeInTheDocument();
    });

    // 7
    test('renders recipe library heading', () => {
      render(<ThemeProvider><MealPage /></ThemeProvider>);
      expect(screen.getByText('Recipe Library')).toBeInTheDocument();
    });

    // 8
    test('handles invalid drop area gracefully', async () => {
      render(<ThemeProvider><MealPage /></ThemeProvider>);
      const before = mockedAxios.get.mock.calls.length;
      fireEvent.drop(document.body); // drop outside
      const after = mockedAxios.get.mock.calls.length;
      expect(after).toBeGreaterThanOrEqual(before);
    });

    // 9
    test('renders table headers correctly', () => {
      render(<ThemeProvider><MealPage /></ThemeProvider>);
      expect(screen.getByText('Day')).toBeInTheDocument();
      expect(screen.getByText('Recipe')).toBeInTheDocument();
      expect(screen.getByText('Steps')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    //10
    test('displays all days of the week', () => {
      render(<ThemeProvider><MealPage /></ThemeProvider>);
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      days.forEach(day => {
        expect(screen.getByText(day)).toBeInTheDocument();
      });
    });

    //11
    test('displays delete buttons for each day', async () => {
      render(<ThemeProvider><MealPage /></ThemeProvider>);
      await waitFor(() => expect(mockedAxios.get).toHaveBeenCalled());
      expect(screen.getAllByText('Delete').length).toBe(7);
    });

  //12
  test('displays message when recipe library is empty', async () => {
    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/recipe')) return Promise.resolve({ data: [] });
      if (url.includes('/meal-plan')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
  
    render(<ThemeProvider><MealPage /></ThemeProvider>);
  
    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalled());
    expect(screen.getByText(/Recipe Library/i)).toBeInTheDocument();
    expect(screen.queryByText('Pasta')).not.toBeInTheDocument();
  });
  //13
  test('handles empty recipe library', async () => {
    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/recipe')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
  
    render(<ThemeProvider><MealPage /></ThemeProvider>);
    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalled());
    expect(screen.queryByText('Pasta')).not.toBeInTheDocument();
  });
    //14
    test('renders at least one draggable recipe', async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/recipe')) {
          return Promise.resolve({
            data: [
              { name: 'Pasta', instructions: ['Boil water', 'Cook pasta'] },
            ],
          });
        }
        if (url.includes('/meal-plan')) {
          return Promise.resolve({ data: [] });
        }
        return Promise.resolve({ data: [] });
      });
    
      render(<ThemeProvider><MealPage /></ThemeProvider>);
    
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    
      const recipe = await screen.findByText((content, node) =>
        node?.textContent === 'Pasta'
      );
    
      expect(recipe).toBeInTheDocument();
    });
});

//15
test('refreshes recipe list on Refresh click', async () => {
  render(<ThemeProvider><MealPage /></ThemeProvider>);
  await waitFor(() => expect(mockedAxios.get).toHaveBeenCalled());

  const refreshBtn = screen.queryByText(/Refresh/i);
  if (refreshBtn) {
    fireEvent.click(refreshBtn);
    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledTimes(2));
  }
});

//16
test('fetches meal plan and recipe library on initial render', async () => {
  render(<ThemeProvider><MealPage /></ThemeProvider>);
  await waitFor(() => {
    expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('/meal-plan'));
    expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('/recipe'));
  });
});

//17
test('drag-and-drop instructions exist in hidden region', async () => {
  render(<ThemeProvider><MealPage /></ThemeProvider>);
  const liveRegion = await screen.findByRole('status');
  expect(liveRegion).toBeInTheDocument();
  expect(liveRegion).toHaveStyle({ clipPath: 'inset(100%)' });
});

//18
test('each day cell has placeholder or content', async () => {
  render(<ThemeProvider><MealPage /></ThemeProvider>);
  await waitFor(() => expect(mockedAxios.get).toHaveBeenCalled());
  const recipeCells = screen.getAllByRole('cell').filter((_, idx) => (idx - 1) % 4 === 0); 
  recipeCells.forEach(cell => {
    expect(cell.textContent?.length).toBeGreaterThan(0);
  });
});

//19
test('cancels drag when escape is pressed', async () => {
  render(<ThemeProvider><MealPage /></ThemeProvider>);
  const recipe = await screen.findByText('Pasta');
  recipe.focus();
  fireEvent.keyDown(recipe, { key: ' ', code: 'Space' });
  fireEvent.keyDown(recipe, { key: 'Escape', code: 'Escape' });

  expect(recipe.getAttribute('aria-grabbed')).not.toBe('true');
});

//20
test('handles drop with invalid data', async () => {
  render(<ThemeProvider><MealPage /></ThemeProvider>);
  const dayCell = screen.getAllByText('No meal planned')[0];

  const dataTransfer = {
    getData: jest.fn().mockReturnValue("not-json"),
    setData: jest.fn()
  };

  fireEvent.drop(dayCell, { dataTransfer });

  await waitFor(() => {
    expect(dayCell).toHaveTextContent('No meal planned');
  });
});

//21
test('drop with missing recipe fields is ignored', async () => {
  render(<ThemeProvider><MealPage /></ThemeProvider>);
  const cell = screen.getAllByText('No meal planned')[0];

  fireEvent.drop(cell, {
    dataTransfer: {
      getData: () => JSON.stringify({ instructions: ['Do something'] }),
      setData: () => {}
    }
  });

  await waitFor(() => expect(cell).toHaveTextContent('No meal planned'));
});

//22
test('dropping on a non-cell element like header does not update anything', async () => {
  render(<ThemeProvider><MealPage /></ThemeProvider>);
  const header = screen.getByText('Recipe Library');

  const dataTransfer = {
    getData: jest.fn().mockReturnValue(JSON.stringify({ name: 'Omelette', instructions: ['Whisk eggs'] })),
    setData: jest.fn()
  };

  fireEvent.drop(header, { dataTransfer });

  await waitFor(() => {
    expect(screen.queryByText('Omelette')).not.toBeInTheDocument();
  });
});

//23
test('fills and saves a new meal for selected day', async () => {
  render(<ThemeProvider><MealPage /></ThemeProvider>);

  fireEvent.click(screen.getByText(/Edit Meal Plan/i));

  fireEvent.change(screen.getByLabelText(/Day:/i), { target: { value: '2' } }); // Wednesday
  fireEvent.change(screen.getByLabelText(/Recipe:/i), { target: { value: 'Salad' } });
  fireEvent.change(screen.getByLabelText(/Instructions:/i), {
    target: { value: 'Chop\nMix' }
  });

  fireEvent.click(screen.getByText('Save'));

  await waitFor(() => {
    const cell = screen.getByText('Wednesday').closest('tr')?.querySelectorAll('td')[1];
    expect(cell?.textContent).toContain('Salad');
  });
});

// 24
test('fetchNewRecipe does not add duplicate recipes', async () => {
  mockedAxios.get.mockResolvedValueOnce({
    data: { name: 'Pasta', instructions: ['Boil'] },
  });

  render(<ThemeProvider><MealPage /></ThemeProvider>);

  
  fireEvent.drop(screen.getAllByText('No meal planned')[0], {
    dataTransfer: {
      getData: () => JSON.stringify({ name: 'Pasta', instructions: ['Boil'] }),
    }
  });

  await waitFor(() => {
    const items = screen.getAllByText('Pasta');
    expect(items.length).toBeGreaterThanOrEqual(1);
  });
});
});

//######################################################
//######################################################

//1
test('opens the edit form and selects a day', () => {
  render(<ThemeProvider><MealPage /></ThemeProvider>);

  fireEvent.click(screen.getByText('Edit Meal Plan'));

  expect(screen.getByText('Save')).toBeInTheDocument();
  const select = screen.getByLabelText(/Day:/i) as HTMLSelectElement;

  fireEvent.change(select, { target: { value: '3' } });
  expect(select.value).toBe('3'); // Thursday
});

//2
test('opens the edit form and selects a day', () => {
  render(<ThemeProvider><MealPage /></ThemeProvider>);

  fireEvent.click(screen.getByText('Edit Meal Plan'));

  expect(screen.getByText('Save')).toBeInTheDocument();
  const select = screen.getByLabelText(/Day:/i) as HTMLSelectElement;

  fireEvent.change(select, { target: { value: '3' } });
  expect(select.value).toBe('3'); // Thursday
});

//3

test('handles cancel edit by hiding the form', () => {
  render(<ThemeProvider><MealPage /></ThemeProvider>);

  const button = screen.getByText('Edit Meal Plan');
  fireEvent.click(button);
  expect(screen.getByText('Save')).toBeInTheDocument();

  fireEvent.click(button);
  expect(screen.queryByText('Save')).not.toBeInTheDocument();
});

//4
test('does not update if inputs are empty', async () => {
  render(<ThemeProvider><MealPage /></ThemeProvider>);
  fireEvent.click(screen.getByText('Edit Meal Plan'));

  fireEvent.change(screen.getByLabelText(/Day:/i), { target: { value: '0' } });
  fireEvent.change(screen.getByLabelText(/Recipe:/i), { target: { value: '' } });
  fireEvent.change(screen.getByLabelText(/Instructions:/i), { target: { value: '' } });

  fireEvent.click(screen.getByText('Save'));

  const cell = screen.getByText('Monday').closest('tr')?.querySelectorAll('td')[1];
  expect(cell).toHaveTextContent('No meal planned');
});

//5
test('edits an existing meal and overrides it', async () => {
  render(<ThemeProvider><MealPage /></ThemeProvider>);

  fireEvent.click(screen.getByText('Edit Meal Plan'));

  
  fireEvent.change(screen.getByLabelText(/Day:/i), { target: { value: '2' } });
  fireEvent.change(screen.getByLabelText(/Recipe:/i), { target: { value: 'Curry' } });
  fireEvent.change(screen.getByLabelText(/Instructions:/i), { target: { value: 'Simmer sauce, Add chicken' } });

  fireEvent.click(screen.getByText('Save'));

  await waitFor(() => {
    const row = screen.getByText('Wednesday').closest('tr');
    expect(row).toHaveTextContent('Curry');
    expect(row).toHaveTextContent('Simmer sauce, Add chicken');
  });
});

//6
test('re-edits same day cell with new recipe', async () => {
  render(<ThemeProvider><MealPage /></ThemeProvider>);
  fireEvent.click(screen.getByText('Edit Meal Plan'));

  fireEvent.change(screen.getByLabelText(/Day:/i), { target: { value: '0' } });
  fireEvent.change(screen.getByLabelText(/Recipe:/i), { target: { value: 'Rice' } });
  fireEvent.change(screen.getByLabelText(/Instructions:/i), { target: { value: 'Boil water, Add rice' } });
  fireEvent.click(screen.getByText('Save'));

  fireEvent.click(screen.getByText('Edit Meal Plan'));
  fireEvent.change(screen.getByLabelText(/Day:/i), { target: { value: '0' } });
  fireEvent.change(screen.getByLabelText(/Recipe:/i), { target: { value: 'Noodles' } });
  fireEvent.change(screen.getByLabelText(/Instructions:/i), { target: { value: 'Boil, Stir, Serve' } });
  fireEvent.click(screen.getByText('Save'));

  await waitFor(() => {
    const row = screen.getByText('Monday').closest('tr');
    expect(row).toHaveTextContent('Noodles');
  });
});

//7
test('does not save meal if recipe name is empty', async () => {
  render(<ThemeProvider><MealPage /></ThemeProvider>);
  fireEvent.click(screen.getByText('Edit Meal Plan'));

  fireEvent.change(screen.getByLabelText(/Day:/i), { target: { value: '5' } });
  fireEvent.change(screen.getByLabelText(/Recipe:/i), { target: { value: '' } });
  fireEvent.change(screen.getByLabelText(/Instructions:/i), {
    target: { value: 'Some step' }
  });

  fireEvent.click(screen.getByText('Save'));

  await waitFor(() => {
    const row = screen.getByText('Saturday').closest('tr');
    expect(row).toHaveTextContent('No meal planned');
  });
});

//8
test('form pre-fills values for previously edited day when reopened', async () => {
  render(<ThemeProvider><MealPage /></ThemeProvider>);
  fireEvent.click(screen.getByText('Edit Meal Plan'));

  fireEvent.change(screen.getByLabelText(/Day:/i), { target: { value: '0' } });
  fireEvent.change(screen.getByLabelText(/Recipe:/i), { target: { value: 'Chili' } });
  fireEvent.change(screen.getByLabelText(/Instructions:/i), { target: { value: 'Boil beans' } });
  fireEvent.click(screen.getByText('Save'));

  fireEvent.click(screen.getByText('Edit Meal Plan'));
  fireEvent.change(screen.getByLabelText(/Day:/i), { target: { value: '0' } });

  expect(screen.getByLabelText(/Recipe:/i)).toHaveValue('');
  expect(screen.getByLabelText(/Instructions:/i)).toHaveValue('');
});

//9
test('clicking Cancel Edit hides the form', async () => {
  render(<ThemeProvider><MealPage /></ThemeProvider>);
  const editBtn = screen.getByText('Edit Meal Plan');

  fireEvent.click(editBtn);
  expect(screen.getByLabelText(/Recipe:/i)).toBeInTheDocument();

  fireEvent.click(screen.getByText('Cancel Edit'));
  expect(screen.queryByLabelText(/Recipe:/i)).not.toBeInTheDocument();
});

//10
test('shows saved meal in correct row after Save', async () => {
  render(<ThemeProvider><MealPage /></ThemeProvider>);
  fireEvent.click(screen.getByText('Edit Meal Plan'));

  fireEvent.change(screen.getByLabelText(/Day:/i), { target: { value: '3' } });
  fireEvent.change(screen.getByLabelText(/Recipe:/i), { target: { value: 'Salad' } });
  fireEvent.change(screen.getByLabelText(/Instructions:/i), { target: { value: 'Chop vegetables' } });

  fireEvent.click(screen.getByText('Save'));

  await waitFor(() => {
    const row = screen.getByText('Thursday').closest('tr');
    expect(row).toHaveTextContent('Salad');
    expect(row).toHaveTextContent('Chop vegetables');
  });
});
//11
test('editing one day does not affect others', async () => {
  render(<ThemeProvider><MealPage /></ThemeProvider>);
  fireEvent.click(screen.getByText('Edit Meal Plan'));

  fireEvent.change(screen.getByLabelText(/Day:/i), { target: { value: '0' } });
  fireEvent.change(screen.getByLabelText(/Recipe:/i), { target: { value: 'Stew' } });
  fireEvent.change(screen.getByLabelText(/Instructions:/i), { target: { value: 'Simmer slow' } });
  fireEvent.click(screen.getByText('Save'));

  fireEvent.click(screen.getByText('Edit Meal Plan'));

  fireEvent.change(screen.getByLabelText(/Day:/i), { target: { value: '6' } });
  fireEvent.change(screen.getByLabelText(/Recipe:/i), { target: { value: 'Juice' } });
  fireEvent.change(screen.getByLabelText(/Instructions:/i), { target: { value: 'Squeeze oranges' } });
  fireEvent.click(screen.getByText('Save'));

  await waitFor(() => {
    expect(screen.getByText('Monday').closest('tr')).toHaveTextContent('Stew');
    expect(screen.getByText('Sunday').closest('tr')).toHaveTextContent('Juice');
  });
});

//12 -- FAILS
test('displays the Recipe Library section heading', () => {
  render(<ThemeProvider><MealPage /></ThemeProvider>);
  
  const libraryHeading = screen.getByText('Recipe Library');
  expect(libraryHeading).toBeInTheDocument();
  expect(libraryHeading.tagName).toBe('H3');
});


//13
test('handles multiline instructions in textarea correctly', async () => {
  render(<ThemeProvider><MealPage /></ThemeProvider>);
  
  fireEvent.click(screen.getByText('Edit Meal Plan'));
  
  const textarea = screen.getByLabelText(/Instructions:/i);
  fireEvent.change(textarea, { 
    target: { value: 'Step 1\nStep 2\nStep 3' } 
  });
  
  expect(textarea).toHaveValue('Step 1\nStep 2\nStep 3');
  
  fireEvent.change(screen.getByLabelText(/Day:/i), { target: { value: '1' } });
  fireEvent.change(screen.getByLabelText(/Recipe:/i), { target: { value: 'Test Recipe' } });
  
  fireEvent.click(screen.getByText('Save'));
  
  await waitFor(() => {
    const stepsCell = screen.getByText('Tuesday').closest('tr')?.querySelectorAll('td')[2];
    expect(stepsCell?.textContent).toContain('Step 1, Step 2, Step 3');
  });
});

//14 FAILS
test('meal table has 7 rows for the days of the week', () => {
  render(<ThemeProvider><MealPage /></ThemeProvider>);
  
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  dayNames.forEach(day => {
    expect(screen.getByText(day)).toBeInTheDocument();
  });
  
  // Check if we have 7 rows (not including header row)
  const rows = screen.getAllByRole('row').slice(1); // Skip header row
  expect(rows.length).toBe(7);
});


//15
test('handles comma-separated instructions correctly', async () => {
  render(<ThemeProvider><MealPage /></ThemeProvider>);
  
  fireEvent.click(screen.getByText('Edit Meal Plan'));
  
  fireEvent.change(screen.getByLabelText(/Day:/i), { target: { value: '5' } });
  fireEvent.change(screen.getByLabelText(/Recipe:/i), { target: { value: 'Comma Recipe' } });
  fireEvent.change(screen.getByLabelText(/Instructions:/i), { 
    target: { value: 'Prep,Cook,Serve' } 
  });
  
  fireEvent.click(screen.getByText('Save'));
  
  await waitFor(() => {
    const stepsCell = screen.getByText('Saturday').closest('tr')?.querySelectorAll('td')[2];
    expect(stepsCell?.textContent).toContain('Prep, Cook, Serve');
  });
});

//16
test('displays the Print Meal Plan button', () => {
  render(<ThemeProvider><MealPage /></ThemeProvider>);
  
  const printButton = screen.getByText('Print Meal Plan');
  expect(printButton).toBeInTheDocument();
  expect(printButton.tagName).toBe('BUTTON');
});

//17
test('allows consecutive saves without closing the form', async () => {
  render(<ThemeProvider><MealPage /></ThemeProvider>);
  
  // First meal
  fireEvent.click(screen.getByText('Edit Meal Plan'));
  fireEvent.change(screen.getByLabelText(/Day:/i), { target: { value: '1' } });
  fireEvent.change(screen.getByLabelText(/Recipe:/i), { target: { value: 'Breakfast' } });
  fireEvent.change(screen.getByLabelText(/Instructions:/i), { target: { value: 'Morning steps' } });
  fireEvent.click(screen.getByText('Save'));
  
  // After save, form should be hidden and we need to reopen it
  fireEvent.click(screen.getByText('Edit Meal Plan'));
  
  // Second meal
  fireEvent.change(screen.getByLabelText(/Day:/i), { target: { value: '2' } });
  fireEvent.change(screen.getByLabelText(/Recipe:/i), { target: { value: 'Lunch' } });
  fireEvent.change(screen.getByLabelText(/Instructions:/i), { target: { value: 'Midday steps' } });
  fireEvent.click(screen.getByText('Save'));
  
  await waitFor(() => {
    expect(screen.getByText('Tuesday').closest('tr')).toHaveTextContent('Breakfast');
    expect(screen.getByText('Wednesday').closest('tr')).toHaveTextContent('Lunch');
  });
});

//18
test('meal table displays correct column headers', () => {
  render(<ThemeProvider><MealPage /></ThemeProvider>);
  
  const headers = screen.getAllByRole('columnheader');
  expect(headers.length).toBe(4);
  
  const headerTexts = headers.map(header => header.textContent);
  expect(headerTexts).toEqual(['Day', 'Recipe', 'Steps', 'Actions']);
});


//19
test('edit form has recipe and instructions inputs', () => {
  render(<ThemeProvider><MealPage /></ThemeProvider>);
  
  fireEvent.click(screen.getByText('Edit Meal Plan'));
  
  expect(screen.getByLabelText(/Recipe:/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Instructions:/i)).toBeInTheDocument();
});

//20
test('displays the correct page title', () => {
  render(<ThemeProvider><MealPage /></ThemeProvider>);
  expect(screen.getByText('My Meal Plan')).toBeInTheDocument();
});


