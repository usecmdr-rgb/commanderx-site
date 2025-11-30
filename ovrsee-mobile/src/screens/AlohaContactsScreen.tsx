import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, Alert, Linking, Platform } from "react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { colors, theme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";

/**
 * Aloha Contacts Screen
 * 
 * This screen allows users to view and manage contacts for the Aloha agent.
 * Used so Aloha can show and manage your contacts for calls, voicemail, and call routing.
 * 
 * Requires contacts permission to access device contacts.
 */
export default function AlohaContactsScreen() {
  const [contactsPermission, setContactsPermission] = useState<Contacts.PermissionStatus | null>(null);
  const [totalContacts, setTotalContacts] = useState(0);
  const [blacklistCount] = useState(3);

  useEffect(() => {
    checkContactsPermission();
  }, []);

  // Check current contacts permission status
  const checkContactsPermission = async () => {
    const { status } = await Contacts.getPermissionsAsync();
    setContactsPermission(status);
    
    if (status === "granted") {
      // Load contacts count when permission is granted
      loadContactsCount();
    }
  };

  // Load contacts count (simplified - in production, fetch actual contact list)
  const loadContactsCount = async () => {
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name],
      });
      setTotalContacts(data.length);
    } catch (error) {
      console.error("Error loading contacts:", error);
      setTotalContacts(0);
    }
  };

  // Request contacts permission when user taps the permission card
  const requestContactsPermission = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    setContactsPermission(status);

    if (status === "granted") {
      await loadContactsCount();
    } else {
      Alert.alert(
        "Permission Required",
        "OVRSEE needs access to your contacts to identify who is calling and manage your call preferences. You can enable this in your device settings.",
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
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Contacts" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Contact Summary</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Contacts</Text>
            <Text style={styles.statValue}>{totalContacts}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Blacklisted</Text>
            <Text style={[styles.statValue, { color: colors.status.error }]}>{blacklistCount}</Text>
          </View>
        </Card>
        {contactsPermission !== "granted" && (
          <TouchableOpacity onPress={requestContactsPermission}>
            <Card style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={24} color={colors.brand.primaryBlue} />
              <Text style={styles.infoText}>
                {contactsPermission === "denied"
                  ? "Contacts permission denied. Tap to open settings and enable access."
                  : "Access phone contacts requires permission. Tap to grant access."}
              </Text>
            </Card>
          </TouchableOpacity>
        )}
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
  summaryCard: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: "600",
    color: colors.text.textPrimary,
    marginBottom: theme.spacing.md,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.background3,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.base,
    color: colors.text.textSecondary,
  },
  statValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: "600",
    color: colors.text.textPrimary,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: colors.text.textSecondary,
    lineHeight: 20,
  },
});

