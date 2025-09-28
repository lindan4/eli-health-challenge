import React from "react";
import { View, StyleSheet } from "react-native";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "expo-router"; // Import the router
import { CameraView } from "@/components/CameraView";

export default function CameraScreen() {
  const { setSelectedImage } = useAppContext();
  const router = useRouter();

  const handleCapture = (uri: string) => {
    // 1. Set the captured image URI in the global state
    setSelectedImage(uri);
    
    // 2. Navigate to the preview screen
    router.push("/preview");
  };

  return (
    <View style={styles.container}>
      <CameraView onCapture={handleCapture} />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });