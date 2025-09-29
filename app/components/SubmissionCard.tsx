import React from "react";
import { View, Text, Image, StyleSheet, ActivityIndicator } from "react-native";
import { Submission } from "@/lib/types";
import { QRStatusIndicator } from "./QRStatusIndicator";
import { BASE_URL } from "@/constants";

export const SubmissionCard = ({ submission }: { submission: Submission }) => {
  const imageUri = submission.thumbnailUrl 
  ? `${BASE_URL}/uploads/${submission.thumbnailUrl}`
  : null;

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        {submission.status === 'pending' ? (
          <ActivityIndicator />
        ) : imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholderImage]} />
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.qrText}>QR: {submission.qrCode || "N/A"}</Text>
        
        <Text style={styles.detailText}>Quality: {submission.quality || "..."}</Text>
        
        <Text style={styles.dateText}>
          {new Date(submission.createdAt).toLocaleString()}
        </Text>
      </View>
      
      <QRStatusIndicator status={submission.status} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    alignItems: 'center',
    backgroundColor: 'white',
  },
  imageContainer: {
    width: 60,
    height: 60,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
  },
  infoContainer: {
    flex: 1, // Take up available space
    justifyContent: "center",
  },
  qrText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
});