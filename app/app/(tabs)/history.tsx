import React, { useEffect, useState, useCallback } from "react";
import { FlatList, RefreshControl, Text, View, StyleSheet, ListRenderItem, Button } from "react-native";
import { useAppContext } from "@/context/AppContext";
import { SubmissionCard } from "@/components/SubmissionCard";
import { fetchSubmissions } from "@/lib/api";
import { Submission } from "@/lib/types";

export default function HistoryScreen() {
  const { submissions, setSubmissions } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null)

  const loadSubmissions = useCallback(async () => {
    setRefreshing(true);
    setError(null); // Clear previous errors on a new load attempt
    try {
      const response = await fetchSubmissions();
      setSubmissions(response.submissions);
    } catch (err) {
      // ✅ 2. Set the error message if the API call fails
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      console.error("Failed to load submissions:", err);
    } finally {
      setRefreshing(false);
    }
  }, [setSubmissions]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const renderItem: ListRenderItem<Submission> = useCallback(({ item }) => (
    <SubmissionCard submission={item} />
  ), []);

  const keyExtractor = useCallback((item: Submission) => item.id, []);

  const renderEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No submissions yet.</Text>
      <Text style={styles.emptySubtext}>Pull down to refresh.</Text>
    </View>
  ), []);

  if (error && !refreshing) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.errorText}>Failed to Load Submissions</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <Button title="Retry" onPress={loadSubmissions} />
      </View>
    );
  }

  return (
    <FlatList
      data={submissions}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={submissions.length === 0 ? styles.emptyContentContainer : styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={loadSubmissions} />
      }
      ListEmptyComponent={renderEmptyComponent}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={10}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  emptyContentContainer: {
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
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#c0392b', // A red color for errors
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  }
});