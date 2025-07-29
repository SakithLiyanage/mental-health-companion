import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App.jsx';

test('renders Mental Health Companion', () => {
  render(<App />);
  // Since the app now shows auth when no user is logged in, 
  // we'll look for elements that should be present
  const appElement = screen.getByRole('main') || screen.getByText(/Mental Health/i) || document.querySelector('.App');
  expect(appElement).toBeInTheDocument();
});
