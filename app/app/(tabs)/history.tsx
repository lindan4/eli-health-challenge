import React, { useEffect, useState } from "react";
import { ScrollView, RefreshControl } from "react-native";
import { useAppContext } from "@/context/AppContext";
import { SubmissionCard } from "@/components/SubmissionCard";
import { fetchSubmissions } from "@/lib/api";

export default function HistoryScreen() {
  const { submissions, addSubmission } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);

  const loadSubmissions = async () => {
    setRefreshing(true);
    try {
      const data = await fetchSubmissions();
      data.forEach(addSubmission);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  return (
    <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadSubmissions} />}>
      {submissions.map((s) => <SubmissionCard key={s.id} submission={s} />)}
    </ScrollView>
  );
}