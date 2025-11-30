import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { colors, theme } from "@/theme";
import { mockEmailDrafts } from "@/data/mockData";
import { Ionicons } from "@expo/vector-icons";

export default function SyncDraftPreviewScreen() {
  const [drafts] = useState(mockEmailDrafts);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Draft Preview" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {drafts.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No drafts available</Text>
          </Card>
        ) : (
          drafts.map((draft) => (
            <Card key={draft.id} style={styles.draftCard}>
              <View style={styles.draftHeader}>
                <Text style={styles.draftTo}>To: {draft.to}</Text>
                <Text style={styles.draftDate}>{formatDate(draft.createdAt)}</Text>
              </View>
              <Text style={styles.draftSubject}>{draft.subject}</Text>
              {draft.context && (
                <Text style={styles.draftContext} numberOfLines={2}>
                  {draft.context}
                </Text>
              )}
              <View style={styles.draftBodyContainer}>
                <Text style={styles.draftBody} numberOfLines={4}>
                  {draft.body}
                </Text>
              </View>
              <View style={styles.draftActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="send" size={16} color={colors.brand.primaryBlue} />
                  <Text style={styles.actionButtonText}>Send</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="create-outline" size={16} color={colors.text.textSecondary} />
                  <Text style={[styles.actionButtonText, { color: colors.text.textSecondary }]}>Edit</Text>
                </TouchableOpacity>
              </View>
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
  draftCard: {
    marginBottom: theme.spacing.md,
  },
  draftHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  draftTo: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: "600",
    color: colors.text.textPrimary,
  },
  draftDate: {
    fontSize: theme.typography.fontSize.xs,
    color: colors.text.textMuted,
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
    marginBottom: theme.spacing.sm,
  },
  draftBodyContainer: {
    backgroundColor: colors.background.background1,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  draftBody: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.text.textSecondary,
    lineHeight: 20,
  },
  draftActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: colors.background.background1,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.brand.primaryBlue,
  },
  actionButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.brand.primaryBlue,
    fontWeight: "600",
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

