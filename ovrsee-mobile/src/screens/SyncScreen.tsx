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
import { getSyncOverview, getTodayAgenda, getEmailDigest, getEmailDrafts } from "@/api/agents/sync";
import { mockSyncOverview, mockAgendaItems, mockEmailDigest, mockEmailDrafts } from "@/data/mockData";
import { RootStackParamList } from "@/navigation/types";
import { Ionicons } from "@expo/vector-icons";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * SyncScreen - 2×2 Grid Layout
 * 
 * NO VERTICAL SCROLLING - Fixed grid with 4 bubbles:
 * 1. Notifications - Preview: count of unread notices, last system alert snippet
 * 2. Calendar - Preview: next upcoming event (time + title)
 * 3. Email Queue - Preview: mirror Gmail info (pending sends, drafts, unread count)
 * 4. Draft Preview - Preview: AI-generated draft snippets or top draft
 */
export default function SyncScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(mockSyncOverview);
  const [agenda, setAgenda] = useState(mockAgendaItems);
  const [digest, setDigest] = useState(mockEmailDigest);
  const [drafts, setDrafts] = useState(mockEmailDrafts);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    // In production, use actual API calls
    // const [overviewRes, agendaRes, digestRes, draftsRes] = await Promise.all([
    //   getSyncOverview(),
    //   getTodayAgenda(),
    //   getEmailDigest(),
    //   getEmailDrafts(),
    // ]);
    setTimeout(() => setLoading(false), 500);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.agentHeader}>Sync</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

  // Get next upcoming event
  const nextEvent = agenda.length > 0 ? agenda[0] : null;
  
  // Get top draft
  const topDraft = drafts.length > 0 ? drafts[0] : null;

  // Mock notifications data
  const unreadNotifications = 3;
  const lastNotification = "Calendar sync completed successfully";

  const bubbles = [
    {
      id: "notifications",
      title: "Notifications",
      preview: (pressed: boolean) => (
        <View style={styles.bubbleContent}>
          <View style={styles.bubbleHeader}>
            <Ionicons name="notifications-outline" size={36} color={pressed ? "#FFFFFF" : colors.brand.primaryBlue} />
            {unreadNotifications > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadNotifications}</Text>
              </View>
            )}
          </View>
          <Text style={styles.bubbleTitle}>Notifications</Text>
          {lastNotification && (
            <Text style={styles.bubblePreview} numberOfLines={2}>
              {lastNotification}
            </Text>
          )}
        </View>
      ),
      onPress: () => navigation.navigate("SyncNotifications"),
    },
    {
      id: "calendar",
      title: "Calendar",
      preview: (pressed: boolean) => (
        <View style={styles.bubbleContent}>
          <View style={styles.bubbleHeader}>
            <Ionicons name="calendar-outline" size={36} color={pressed ? "#FFFFFF" : colors.brand.primaryBlue} />
          </View>
          <Text style={styles.bubbleTitle}>Calendar</Text>
          {nextEvent ? (
            <>
              <Text style={styles.bubbleTime}>{nextEvent.time}</Text>
              <Text style={styles.bubblePreview} numberOfLines={2}>
                {nextEvent.title}
              </Text>
            </>
          ) : (
            <Text style={styles.bubblePreview}>No upcoming events</Text>
          )}
        </View>
      ),
      onPress: () => navigation.navigate("SyncCalendar"),
    },
    {
      id: "email-queue",
      title: "Email Queue",
      preview: (pressed: boolean) => (
        <View style={styles.bubbleContent}>
          <View style={styles.bubbleHeader}>
            <Ionicons name="mail-outline" size={36} color={pressed ? "#FFFFFF" : colors.brand.primaryBlue} />
          </View>
          <Text style={styles.bubbleTitle}>Email Queue</Text>
          <View style={styles.emailStats}>
            <Text style={styles.emailStatText}>
              {digest.importantCount} important
            </Text>
            <Text style={styles.emailStatText}>
              {digest.followUpNeeds} follow-ups
            </Text>
            <Text style={styles.emailStatText}>
              {drafts.length} drafts
            </Text>
          </View>
        </View>
      ),
      onPress: () => navigation.navigate("SyncEmailQueue"),
    },
    {
      id: "draft-preview",
      title: "Draft Preview",
      preview: (pressed: boolean) => (
        <View style={styles.bubbleContent}>
          <View style={styles.bubbleHeader}>
            <Ionicons name="document-text-outline" size={36} color={pressed ? "#FFFFFF" : colors.brand.primaryBlue} />
            {drafts.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{drafts.length}</Text>
              </View>
            )}
          </View>
          <Text style={styles.bubbleTitle}>Draft Preview</Text>
          {topDraft ? (
            <>
              <Text style={styles.bubblePreview} numberOfLines={1}>
                To: {topDraft.to}
              </Text>
              <Text style={styles.bubblePreview} numberOfLines={2}>
                {topDraft.subject}
              </Text>
            </>
          ) : (
            <Text style={styles.bubblePreview}>No drafts available</Text>
          )}
        </View>
      ),
      onPress: () => navigation.navigate("SyncDraftPreview"),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.agentHeader}>Sync</Text>
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
    position: "relative",
    width: "100%",
  },
  badge: {
    backgroundColor: colors.status.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    position: "absolute",
    right: -4,
    top: -4,
  },
  badgeText: {
    color: colors.text.textPrimary,
    fontSize: 10,
    fontWeight: "700",
  },
  bubbleTitle: {
    fontSize: theme.typography.fontSize.xl, // Matches web: text-xl font-semibold
    fontWeight: "600", // font-semibold
    color: colors.text.textPrimary, // Matches web: dark:text-slate-100
    marginBottom: theme.spacing.xs,
  },
  bubblePreview: {
    fontSize: theme.typography.fontSize.sm, // Matches web: text-sm
    color: colors.text.textSecondary, // Matches web: dark:text-slate-400
    lineHeight: 18,
  },
  bubbleTime: {
    fontSize: theme.typography.fontSize.xs,
    color: colors.brand.primaryBlue, // Matches web brand accent
    fontWeight: "600",
    marginBottom: theme.spacing.xs,
  },
  emailStats: {
    gap: theme.spacing.xs,
  },
  emailStatText: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.text.textSecondary,
  },
});
