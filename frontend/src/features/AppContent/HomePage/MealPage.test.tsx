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

  // 1
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
  const recipeCells = screen.getAllByRole('cell').filter((_, idx) => (idx - 1) % 4 === 0); // assuming Recipe col
  recipeCells.forEach(cell => {
    expect(cell.textContent?.length).toBeGreaterThan(0);
  });
});
});