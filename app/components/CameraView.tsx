import React, { useEffect, useRef } from "react";
import { View, Button, StyleSheet } from "react-native";
import { Camera, useCameraDevices } from "react-native-vision-camera";

interface CameraViewProps {
  onCapture: (uri: string) => void;
}

export const CameraView = ({ onCapture }: CameraViewProps) => {
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === "back");
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    Camera.requestCameraPermission();
  }, []);

  const takePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePhoto();
      onCapture(photo.path);
    }
  };

  if (!device) return <View style={styles.loading} />;

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        photo
      />
      <Button title="Capture" onPress={takePhoto} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
});