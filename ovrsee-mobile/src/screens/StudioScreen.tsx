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
import { getStudioFeed } from "@/api/agents/studio";
import { mockStudioItems } from "@/data/mockData";
import { RootStackParamList } from "@/navigation/types";
import { Ionicons } from "@expo/vector-icons";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * StudioScreen - 2×2 Grid Layout
 * 
 * NO VERTICAL SCROLLING - Fixed grid with 4 bubbles:
 * 1. Interactions - Preview: likes/comments/messages trend
 * 2. Upload Media - Preview: last upload thumbnail or placeholder
 * 3. Social Accounts - Preview: connected platforms count + small icons
 * 4. Creatives - Preview: recent AI-generated assets, concepts, or drafts
 */
export default function StudioScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState(mockStudioItems);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    // In production, use actual API call
    // const res = await getStudioFeed();
    setTimeout(() => setLoading(false), 500);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.agentHeader}>Studio</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

  // Mock data for previews
  const lastItem = items.length > 0 ? items[0] : null;
  const connectedAccounts = 3;
  const likesTrend = "+12%";
  const commentsTrend = "+8%";

  const bubbles = [
    {
      id: "interactions",
      title: "Interactions",
      preview: (pressed: boolean) => (
        <View style={styles.bubbleContent}>
          <View style={styles.bubbleHeader}>
            <Ionicons name="heart-outline" size={36} color={pressed ? "#FFFFFF" : colors.brand.primaryBlue} />
          </View>
          <Text style={styles.bubbleTitle}>Interactions</Text>
          <Text style={styles.bubbleStat}>{likesTrend}</Text>
          <Text style={styles.bubblePreview}>Likes trend</Text>
          <Text style={styles.bubblePreview}>{commentsTrend} comments</Text>
        </View>
      ),
      onPress: () => navigation.navigate("StudioInteractions"),
    },
    {
      id: "upload-media",
      title: "Upload Media",
      preview: (pressed: boolean) => (
        <View style={styles.bubbleContent}>
          <View style={styles.bubbleHeader}>
            <Ionicons name="cloud-upload-outline" size={36} color={pressed ? "#FFFFFF" : colors.brand.primaryBlue} />
          </View>
          <Text style={styles.bubbleTitle}>Upload Media</Text>
          {lastItem ? (
            <View style={styles.thumbnailPlaceholder}>
              <Text style={styles.thumbnailText}>Last upload</Text>
            </View>
          ) : (
            <Text style={styles.bubblePreview}>No uploads yet</Text>
          )}
        </View>
      ),
      onPress: () => navigation.navigate("StudioUploadMedia"),
    },
    {
      id: "social-accounts",
      title: "Social Accounts",
      preview: (pressed: boolean) => (
        <View style={styles.bubbleContent}>
          <View style={styles.bubbleHeader}>
            <Ionicons name="share-social-outline" size={36} color={pressed ? "#FFFFFF" : colors.brand.primaryBlue} />
          </View>
          <Text style={styles.bubbleTitle}>Social Accounts</Text>
          <Text style={styles.bubbleStat}>{connectedAccounts} connected</Text>
          <View style={styles.socialIcons}>
            <Ionicons name="logo-instagram" size={16} color={colors.text.textSecondary} />
            <Ionicons name="logo-twitter" size={16} color={colors.text.textSecondary} />
            <Ionicons name="logo-facebook" size={16} color={colors.text.textSecondary} />
          </View>
        </View>
      ),
      onPress: () => navigation.navigate("StudioSocialAccounts"),
    },
    {
      id: "creatives",
      title: "Creatives",
      preview: (pressed: boolean) => (
        <View style={styles.bubbleContent}>
          <View style={styles.bubbleHeader}>
            <Ionicons name="image-outline" size={36} color={pressed ? "#FFFFFF" : colors.brand.primaryBlue} />
            {items.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{items.length}</Text>
              </View>
            )}
          </View>
          <Text style={styles.bubbleTitle}>Creatives</Text>
          {lastItem ? (
            <Text style={styles.bubblePreview} numberOfLines={2}>
              {lastItem.title}
            </Text>
          ) : (
            <Text style={styles.bubblePreview}>No creatives yet</Text>
          )}
        </View>
      ),
      onPress: () => navigation.navigate("StudioCreatives"),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.agentHeader}>Studio</Text>
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
  thumbnailPlaceholder: {
    width: "100%",
    height: 60,
    backgroundColor: colors.background.background1,
    borderRadius: theme.borderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginTop: theme.spacing.xs,
  },
  thumbnailText: {
    fontSize: theme.typography.fontSize.xs,
    color: colors.text.textMuted, // Matches web: text-slate-500
  },
  socialIcons: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
});
