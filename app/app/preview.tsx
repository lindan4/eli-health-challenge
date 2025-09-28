import { View, Image, Button, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "expo-router";
import { uploadImage } from "@/lib/api";
import { useState } from "react";

export default function PreviewScreen() {
  // ✅ The only context function we need here now is addSubmission
  const { selectedImage, setSelectedImage, addSubmission } = useAppContext();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!selectedImage) return null;

  const handleSubmit = async () => {
    if (!selectedImage) return;

    setIsSubmitting(true);

    try {
      // 1. Upload the image and wait for the response
      const serverResponse = await uploadImage(selectedImage);

      // 2. Add the complete submission to the history list (in the background)
      addSubmission({
        id: serverResponse.id,
        status: serverResponse.status,
        qrCode: serverResponse.qrCode,
        quality: serverResponse.quality,
        // The thumbnail path from the server will be relative
        thumbnailUrl: `thumb-${serverResponse.id}.png`, // Example, adjust if needed
        createdAt: serverResponse.processedAt,
      });

      // 3. Navigate to the results screen with the server data
      router.replace({
        pathname: "/results",
        params: { 
          ...serverResponse, 
          qrCodeValid: String(serverResponse.qrCodeValid) // Convert boolean to string
        },
      });

    } catch (err) {
      console.error("Upload failed:", err);
      Alert.alert("Upload Failed", "Could not upload the image. Please try again.");
    } finally {
      setIsSubmitting(false);
      // We no longer clear the selected image here, as the router.replace handles leaving the screen
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    router.back();
  };

  // ... (the JSX with the ActivityIndicator remains the same)
  return (
    <View style={styles.container}>
      <Image source={{ uri: selectedImage }} style={styles.image} resizeMode="contain" />
      
      {isSubmitting ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <View style={styles.buttonContainer}>
          <Button title="Retake" onPress={handleClose} color="gray" />
          <Button title="Submit" onPress={handleSubmit} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: 'black' 
  },
  image: { 
    flex: 1, 
    width: "100%" 
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    padding: 20,
    position: 'absolute',
    bottom: 40,
  }
});