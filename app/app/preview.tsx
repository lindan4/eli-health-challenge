import { View, Image, Button, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "expo-router";
import { uploadImage } from "@/lib/api";
import { useState } from "react";
import { Submission } from "@/lib/types";

export default function PreviewScreen() {
  const { selectedImage, setSelectedImage, addSubmission } = useAppContext();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!selectedImage) return null;

  const handleSubmit = async () => {
    if (!selectedImage) return;

    setIsSubmitting(true);
    try {
      const serverResponse = await uploadImage(selectedImage);

      console.log("Server response:", serverResponse);

      // 2. Create submission object that matches your Submission interface
      const submission: Submission = {
        id: serverResponse.id,
        status: serverResponse.status,
        qrCode: serverResponse.qrCode,
        quality: serverResponse.quality,
        thumbnailUrl: serverResponse.thumbnailUrl || null,
        createdAt: serverResponse.processedAt,
        localImageUri: selectedImage,
      };

      // 3. Add to history
      addSubmission(submission);

      // 4. Navigate to results with the submission data
      router.replace({
        pathname: "/results",
        params: {
          id: submission.id,
          status: submission.status,
          qrCode: submission.qrCode || '', // Empty string instead of 'null'
          quality: submission.quality || '',
          qrCodeValid: String(serverResponse.qrCodeValid),
          processedAt: submission.createdAt,
          thumbnailUrl: serverResponse.thumbnailUrl || '', // Add this
          localImageUri: selectedImage,
        }
      });
    } catch (err) {
      console.error("Upload failed:", err);
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