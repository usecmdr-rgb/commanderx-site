import React from "react";
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { colors, theme } from "@/theme";
import { mockInsights } from "@/data/mockData";

export default function InsightsCommandBriefScreen() {
  const insights = mockInsights;

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Command Brief" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {insights.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No insights available</Text>
          </Card>
        ) : (
          insights.map((insight) => (
            <Card key={insight.id} style={styles.insightCard}>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <Text style={styles.insightExplanation}>{insight.explanation}</Text>
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
  insightCard: {
    marginBottom: theme.spacing.md,
  },
  insightTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: "600",
    color: colors.text.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  insightExplanation: {
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

