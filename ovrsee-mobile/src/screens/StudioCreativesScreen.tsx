import React from "react";
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { colors, theme } from "@/theme";
import { mockStudioItems } from "@/data/mockData";

export default function StudioCreativesScreen() {
  const items = mockStudioItems;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Creatives" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {items.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No creatives available</Text>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id} style={styles.creativeCard}>
              <Text style={styles.creativeTitle}>{item.title}</Text>
              {item.description && (
                <Text style={styles.creativeDescription}>{item.description}</Text>
              )}
              <Text style={styles.creativeDate}>{formatDate(item.createdAt)}</Text>
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
  creativeCard: {
    marginBottom: theme.spacing.md,
  },
  creativeTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: "600",
    color: colors.text.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  creativeDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.text.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  creativeDate: {
    fontSize: theme.typography.fontSize.xs,
    color: colors.text.textMuted,
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

