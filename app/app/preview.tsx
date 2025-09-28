import React, { useState } from "react";
import { View, Image, Button, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "expo-router";
import { uploadImage } from "@/lib/api";
import uuid from "react-native-uuid";

export default function PreviewScreen() {
  const { selectedImage, setSelectedImage, addSubmission, updateSubmission } = useAppContext();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!selectedImage) return null;

  const handleSubmit = async () => {
    if (!selectedImage) return;

    setIsSubmitting(true);
    const tempId = String(uuid.v4());

    // Optimistic UI: Add a pending submission immediately
    addSubmission({
      id: tempId,
      localImageUri: selectedImage,
      status: "pending",
      qrCode: null,
      quality: null,
      thumbnailUrl: null,
      createdAt: new Date().toISOString(),
    });

    // Dismiss the preview screen and go back
    router.back(); 
    setSelectedImage(null);

    try {
      // Upload the image
      const serverResponse = await uploadImage(selectedImage);

      // Update the submission with the real data from the server
      updateSubmission(tempId, {
        id: serverResponse.id,
        status: serverResponse.status,
        qrCode: serverResponse.qrCode,
        quality: serverResponse.quality,
        // We'll construct a temporary thumbnail URL until the real one is available
        thumbnailUrl: `http://192.168.2.29:3000/${tempId.replace('uploads/', '')}`,
        createdAt: serverResponse.processedAt,
      });

    } catch (err) {
      console.error("Upload failed:", err);
      updateSubmission(tempId, { status: "error" });
      Alert.alert("Upload Failed", "Could not upload the image. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    router.back();
  };

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