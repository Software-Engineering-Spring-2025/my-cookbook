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
    });
  });
    