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
import { getInsightsFeed } from "@/api/agents/insights";
import { mockInsights } from "@/data/mockData";
import { RootStackParamList } from "@/navigation/types";
import { Ionicons } from "@expo/vector-icons";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * InsightsScreen - 2×2 Grid Layout
 * 
 * NO VERTICAL SCROLLING - Fixed grid with 4 bubbles:
 * 1. Command Brief - Preview: your summarized daily/weekly insights
 * 2. My Automation - Preview: number of active automations, last triggered
 * 3. Suggestions - Preview: top recommended optimization
 * 4. Ask Insights - Preview: hint text like "Ask me anything…" or last asked query
 */
export default function InsightsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(mockInsights);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    // In production, use actual API call
    // const res = await getInsightsFeed();
    setTimeout(() => setLoading(false), 500);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.agentHeader}>Insights</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

  // Mock data for previews
  const topInsight = insights.length > 0 ? insights[0] : null;
  const activeAutomations = 5;
  const lastTriggered = "2 hours ago";
  const topSuggestion = "Optimize email send times";

  const bubbles = [
    {
      id: "command-brief",
      title: "Command Brief",
      preview: (pressed: boolean) => (
        <View style={styles.bubbleContent}>
          <View style={styles.bubbleHeader}>
            <Ionicons name="document-text-outline" size={36} color={pressed ? "#FFFFFF" : colors.brand.primaryBlue} />
          </View>
          <Text style={styles.bubbleTitle}>Command Brief</Text>
          {topInsight ? (
            <Text style={styles.bubblePreview} numberOfLines={3}>
              {topInsight.title}
            </Text>
          ) : (
            <Text style={styles.bubblePreview}>No insights yet</Text>
          )}
        </View>
      ),
      onPress: () => navigation.navigate("InsightsCommandBrief"),
    },
    {
      id: "automation",
      title: "My Automation",
      preview: (pressed: boolean) => (
        <View style={styles.bubbleContent}>
          <View style={styles.bubbleHeader}>
            <Ionicons name="settings-outline" size={36} color={pressed ? "#FFFFFF" : colors.brand.primaryBlue} />
          </View>
          <Text style={styles.bubbleTitle}>My Automation</Text>
          <Text style={styles.bubbleStat}>{activeAutomations} active</Text>
          <Text style={styles.bubblePreview}>Last: {lastTriggered}</Text>
        </View>
      ),
      onPress: () => navigation.navigate("InsightsMyAutomation"),
    },
    {
      id: "suggestions",
      title: "Suggestions",
      preview: (pressed: boolean) => (
        <View style={styles.bubbleContent}>
          <View style={styles.bubbleHeader}>
            <Ionicons name="bulb-outline" size={36} color={pressed ? "#FFFFFF" : colors.brand.primaryBlue} />
          </View>
          <Text style={styles.bubbleTitle}>Suggestions</Text>
          <Text style={styles.bubblePreview} numberOfLines={2}>
            {topSuggestion}
          </Text>
        </View>
      ),
      onPress: () => navigation.navigate("InsightsSuggestions"),
    },
    {
      id: "ask-insights",
      title: "Ask Insights",
      preview: (pressed: boolean) => (
        <View style={styles.bubbleContent}>
          <View style={styles.bubbleHeader}>
            <Ionicons name="chatbubble-outline" size={36} color={pressed ? "#FFFFFF" : colors.brand.primaryBlue} />
          </View>
          <Text style={styles.bubbleTitle}>Ask Insights</Text>
          <Text style={styles.bubblePreview}>
            Ask me anything…
          </Text>
        </View>
      ),
      onPress: () => navigation.navigate("InsightsAskInsights"),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.agentHeader}>Insights</Text>
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
});
