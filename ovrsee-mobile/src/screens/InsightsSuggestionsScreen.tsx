import React from "react";
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { colors, theme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";

export default function InsightsSuggestionsScreen() {
  const suggestions = [
    { id: "1", text: "Optimize email send times based on recipient timezone", priority: "high" },
    { id: "2", text: "Increase call follow-up rate by 20%", priority: "medium" },
    { id: "3", text: "Schedule social posts during peak engagement hours", priority: "low" },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return colors.status.error;
      case "medium":
        return colors.status.warning;
      default:
        return colors.text.textMuted;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Suggestions" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {suggestions.map((suggestion) => (
          <Card key={suggestion.id} style={styles.suggestionCard}>
            <View style={styles.suggestionHeader}>
              <Ionicons name="bulb" size={20} color={getPriorityColor(suggestion.priority)} />
              <Text style={[styles.priorityBadge, { color: getPriorityColor(suggestion.priority) }]}>
                {suggestion.priority.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.suggestionText}>{suggestion.text}</Text>
          </Card>
        ))}
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
  suggestionCard: {
    marginBottom: theme.spacing.md,
  },
  suggestionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
  },
  priorityBadge: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  suggestionText: {
    fontSize: theme.typography.fontSize.base,
    color: colors.text.textPrimary,
    lineHeight: 22,
  },
});

