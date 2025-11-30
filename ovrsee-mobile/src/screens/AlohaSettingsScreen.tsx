import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Switch } from "react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { colors, theme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";

export default function AlohaSettingsScreen() {
  const [active, setActive] = useState(true);
  const [forwarding, setForwarding] = useState(true);
  const [greeting, setGreeting] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Settings" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Aloha Settings</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="power-outline" size={20} color={colors.text.textSecondary} />
              <Text style={styles.settingLabel}>Active Status</Text>
            </View>
            <Switch
              value={active}
              onValueChange={setActive}
              trackColor={{ false: colors.background.background3, true: colors.brand.primaryBlue }}
              thumbColor={colors.text.textPrimary}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="call-forward-outline" size={20} color={colors.text.textSecondary} />
              <Text style={styles.settingLabel}>Call Forwarding</Text>
            </View>
            <Switch
              value={forwarding}
              onValueChange={setForwarding}
              trackColor={{ false: colors.background.background3, true: colors.brand.primaryBlue }}
              thumbColor={colors.text.textPrimary}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="mic-outline" size={20} color={colors.text.textSecondary} />
              <Text style={styles.settingLabel}>Greeting Set</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{greeting ? "Set" : "Not Set"}</Text>
            </View>
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
  settingsCard: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: "600",
    color: colors.text.textPrimary,
    marginBottom: theme.spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.background3,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  settingLabel: {
    fontSize: theme.typography.fontSize.base,
    color: colors.text.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: colors.background.background1,
  },
  statusText: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.text.textSecondary,
    fontWeight: "600",
  },
});

