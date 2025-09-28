// app/results.tsx
import React from 'react';
import { View, Text, StyleSheet, Button, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { QRStatusIndicator } from '@/components/QRStatusIndicator';
import { BASE_URL } from '@/constants';


export default function ResultsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  // Use thumbnailUrl if available, fallback to localImageUri
  const imageUrl = params.thumbnailUrl 
    ? `${BASE_URL}/uploads/${params.thumbnailUrl}`
    : params.localImageUri as string;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Submission Result</Text>
      <Image source={{ uri: imageUrl }} style={styles.thumbnail} />
      
      <View style={styles.row}>
        <Text style={styles.label}>Status:</Text>
        <QRStatusIndicator status={params.status as any} />
        <Text style={[styles.statusText, { textTransform: 'capitalize' }]}>
          {params.status}
        </Text>
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>QR Code:</Text>
        <Text style={styles.value}>
          {params.qrCode || 'Not Found'}
        </Text>
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>Quality:</Text>
        <Text style={[styles.value, { textTransform: 'capitalize' }]}>
          {params.quality}
        </Text>
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