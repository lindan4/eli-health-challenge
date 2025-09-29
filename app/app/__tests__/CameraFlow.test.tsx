import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CameraScreen from '../(tabs)/index';
import PreviewScreen from '../preview';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { uploadImage } from '@/lib/api';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

jest.mock('../../context/AppContext', () => ({
  useAppContext: jest.fn(),
}));

jest.mock('../../components/CameraView', () => ({
  CameraView: ({ onCapture }: any) => {
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable 
        testID="mock-camera-capture"
        onPress={() => onCapture('file://mock-image.jpg')}
      >
        <Text>Capture Photo</Text>
      </Pressable>
    );
  },
}));

jest.mock('../../lib/api', () => ({
  uploadImage: jest.fn(),
}));

import { useAppContext } from '../../context/AppContext';

describe('Camera to Preview Flow', () => {
  const mockSetSelectedImage = jest.fn();
  const mockAddSubmission = jest.fn();
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  const mockBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useAppContext as jest.Mock).mockReturnValue({
      setSelectedImage: mockSetSelectedImage,
      selectedImage: 'file://mock-image.jpg',
      addSubmission: mockAddSubmission,
    });
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      back: mockBack,
    });
  });

  it('should capture image and navigate to preview screen', async () => {
    const { getByTestId } = render(<CameraScreen />);
    
    const captureButton = getByTestId('mock-camera-capture');
    fireEvent.press(captureButton);
    
    await waitFor(() => {
      expect(mockSetSelectedImage).toHaveBeenCalledWith('file://mock-image.jpg');
      expect(mockPush).toHaveBeenCalledWith('/preview');
    });
  });

  it('should allow user to cancel from preview and go back', async () => {
    const { getByText } = render(<PreviewScreen />);
    
    const retakeButton = getByText('Retake');
    fireEvent.press(retakeButton);
    
    await waitFor(() => {
      expect(mockSetSelectedImage).toHaveBeenCalledWith(null);
      expect(mockBack).toHaveBeenCalled();
    });
  });

  it('should submit image and navigate to results on success', async () => {
    const mockResponse = {
      id: 'test-id-123',
      status: 'processed',
      qrCode: 'ELI-2025-001',
      quality: 'good',
      qrCodeValid: true,
      thumbnailUrl: 'thumb-123.png',
      processedAt: '2025-01-30T12:00:00Z',
    };

    (uploadImage as jest.Mock).mockResolvedValue(mockResponse);

    const { getByText } = render(<PreviewScreen />);
    
    const submitButton = getByText('Submit');
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      // Verify upload was called with correct image
      expect(uploadImage).toHaveBeenCalledWith('file://mock-image.jpg');
      
      // Verify submission was added to context
      expect(mockAddSubmission).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-id-123',
          status: 'processed',
          qrCode: 'ELI-2025-001',
          quality: 'good',
        })
      );
      
      // Verify navigation to results with correct params
      expect(mockReplace).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/results',
          params: expect.objectContaining({
            id: 'test-id-123',
            status: 'processed',
            qrCode: 'ELI-2025-001',
          }),
        })
      );
    });
  });

  it('should show error alert when upload fails', async () => {
    const mockAlert = jest.spyOn(require('react-native').Alert, 'alert');
    
    // Arrange: Mock the API to reject with a specific error message
    const networkErrorMessage = 'Network error. Please check your connection and try again.';
    (uploadImage as jest.Mock).mockRejectedValue(new Error(networkErrorMessage));

    const { getByText } = render(<PreviewScreen />);
    
    const submitButton = getByText('Submit');
    fireEvent.press(submitButton);
    
    // Assert
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Upload Failed',
        networkErrorMessage 
      );
    });
  });
});