import React from "react";
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { colors, theme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";

export default function StudioSocialAccountsScreen() {
  const accounts = [
    { id: "1", platform: "Instagram", connected: true },
    { id: "2", platform: "Twitter", connected: true },
    { id: "3", platform: "Facebook", connected: true },
    { id: "4", platform: "LinkedIn", connected: false },
  ];

  const getIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "instagram":
        return "logo-instagram";
      case "twitter":
        return "logo-twitter";
      case "facebook":
        return "logo-facebook";
      case "linkedin":
        return "logo-linkedin";
      default:
        return "logo-social";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Social Accounts" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {accounts.map((account) => (
          <Card key={account.id} style={styles.accountCard}>
            <View style={styles.accountRow}>
              <View style={styles.accountLeft}>
                <Ionicons
                  name={getIcon(account.platform) as any}
                  size={24}
                  color={account.connected ? colors.brand.primaryBlue : colors.text.textMuted}
                />
                <Text style={styles.accountName}>{account.platform}</Text>
              </View>
              <View style={[styles.statusBadge, account.connected && styles.statusConnected]}>
                <Text style={[styles.statusText, account.connected && styles.statusTextConnected]}>
                  {account.connected ? "Connected" : "Not Connected"}
                </Text>
              </View>
            </View>
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
  accountCard: {
    marginBottom: theme.spacing.md,
  },
  accountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accountLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  accountName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: "600",
    color: colors.text.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: colors.background.background1,
  },
  statusConnected: {
    backgroundColor: colors.status.success + "20",
  },
  statusText: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.text.textMuted,
    fontWeight: "600",
  },
  statusTextConnected: {
    color: colors.status.success,
  },
});

