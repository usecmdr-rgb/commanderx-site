import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { colors, theme } from "@/theme";
import { mockAgendaItems } from "@/data/mockData";
import { Ionicons } from "@expo/vector-icons";

export default function SyncCalendarScreen() {
  const [agenda] = useState(mockAgendaItems);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Calendar" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {agenda.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No upcoming events</Text>
          </Card>
        ) : (
          agenda.map((item) => (
            <Card key={item.id} style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventTime}>{item.time}</Text>
                <Text style={styles.eventType}>{item.type}</Text>
              </View>
              <Text style={styles.eventTitle}>{item.title}</Text>
              {item.description && (
                <Text style={styles.eventDescription}>{item.description}</Text>
              )}
            </Card>
          ))
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
  eventCard: {
    marginBottom: theme.spacing.md,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  eventTime: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.brand.primaryBlue,
    fontWeight: "600",
  },
  eventType: {
    fontSize: theme.typography.fontSize.xs,
    color: colors.text.textMuted,
    textTransform: "capitalize",
  },
  eventTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: "600",
    color: colors.text.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  eventDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.text.textSecondary,
  },
  emptyCard: {
    padding: theme.spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: colors.text.textMuted,
  },
});

