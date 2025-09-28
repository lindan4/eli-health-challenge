import React, { useEffect, useState, useCallback } from "react";
import { FlatList, RefreshControl, Text, View, StyleSheet, ListRenderItem } from "react-native";
import { useAppContext } from "@/context/AppContext";
import { SubmissionCard } from "@/components/SubmissionCard";
import { fetchSubmissions } from "@/lib/api";
import { Submission } from "@/lib/types";

export default function HistoryScreen() {
  const { submissions, setSubmissions } = useAppContext();
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
  }
});