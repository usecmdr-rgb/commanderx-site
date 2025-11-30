import React from "react";
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { colors, theme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";

export default function StudioInteractionsScreen() {
  const likesTrend = "+12%";
  const commentsTrend = "+8%";
  const messagesTrend = "+5%";

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Interactions" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Interaction Trends</Text>
          <View style={styles.statRow}>
            <Ionicons name="heart" size={20} color={colors.status.error} />
            <Text style={styles.statLabel}>Likes</Text>
            <Text style={[styles.statValue, { color: colors.status.success }]}>{likesTrend}</Text>
          </View>
          <View style={styles.statRow}>
            <Ionicons name="chatbubble" size={20} color={colors.brand.primaryBlue} />
            <Text style={styles.statLabel}>Comments</Text>
            <Text style={[styles.statValue, { color: colors.status.success }]}>{commentsTrend}</Text>
          </View>
          <View style={styles.statRow}>
            <Ionicons name="mail" size={20} color={colors.brand.primaryBlue} />
            <Text style={styles.statLabel}>Messages</Text>
            <Text style={[styles.statValue, { color: colors.status.success }]}>{messagesTrend}</Text>
          </View>
        </Card>
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
  statsCard: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: "600",
    color: colors.text.textPrimary,
    marginBottom: theme.spacing.md,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.background3,
  },
  statLabel: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: colors.text.textSecondary,
  },
  statValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: "600",
    color: colors.text.textPrimary,
  },
});

