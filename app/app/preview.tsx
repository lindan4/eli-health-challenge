import React from "react";
import { View, Image, Button, StyleSheet } from "react-native";
import { useAppContext } from "@/context/AppContext";

export default function PreviewScreen() {
  const { selectedImage, setSelectedImage } = useAppContext();

  if (!selectedImage) return null;

  return (
    <View style={styles.container}>
      <Image source={{ uri: selectedImage }} style={styles.image} resizeMode="contain" />
      <Button title="Close" onPress={() => setSelectedImage(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  image: { width: "90%", height: "70%" },
});