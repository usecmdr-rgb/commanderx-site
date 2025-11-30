import React from "react";
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { colors, theme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";

export default function InsightsMyAutomationScreen() {
  const automations = [
    { id: "1", name: "Auto-respond to emails", active: true, lastTriggered: "2 hours ago" },
    { id: "2", name: "Schedule social posts", active: true, lastTriggered: "5 hours ago" },
    { id: "3", name: "Call forwarding rules", active: false, lastTriggered: "1 day ago" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="My Automation" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {automations.map((automation) => (
          <Card key={automation.id} style={styles.automationCard}>
            <View style={styles.automationRow}>
              <View style={styles.automationLeft}>
                <Ionicons
                  name={automation.active ? "checkmark-circle" : "close-circle"}
                  size={20}
                  color={automation.active ? colors.status.success : colors.text.textMuted}
                />
                <Text style={styles.automationName}>{automation.name}</Text>
              </View>
            </View>
            <Text style={styles.automationTrigger}>Last triggered: {automation.lastTriggered}</Text>
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
  automationCard: {
    marginBottom: theme.spacing.md,
  },
  automationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  automationLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    flex: 1,
  },
  automationName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: "600",
    color: colors.text.textPrimary,
  },
  automationTrigger: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.text.textMuted,
    marginTop: theme.spacing.xs,
  },
});

