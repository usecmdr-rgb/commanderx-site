import React from "react";
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { colors, theme } from "@/theme";
import { mockCallRecords } from "@/data/mockData";

export default function AlohaCallTranscriptsScreen() {
  const calls = mockCallRecords;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Call Transcripts" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {calls.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No call transcripts available</Text>
          </Card>
        ) : (
          calls.map((call) => (
            <Card key={call.id} style={styles.transcriptCard}>
              <Text style={styles.callName}>{call.contactName}</Text>
              <Text style={styles.callTime}>{formatTime(call.timestamp)}</Text>
              <Text style={styles.callSummary}>{call.summary}</Text>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.background0,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  transcriptCard: {
    marginBottom: theme.spacing.md,
  },
  callName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: "600",
    color: colors.text.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  callTime: {
    fontSize: theme.typography.fontSize.xs,
    color: colors.text.textMuted,
    marginBottom: theme.spacing.sm,
  },
  callSummary: {
    fontSize: theme.typography.fontSize.base,
    color: colors.text.textSecondary,
    lineHeight: 22,
  },
  emptyCard: {
    padding: theme.spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: colors.text.textMuted,
  },
});

