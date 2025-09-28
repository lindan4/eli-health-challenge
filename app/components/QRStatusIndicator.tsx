import React from "react";
import { View, StyleSheet } from "react-native";

export const QRStatusIndicator = ({ status }: { status?: "pending" | "success" | "error" }) => {
  let bgColor = "#ccc";
  if (status === "success") bgColor = "green";
  if (status === "error") bgColor = "red";

  return <View style={[styles.circle, { backgroundColor: bgColor }]} />;
};

const styles = StyleSheet.create({
  circle: { width: 16, height: 16, borderRadius: 8 },
});