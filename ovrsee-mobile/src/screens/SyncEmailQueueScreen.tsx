import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { colors, theme } from "@/theme";
import { mockEmailDigest, mockEmailDrafts } from "@/data/mockData";
import { Ionicons } from "@expo/vector-icons";

export default function SyncEmailQueueScreen() {
  const [digest] = useState(mockEmailDigest);
  const [drafts] = useState(mockEmailDrafts);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Email Queue" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Email Summary</Text>
          <View style={styles.summaryRow}>
            <Ionicons name="mail" size={20} color={colors.brand.primaryBlue} />
            <Text style={styles.summaryLabel}>Important emails</Text>
            <Text style={styles.summaryValue}>{digest.importantCount}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="arrow-redo" size={20} color={colors.status.warning} />
            <Text style={styles.summaryLabel}>Follow-up needs</Text>
            <Text style={styles.summaryValue}>{digest.followUpNeeds}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="archive" size={20} color={colors.status.success} />
            <Text style={styles.summaryLabel}>Newsletters filed</Text>
            <Text style={styles.summaryValue}>{digest.newslettersFiled}</Text>
          </View>
        </Card>

        <Text style={styles.sectionHeader}>Drafts ({drafts.length})</Text>
        {drafts.map((draft) => (
          <Card key={draft.id} style={styles.draftCard}>
            <Text style={styles.draftTo}>To: {draft.to}</Text>
            <Text style={styles.draftSubject}>{draft.subject}</Text>
            {draft.context && (
              <Text style={styles.draftContext} numberOfLines={2}>
                {draft.context}
              </Text>
            )}
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
  summaryCard: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: "600",
    color: colors.text.textPrimary,
    marginBottom: theme.spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.background3,
  },
  summaryLabel: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: colors.text.textSecondary,
  },
  summaryValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: "600",
    color: colors.text.textPrimary,
  },
  sectionHeader: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: "600",
    color: colors.text.textPrimary,
    marginBottom: theme.spacing.md,
  },
  draftCard: {
    marginBottom: theme.spacing.md,
  },
  draftTo: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.text.textMuted,
    marginBottom: theme.spacing.xs,
  },
  draftSubject: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: "600",
    color: colors.text.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  draftContext: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.text.textSecondary,
    fontStyle: "italic",
  },
});

