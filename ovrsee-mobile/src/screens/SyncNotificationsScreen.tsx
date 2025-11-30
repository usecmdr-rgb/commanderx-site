import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { colors, theme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";

export default function SyncNotificationsScreen() {
  const [notifications] = useState([
    {
      id: "1",
      type: "system",
      message: "Calendar sync completed successfully",
      timestamp: "2024-01-15T09:00:00Z",
      read: false,
    },
    {
      id: "2",
      type: "alert",
      message: "Email draft ready for review",
      timestamp: "2024-01-15T08:30:00Z",
      read: false,
    },
    {
      id: "3",
      type: "system",
      message: "Gmail connection verified",
      timestamp: "2024-01-15T08:00:00Z",
      read: true,
    },
  ]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Notifications" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {notifications.map((notification) => (
          <Card key={notification.id} style={styles.notificationCard}>
            <View style={styles.notificationHeader}>
              <Ionicons
                name={notification.type === "alert" ? "alert-circle" : "information-circle"}
                size={20}
                color={notification.type === "alert" ? colors.status.warning : colors.brand.primaryBlue}
              />
              {!notification.read && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.notificationMessage}>{notification.message}</Text>
            <Text style={styles.notificationTime}>{formatTime(notification.timestamp)}</Text>
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
  notificationCard: {
    marginBottom: theme.spacing.md,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand.primaryBlue,
  },
  notificationMessage: {
    fontSize: theme.typography.fontSize.base,
    color: colors.text.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  notificationTime: {
    fontSize: theme.typography.fontSize.xs,
    color: colors.text.textMuted,
  },
});

