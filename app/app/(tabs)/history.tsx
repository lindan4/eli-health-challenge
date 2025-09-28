// app/(tabs)/history.tsx
import React, { useEffect, useState, useCallback } from "react";
import { ScrollView, RefreshControl, Text, View, StyleSheet } from "react-native";
import { useAppContext } from "@/context/AppContext";
import { SubmissionCard } from "@/components/SubmissionCard";
import { fetchSubmissions } from "@/lib/api";

export default function HistoryScreen() {
  const { submissions, setSubmissions } = useAppContext(); // Use setSubmissions
  const [refreshing, setRefreshing] = useState(false);

  const loadSubmissions = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetchSubmissions();
      // ✅ FIX: Replace the entire list with the fetched data
      setSubmissions(response.submissions);
    } catch (err) {
      console.error("Failed to load submissions:", err);
      // TODO: Show an error message to the user
    } finally {
      setRefreshing(false);
    }
  }, [setSubmissions]); // Add dependency

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]); // Add dependency

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={loadSubmissions} />
      }
    >
      {submissions.length === 0 && !refreshing && (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No submissions yet.</Text>
            <Text style={styles.emptySubtext}>Pull down to refresh.</Text>
        </View>
      )}
      {submissions.map((s) => (
        <SubmissionCard key={s.id} submission={s} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#555',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#888',
        marginTop: 8,
    }
});