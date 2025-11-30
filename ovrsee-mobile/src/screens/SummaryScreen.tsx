import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { colors, theme } from "@/theme";
import { getTodaySummary, getAgentSummaries } from "@/api/summary";
import { mockTodaySummary, mockAgentSummaries } from "@/data/mockData";
import { RootTabParamList } from "@/navigation/types";

type NavigationProp = BottomTabNavigationProp<RootTabParamList>;

// Agent order: Sync → Aloha → Studio → Insights
const AGENT_ORDER: Array<{ key: "sync" | "aloha" | "studio" | "insight"; tab: keyof RootTabParamList }> = [
  { key: "sync", tab: "Sync" },
  { key: "aloha", tab: "Aloha" },
  { key: "studio", tab: "Studio" },
  { key: "insight", tab: "Insights" },
];

export default function SummaryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(mockTodaySummary);
  const [agentSummaries, setAgentSummaries] = useState(mockAgentSummaries);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    // In production, use actual API calls
    // const [summaryRes, agentsRes] = await Promise.all([
    //   getTodaySummary(),
    //   getAgentSummaries(),
    // ]);
    setTimeout(() => setLoading(false), 500);
  };


  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Hero Summary Card */}
        <Card style={styles.heroCard}>
          <Text style={styles.heroTitle}>Today's Summary</Text>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{summary.callsHandled}</Text>
              <Text style={styles.heroStatLabel}>Calls (Aloha)</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{summary.emailsProcessed}</Text>
              <Text style={styles.heroStatLabel}>Emails (Sync)</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{summary.insightsGenerated}</Text>
              <Text style={styles.heroStatLabel}>Insights</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{summary.creativeUpdates}</Text>
              <Text style={styles.heroStatLabel}>Creative (Studio)</Text>
            </View>
          </View>
        </Card>

        {/* Agent Summaries in correct order - Simple banners */}
        {AGENT_ORDER.map(({ key, tab }) => {
          const agentSummary = agentSummaries.find((s) => s.agentKey === key);
          if (!agentSummary) return null;

          return (
            <TouchableOpacity
              key={key}
              onPress={() => navigation.navigate(tab)}
              activeOpacity={0.7}
            >
              <View style={styles.agentBanner}>
                <Text style={styles.agentBannerName}>{agentSummary.agentName}</Text>
                <View style={styles.bullets}>
                  {agentSummary.bullets.map((bullet, index) => (
                    <View key={index} style={styles.bulletItem}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.bulletText}>{bullet}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heroCard: {
    marginBottom: theme.spacing.lg,
  },
  heroTitle: {
    fontSize: theme.typography.fontSize["2xl"], // Matches web dashboard header
    fontWeight: "600", // font-semibold - matches web
    color: colors.text.textPrimary, // Matches web: dark:text-slate-100
    marginBottom: theme.spacing.md,
  },
  heroStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  heroStat: {
    flex: 1,
    minWidth: "45%",
    marginBottom: theme.spacing.md,
  },
  heroStatValue: {
    fontSize: theme.typography.fontSize["3xl"],
    fontWeight: "600", // font-semibold - matches web
    color: colors.brand.primaryBlue, // Matches web brand accent
    marginBottom: theme.spacing.xs,
  },
  heroStatLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.text.textSecondary, // Matches web: dark:text-slate-400
  },
  agentBanner: {
    backgroundColor: colors.background.card, // Matches web: bg-slate-900/40
    borderRadius: theme.borderRadius.card, // rounded-3xl (24px) - matches web
    borderWidth: 1,
    borderColor: colors.border.default, // Matches web: border-slate-800
    padding: theme.padding.card, // Matches web: p-4 (16px)
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm, // Matches web: shadow-sm
  },
  agentBannerName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: "600", // font-semibold
    color: colors.text.textPrimary, // Matches web: dark:text-slate-100
    textAlign: "center",
    marginBottom: theme.spacing.md,
  },
  bullets: {
    gap: theme.spacing.sm,
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  bullet: {
    fontSize: theme.typography.fontSize.base,
    color: colors.text.secondary,
    marginRight: theme.spacing.sm,
  },
  bulletText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: colors.text.textSecondary, // Matches web: dark:text-slate-400
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
  },
});
