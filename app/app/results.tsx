// app/results.tsx

import React from 'react';
import { View, Text, StyleSheet, Button, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { QRStatusIndicator } from '@/components/QRStatusIndicator';
import { Submission } from '@/lib/types';

const API_BASE_URL = "http://192.168.2.29:3000";

export default function ResultsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  // Reconstruct the submission object from navigation parameters
  const submission = params as any as Submission;
  const imageUrl = `${API_BASE_URL}/${params.thumbnailUrl}`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Submission Result</Text>
      
      <Image source={{ uri: imageUrl }} style={styles.thumbnail} />

      <View style={styles.row}>
        <Text style={styles.label}>Status:</Text>
        <QRStatusIndicator status={submission.status} />
        <Text style={[styles.statusText, { textTransform: 'capitalize' }]}>{submission.status}</Text>
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>QR Code:</Text>
        <Text style={styles.value}>{submission.qrCode || 'Not Found'}</Text>
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>Quality:</Text>
        <Text style={[styles.value, { textTransform: 'capitalize' }]}>{submission.quality}</Text>
      </View>

      <Button title="Done" onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  thumbnail: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 30,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    marginBottom: 15,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
  },
  value: {
    fontSize: 18,
    marginLeft: 10,
  },
  statusText: {
    fontSize: 18,
    marginLeft: 8,
  }
});