import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Submission } from "@/lib/types";
import { QRStatusIndicator } from "./QRStatusIndicator";

export const SubmissionCard = ({ submission }: { submission: Submission }) => (
  <View style={styles.card}>
    {submission.thumbnailUrl && <Image source={{ uri: submission.thumbnailUrl }} style={styles.image} />}
    <View style={styles.info}>
      <Text>QR: {submission.qrCode || "N/A"}</Text>
      <QRStatusIndicator status={submission.status} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: { flexDirection: "row", padding: 10, borderBottomWidth: 1, borderColor: "#ddd" },
  image: { width: 60, height: 60, marginRight: 10 },
  info: { justifyContent: "center" },
});