import React from "react";
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { colors, theme } from "@/theme";
import { mockCallRecords } from "@/data/mockData";
import { Ionicons } from "@expo/vector-icons";

export default function AlohaOverviewScreen() {
  const calls = mockCallRecords;
  const callsToday = calls.length;
  const handledCalls = calls.filter(c => c.status === "handled").length;

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Overview" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Today's Summary</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Calls</Text>
            <Text style={styles.statValue}>{callsToday}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Handled</Text>
            <Text style={[styles.statValue, { color: colors.status.success }]}>{handledCalls}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={[styles.statValue, { color: colors.status.warning }]}>{callsToday - handledCalls}</Text>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.background3,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.base,
    color: colors.text.textSecondary,
  },
  statValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: "600",
    color: colors.text.textPrimary,
  },
});

