import React from "react";
import { View, StyleSheet } from "react-native";
import { Submission } from "@/lib/types";

// Define the colors in a map for clarity and easy maintenance
const STATUS_COLORS = {
  pending: '#aaa',    // Gray for in-progress
  processed: '#2ecc71', // Green for success
  expired: '#f39c12',  // Orange for warning
  error: '#e74c3c',    // Red for failure
};

// Use the status type directly from our Submission interface for consistency
export const QRStatusIndicator = ({ status }: { status: Submission['status'] }) => {
  // Determine the background color from the map, with a fallback to gray
  const backgroundColor = STATUS_COLORS[status] || '#aaa';

  return (
    <View 
      style={[styles.circle, { backgroundColor }]} 
      accessibilityLabel={`Status: ${status}`}
    />
  );
};

const styles = StyleSheet.create({
  circle: { 
    width: 16, 
    height: 16, 
    borderRadius: 8,
    marginLeft: 'auto', // Push the indicator to the right
  },
});