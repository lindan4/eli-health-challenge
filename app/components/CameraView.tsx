import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Camera, CameraDevice, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

interface CameraViewProps {
  onCapture: (uri: string) => void;
}

export function CameraView({ onCapture }: CameraViewProps) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const camera = useRef<Camera>(null);
  const [focusPoint, setFocusPoint] = useState<{ x: number, y: number } | undefined>();

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // Clear focus point after 2 seconds
  useEffect(() => {
    if (focusPoint) {
      const timer = setTimeout(() => {
        setFocusPoint(undefined);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [focusPoint]);

  const handleTakePhoto = useCallback(async () => {
    if (!camera.current) return;
    
    try {
      const photo = await camera.current.takePhoto({
        flash: 'auto',
      });
      onCapture(photo.path);
    } catch (error) {
      console.error('Failed to take photo:', error);
    }
  }, [onCapture]);

  // Create tap gesture with better error handling and logging
  const tapGesture = Gesture.Tap()
    .onEnd(async ({ x, y }) => {
      console.log('Tap detected at:', x, y);
      console.log('Device supports focus:', device?.supportsFocus);
      
      // Always set focus point for visual feedback
      setFocusPoint({ x, y });
      
      // Check if device supports focus and camera is ready
      if (device?.supportsFocus && camera.current) {
        try {
          console.log('Attempting to focus...');
          await camera.current.focus({ x, y });
          console.log('Focus successful');
        } catch (error) {
          console.error('Failed to focus:', error);
        }
      } else {
        console.log('Focus not supported or camera not ready');
      }
    })
    .runOnJS(true); // Ensure gesture runs on JS thread

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera permission required</Text>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="white" />
        <Text style={styles.permissionText}>Loading camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera component */}
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
        enableZoomGesture={false} // Disable zoom to avoid conflicts
      />
      
      {/* Gesture detector overlay - make sure it's above camera but below UI */}
      <GestureDetector gesture={tapGesture}>
        <View 
          style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]}
          pointerEvents="auto"
        />
      </GestureDetector>
      
      {/* Focus indicator */}
      {focusPoint && (
        <View 
          style={[
            styles.focusIndicator, 
            { 
              top: focusPoint.y - 30, 
              left: focusPoint.x - 30,
              opacity: 1
            }
          ]} 
        />
      )}
      
      {/* Capture button - make sure it's on top and doesn't interfere with gestures */}
      <View style={styles.buttonContainer} pointerEvents="box-none">
        <TouchableOpacity 
          style={styles.captureButton} 
          onPress={handleTakePhoto}
          activeOpacity={0.8}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionText: {
    color: 'white',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  focusIndicator: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: 'yellow',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    borderWidth: 5,
    borderColor: 'gray',
  },
});