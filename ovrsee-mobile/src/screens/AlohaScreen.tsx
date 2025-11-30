import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BubbleGrid } from "@/components/BubbleGrid";
import { colors, theme } from "@/theme";
import { getAlohaRecentCalls, toggleAlohaStatus } from "@/api/agents/aloha";
import { mockCallRecords } from "@/data/mockData";
import { RootStackParamList } from "@/navigation/types";
import { Ionicons } from "@expo/vector-icons";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * AlohaScreen - 2×2 Grid Layout
 * 
 * NO VERTICAL SCROLLING - Fixed grid with 4 bubbles:
 * 1. Overview - Preview: call health, total calls today, quick summary
 * 2. Contacts - Preview: total contacts, blacklist count
 * 3. Call Transcripts - Preview: last call transcript snippet
 * 4. Settings - Preview: status indicators (active, forwarding, greeting set, etc)
 */
export default function AlohaScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(true);
  const [calls, setCalls] = useState(mockCallRecords);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    // In production, use actual API call
    // const res = await getAlohaRecentCalls();
    setTimeout(() => setLoading(false), 500);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.agentHeader}>Aloha</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

  // Mock data for previews
  const callsToday = calls.length;
  const handledCalls = calls.filter(c => c.status === "handled").length;
  const lastCall = calls.length > 0 ? calls[0] : null;
  const totalContacts = 42;
  const blacklistCount = 3;

  const bubbles = [
    {
      id: "overview",
      title: "Overview",
      preview: (pressed: boolean) => (
        <View style={styles.bubbleContent}>
          <View style={styles.bubbleHeader}>
            <Ionicons name="stats-chart-outline" size={36} color={pressed ? "#FFFFFF" : colors.brand.primaryBlue} />
            <View style={[styles.statusIndicator, active && styles.statusActive]} />
          </View>
          <Text style={styles.bubbleTitle}>Overview</Text>
          <Text style={styles.bubbleStat}>
            {callsToday} calls today
          </Text>
          <Text style={styles.bubblePreview}>
            {handledCalls} handled, {callsToday - handledCalls} pending
          </Text>
        </View>
      ),
      onPress: () => navigation.navigate("AlohaOverview"),
    },
    {
      id: "contacts",
      title: "Contacts",
      preview: (pressed: boolean) => (
        <View style={styles.bubbleContent}>
          <View style={styles.bubbleHeader}>
            <Ionicons name="people-outline" size={36} color={pressed ? "#FFFFFF" : colors.brand.primaryBlue} />
          </View>
          <Text style={styles.bubbleTitle}>Contacts</Text>
          <Text style={styles.bubbleStat}>{totalContacts} total</Text>
          <Text style={styles.bubblePreview}>
            {blacklistCount} blacklisted
          </Text>
        </View>
      ),
      onPress: () => navigation.navigate("AlohaContacts"),
    },
    {
      id: "transcripts",
      title: "Call Transcripts",
      preview: (pressed: boolean) => (
        <View style={styles.bubbleContent}>
          <View style={styles.bubbleHeader}>
            <Ionicons name="document-text-outline" size={36} color={pressed ? "#FFFFFF" : colors.brand.primaryBlue} />
          </View>
          <Text style={styles.bubbleTitle}>Call Transcripts</Text>
          {lastCall ? (
            <>
              <Text style={styles.bubblePreview} numberOfLines={2}>
                {lastCall.summary}
              </Text>
              <Text style={styles.bubbleTime}>
                {new Date(lastCall.timestamp).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </>
          ) : (
            <Text style={styles.bubblePreview}>No recent calls</Text>
          )}
        </View>
      ),
      onPress: () => navigation.navigate("AlohaCallTranscripts"),
    },
    {
      id: "settings",
      title: "Settings",
      preview: (pressed: boolean) => (
        <View style={styles.bubbleContent}>
          <View style={styles.bubbleHeader}>
            <Ionicons name="settings-outline" size={36} color={pressed ? "#FFFFFF" : colors.brand.primaryBlue} />
            <View style={[styles.statusIndicator, active && styles.statusActive]} />
          </View>
          <Text style={styles.bubbleTitle}>Settings</Text>
          <Text style={styles.bubblePreview}>
            Status: {active ? "Active" : "Standby"}
          </Text>
          <Text style={styles.bubblePreview}>
            Forwarding: On
          </Text>
          <Text style={styles.bubblePreview}>
            Greeting: Set
          </Text>
        </View>
      ),
      onPress: () => navigation.navigate("AlohaSettings"),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.agentHeader}>Aloha</Text>
      <BubbleGrid bubbles={bubbles} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.background0,
  },
  agentHeader: {
    fontSize: theme.typography.fontSize["2xl"], // Matches web header size
    fontWeight: "600", // font-semibold
    color: colors.text.textPrimary, // Matches web: dark:text-slate-100
    textAlign: "center",
    paddingTop: theme.padding.headerTop,
    paddingHorizontal: theme.padding.headerHorizontal,
    paddingBottom: theme.spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bubbleContent: {
    flex: 1,
    width: "100%",
  },
  bubbleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.sm,
    width: "100%",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text.textMuted,
  },
  statusActive: {
    backgroundColor: colors.status.success,
  },
  bubbleTitle: {
    fontSize: theme.typography.fontSize.xl, // Matches web: text-xl font-semibold
    fontWeight: "600", // font-semibold
    color: colors.text.textPrimary, // Matches web: dark:text-slate-100
    marginBottom: theme.spacing.xs,
  },
  bubbleStat: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: "600",
    color: colors.brand.primaryBlue, // Matches web brand accent
    marginBottom: theme.spacing.xs,
  },
  bubblePreview: {
    fontSize: theme.typography.fontSize.sm, // Matches web: text-sm
    color: colors.text.textSecondary, // Matches web: dark:text-slate-400
    lineHeight: 18,
  },
  bubbleTime: {
    fontSize: theme.typography.fontSize.xs,
    color: colors.text.textMuted,
    marginTop: theme.spacing.xs,
  },
});
