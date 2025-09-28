import React from "react";
import { View, StyleSheet } from "react-native";
import { useAppContext } from "@/context/AppContext";
import { uploadImage } from "@/lib/api";
import uuid from "react-native-uuid";
import { CameraView } from "@/components/CameraView";

export default function CameraScreen() {
  const { addSubmission, updateSubmission } = useAppContext();

  const handleCapture = async (uri: string) => {
    const id = String(uuid.v4());
    addSubmission({ id, imageUri: uri, status: "pending" });

    try {
      const submission = await uploadImage(uri);
      updateSubmission(id, { qrCode: submission.qr_code, thumbnailUrl: submission.thumbnail_path, status: submission.status });
    } catch (err) {
      console.error(err);
      updateSubmission(id, { status: "error" });
    }
  };

  return (
    <View style={styles.container}>
      <CameraView onCapture={handleCapture} />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });