import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { Modal } from "@/components/Modal";
import { colors, theme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { requestAccountDeletion } from "@/api/account";
import { signOut } from "@/lib/auth";
import * as Notifications from "expo-notifications";
import { RootStackParamList } from "@/navigation/types";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme, setTheme } = useTheme();
  const colors = useColors();
  const [notifications, setNotifications] = useState(true);
  const [agents, setAgents] = useState({
    sync: true,
    aloha: true,
    studio: true,
    insight: true,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleAgent = (key: keyof typeof agents) => {
    setAgents({ ...agents, [key]: !agents[key] });
  };

  // Request notifications permission when user enables notifications
  const handleNotificationsToggle = async (value: boolean) => {
    if (value) {
      // Request permission when enabling notifications
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        Alert.alert(
          "Permission Required",
          "To receive notifications, please enable them in your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                if (Platform.OS === "ios") {
                  Linking.openURL("app-settings:");
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
        setNotifications(false);
        return;
      }
    }
    setNotifications(value);
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const result = await requestAccountDeletion();
      
      if (result.error) {
        Alert.alert(
          "Error",
          result.error || "Failed to delete account. Please try again later.",
          [{ text: "OK" }]
        );
        setIsDeleting(false);
        setShowDeleteConfirm(false);
        return;
      }

      // Sign out the user
      await signOut();

      // Show success message and navigate to login
      Alert.alert(
        "Account Deletion Requested",
        "Your account deletion request has been submitted. Your account and data will be permanently deleted.",
        [
          {
            text: "OK",
            onPress: () => {
              // Navigation to login will be handled by auth gate
              setShowDeleteConfirm(false);
            },
          },
        ]
      );
    } catch (error) {
      console.error("Account deletion error:", error);
      Alert.alert(
        "Error",
        "An unexpected error occurred. Please try again later.",
        [{ text: "OK" }]
      );
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* General Settings */}
        <Text style={styles.sectionHeader}>General</Text>
        <Card style={styles.settingsCard}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon" size={24} color={colors.text.primary} />
              <Text style={styles.settingLabel}>Theme</Text>
            </View>
            <View style={styles.themeButtons}>
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  theme === "dark" && styles.themeButtonActive,
                ]}
                onPress={() => setTheme("dark")}
              >
                <Text
                  style={[
                    styles.themeButtonText,
                    theme === "dark" && styles.themeButtonTextActive,
                  ]}
                >
                  Dark
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  theme === "light" && styles.themeButtonActive,
                ]}
                onPress={() => setTheme("light")}
              >
                <Text
                  style={[
                    styles.themeButtonText,
                    theme === "light" && styles.themeButtonTextActive,
                  ]}
                >
                  Light
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color={colors.text.primary}
              />
              <Text style={styles.settingLabel}>Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: colors.border.default, true: colors.brand.accent }}
              thumbColor={colors.text.primary}
            />
          </View>
        </Card>

        {/* Agents Settings */}
        <Text style={styles.sectionHeader}>Agents</Text>
        <Card style={styles.settingsCard}>
          {Object.entries(agents).map(([key, enabled]) => (
            <View key={key} style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="sparkles" size={24} color={colors.text.primary} />
                <Text style={styles.settingLabel}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={() => toggleAgent(key as keyof typeof agents)}
                trackColor={{ false: colors.border.default, true: colors.brand.accent }}
                thumbColor={colors.text.primary}
              />
            </View>
          ))}
        </Card>

        {/* Integrations */}
        <Text style={styles.sectionHeader}>Integrations</Text>
        <Card style={styles.settingsCard}>
          <TouchableOpacity style={styles.integrationButton}>
            <View style={styles.settingLeft}>
              <Ionicons name="mail" size={24} color={colors.text.primary} />
              <Text style={styles.settingLabel}>Gmail</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.text.tertiary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.integrationButton}>
            <View style={styles.settingLeft}>
              <Ionicons name="calendar" size={24} color={colors.text.primary} />
              <Text style={styles.settingLabel}>Calendar</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.text.tertiary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.integrationButton}>
            <View style={styles.settingLeft}>
              <Ionicons name="sparkles" size={24} color={colors.text.primary} />
              <Text style={styles.settingLabel}>OpenAI</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.text.tertiary}
            />
          </TouchableOpacity>
        </Card>

        {/* Legal */}
        <Text style={styles.sectionHeader}>Legal</Text>
        <Card style={styles.settingsCard}>
          <TouchableOpacity
            style={styles.integrationButton}
            onPress={() => navigation.navigate("PrivacyPolicy")}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="document-text-outline" size={24} color={colors.text.primary} />
              <Text style={styles.settingLabel}>Privacy Policy</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.text.tertiary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.integrationButton}
            onPress={() => navigation.navigate("TermsOfService")}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="document-text-outline" size={24} color={colors.text.primary} />
              <Text style={styles.settingLabel}>Terms of Service</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.text.tertiary}
            />
          </TouchableOpacity>
        </Card>

        {/* About */}
        <Text style={styles.sectionHeader}>About</Text>
        <Card style={styles.aboutCard}>
          <Text style={styles.aboutText}>OVRSEE Mobile</Text>
          <Text style={styles.aboutVersion}>Version 1.0.0</Text>
        </Card>

        {/* Account Deletion */}
        <Text style={styles.sectionHeader}>Account</Text>
        <Card style={styles.settingsCard}>
          <TouchableOpacity
            style={[styles.integrationButton, styles.deleteButton]}
            onPress={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="trash-outline" size={24} color={colors.status.error} />
              <Text style={[styles.settingLabel, styles.deleteButtonText]}>
                Delete Account
              </Text>
            </View>
            {isDeleting && (
              <Text style={styles.deletingText}>Deleting...</Text>
            )}
          </TouchableOpacity>
        </Card>
      </ScrollView>

      {/* Account Deletion Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        onClose={() => !isDeleting && setShowDeleteConfirm(false)}
        title="Delete Account"
        dismissible={!isDeleting}
      >
        <View style={styles.deleteModalContent}>
          <Text style={styles.deleteModalText}>
            Are you sure you want to delete your account? This action cannot be undone.
          </Text>
          <Text style={styles.deleteModalWarning}>
            This will permanently delete your account and all associated data, including:
          </Text>
          <View style={styles.deleteModalList}>
            <Text style={styles.deleteModalListItem}>• Your profile information</Text>
            <Text style={styles.deleteModalListItem}>• All agent data and settings</Text>
            <Text style={styles.deleteModalListItem}>• Call transcripts and email data</Text>
            <Text style={styles.deleteModalListItem}>• All integrations and connections</Text>
          </View>
          <View style={styles.deleteModalButtons}>
            <TouchableOpacity
              style={[styles.deleteModalButton, styles.deleteModalButtonCancel]}
              onPress={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              <Text style={styles.deleteModalButtonCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteModalButton, styles.deleteModalButtonConfirm]}
              onPress={handleDeleteAccount}
              disabled={isDeleting}
            >
              <Text style={styles.deleteModalButtonConfirmText}>
                {isDeleting ? "Deleting..." : "Delete Account"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
  sectionHeader: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: "600",
    color: colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  settingsCard: {
    marginTop: theme.spacing.sm,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  settingLabel: {
    fontSize: theme.typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: "500",
  },
  themeButtons: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  themeButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  themeButtonActive: {
    backgroundColor: colors.brand.accent,
    borderColor: colors.brand.accent,
  },
  themeButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: "600",
  },
  themeButtonTextActive: {
    color: colors.text.primary,
  },
  integrationButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  aboutCard: {
    marginTop: theme.spacing.sm,
    alignItems: "center",
    paddingVertical: theme.spacing.lg,
  },
  aboutText: {
    fontSize: theme.typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: "600",
    marginBottom: theme.spacing.xs,
  },
  aboutVersion: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  deleteButton: {
    borderBottomWidth: 0,
  },
  deleteButtonText: {
    color: colors.status.error,
  },
  deletingText: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.text.secondary,
  },
  deleteModalContent: {
    gap: theme.spacing.md,
  },
  deleteModalText: {
    fontSize: theme.typography.fontSize.base,
    color: colors.text.primary,
    lineHeight: 22,
  },
  deleteModalWarning: {
    fontSize: theme.typography.fontSize.base,
    color: colors.text.secondary,
    fontWeight: "600",
    marginTop: theme.spacing.sm,
  },
  deleteModalList: {
    gap: theme.spacing.xs,
    marginVertical: theme.spacing.sm,
  },
  deleteModalListItem: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  deleteModalButtons: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteModalButtonCancel: {
    backgroundColor: colors.background.background1,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  deleteModalButtonConfirm: {
    backgroundColor: colors.status.error,
  },
  deleteModalButtonCancelText: {
    fontSize: theme.typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: "600",
  },
  deleteModalButtonConfirmText: {
    fontSize: theme.typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: "600",
  },
});
