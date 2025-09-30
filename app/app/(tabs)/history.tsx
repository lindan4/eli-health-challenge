import React, { useEffect, useState, useCallback } from "react";
import { FlatList, RefreshControl, Text, View, StyleSheet, ListRenderItem, Button, ActivityIndicator } from "react-native";
import { useAppContext } from "@/context/AppContext";
import { SubmissionCard } from "@/components/SubmissionCard";
import { fetchSubmissions } from "@/lib/api";
import { Submission } from "@/lib/types";

export default function HistoryScreen() {
  const { submissions, setSubmissions } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadSubmissions = useCallback(async (pageNum: number, append: boolean = false) => {
    if (pageNum === 1) {
      setRefreshing(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    
    try {
      const response = await fetchSubmissions(pageNum, 10);
      
      if (append) {
        setSubmissions((prev: Submission[]) => [...prev, ...response.submissions]);
      } else {
        setSubmissions(response.submissions);
      }
      
      // Check if there are more pages
      setHasMore(pageNum < response.totalPages);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      console.error("Failed to load submissions:", err);
    } finally {
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [setSubmissions]);

  useEffect(() => {
    loadSubmissions(1, false);
  }, []);

  const handleRefresh = useCallback(() => {
    setPage(1);
    setHasMore(true);
    loadSubmissions(1, false);
  }, [loadSubmissions]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && !refreshing) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadSubmissions(nextPage, true);
    }
  }, [loadingMore, hasMore, refreshing, page, loadSubmissions]);

  const renderItem: ListRenderItem<Submission> = useCallback(({ item }) => (
    <SubmissionCard submission={item} />
  ), []);

  const keyExtractor = useCallback((item: Submission) => item.id, []);

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#000000" />
      </View>
    );
  }, [loadingMore]);

  const renderEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No submissions yet.</Text>
      <Text style={styles.emptySubtext}>Pull down to refresh.</Text>
    </View>
  ), []);

  if (error && !refreshing && submissions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.errorText}>Failed to Load Submissions</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <Button title="Retry" onPress={handleRefresh} />
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
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      ListEmptyComponent={renderEmptyComponent}
      ListFooterComponent={renderFooter}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
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
    color: '#c0392b',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  }
});