import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import HistoryScreen from '../(tabs)/history';

// --- Mocking Dependencies ---

// 1. Mock the API module
jest.mock('../../lib/api', () => ({
  fetchSubmissions: jest.fn(),
}));
import { fetchSubmissions } from '../../lib/api';
const mockedFetchSubmissions = fetchSubmissions as jest.Mock;


// 2. Mock the AppContext
jest.mock('../../context/AppContext', () => ({
  useAppContext: jest.fn(),
}));
import { useAppContext } from '../../context/AppContext';
const mockedUseAppContext = useAppContext as jest.Mock;


// --- The Tests ---

describe('HistoryScreen', () => {
  // Create a mock function to act as `setSubmissions`
  const mockSetSubmissions = jest.fn();

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Provide a default mock implementation for the context
    mockedUseAppContext.mockReturnValue({
      submissions: [],
      setSubmissions: mockSetSubmissions,
    });
  });

  it('renders submissions when the API call is successful', async () => {
    // A. Arrange: Setup the mock data and API response
    const mockData = {
      submissions: [
        { id: '1', qrCode: 'ELI-2025-001', status: 'processed' },
        { id: '2', qrCode: 'ELI-2025-002', status: 'expired' },
      ],
    };
    mockedFetchSubmissions.mockResolvedValue(mockData);
    
    // We also need to mock what the context will return AFTER data is loaded
    mockedUseAppContext.mockReturnValue({
      submissions: mockData.submissions, // The component will render this data
      setSubmissions: mockSetSubmissions,
    });

    // B. Act: Render the component
    render(<HistoryScreen />);

    // C. Assert: Check that the data is on the screen
    // We use `findByText` because it waits for the component to update after the async API call
    expect(await screen.findByText('QR: ELI-2025-001')).toBeTruthy();
    expect(await screen.findByText('QR: ELI-2025-002')).toBeTruthy();

    // Bonus: Check that our mocked functions were called correctly
    expect(mockedFetchSubmissions).toHaveBeenCalledTimes(1);
    expect(mockSetSubmissions).toHaveBeenCalledWith(mockData.submissions);
  });

  it('renders the empty state message when no submissions are fetched', async () => {
    // A. Arrange: Mock an empty response from the API
    mockedFetchSubmissions.mockResolvedValue({ submissions: [] });
    
    // The context will return an empty array for `submissions`
    mockedUseAppContext.mockReturnValue({
      submissions: [],
      setSubmissions: mockSetSubmissions,
    });

    // B. Act: Render the component
    render(<HistoryScreen />);

    // C. Assert: Check that the empty state message is visible
    expect(await screen.findByText('No submissions yet.')).toBeTruthy();
    expect(screen.getByText('Pull down to refresh.')).toBeTruthy();
  });
});