import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, SafeAreaView } from "react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { colors, theme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";

// External URL for Privacy Policy
const PRIVACY_POLICY_URL = "https://ovrsee.dev/privacy";

export default function PrivacyPolicyScreen() {
  const handleOpenExternalLink = () => {
    Linking.openURL(PRIVACY_POLICY_URL).catch((err) =>
      console.error("Failed to open privacy policy URL:", err)
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Privacy Policy" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.updatedText}>Last updated: {new Date().toLocaleDateString()}</Text>

          <Text style={styles.sectionTitle}>Data Collection</Text>
          <Text style={styles.paragraph}>
            OVRSEE collects and processes the following types of data:
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Email addresses and account information</Text>
            <Text style={styles.listItem}>• Contact information (when you grant permission)</Text>
            <Text style={styles.listItem}>• Call transcripts and voicemail recordings</Text>
            <Text style={styles.listItem}>• Email content and drafts</Text>
            <Text style={styles.listItem}>• Calendar events and scheduling data</Text>
            <Text style={styles.listItem}>• Usage analytics and app performance data</Text>
          </View>

          <Text style={styles.sectionTitle}>How We Use Your Data</Text>
          <Text style={styles.paragraph}>
            Your data is used to provide AI agent services, including:
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Processing and managing your communications</Text>
            <Text style={styles.listItem}>• Generating AI-powered responses and insights</Text>
            <Text style={styles.listItem}>• Synchronizing your calendar and email</Text>
            <Text style={styles.listItem}>• Improving our services and user experience</Text>
          </View>

          <Text style={styles.sectionTitle}>Data Storage and Security</Text>
          <Text style={styles.paragraph}>
            Your data is stored securely using Supabase and other trusted service providers. We implement industry-standard security measures to protect your information.
          </Text>

          <Text style={styles.sectionTitle}>Third-Party Services</Text>
          <Text style={styles.paragraph}>
            OVRSEE uses the following third-party services that may process your data:
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Supabase (database and authentication)</Text>
            <Text style={styles.listItem}>• OpenAI (AI processing)</Text>
            <Text style={styles.listItem}>• Gmail API (email integration)</Text>
            <Text style={styles.listItem}>• Calendar APIs (scheduling integration)</Text>
          </View>

          <Text style={styles.sectionTitle}>Your Rights</Text>
          <Text style={styles.paragraph}>
            You have the right to:
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Access your personal data</Text>
            <Text style={styles.listItem}>• Request data deletion</Text>
            <Text style={styles.listItem}>• Withdraw consent for data processing</Text>
            <Text style={styles.listItem}>• Export your data</Text>
          </View>

          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.paragraph}>
            For privacy-related questions or requests, please contact us at privacy@ovrsee.dev
          </Text>

          {/* Link to full privacy policy */}
          <TouchableOpacity
            style={styles.externalLinkButton}
            onPress={handleOpenExternalLink}
          >
            <Text style={styles.externalLinkText}>View Full Privacy Policy Online</Text>
            <Ionicons name="open-outline" size={20} color={colors.brand.primaryBlue} />
          </TouchableOpacity>
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
  card: {
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize["2xl"],
    fontWeight: "700",
    color: colors.text.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  updatedText: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.text.textMuted,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: "600",
    color: colors.text.textPrimary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  paragraph: {
    fontSize: theme.typography.fontSize.base,
    color: colors.text.textSecondary,
    lineHeight: 22,
    marginBottom: theme.spacing.sm,
  },
  list: {
    marginLeft: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  listItem: {
    fontSize: theme.typography.fontSize.base,
    color: colors.text.textSecondary,
    lineHeight: 22,
  },
  externalLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: colors.background.background1,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.brand.primaryBlue,
  },
  externalLinkText: {
    fontSize: theme.typography.fontSize.base,
    color: colors.brand.primaryBlue,
    fontWeight: "600",
  },
});

