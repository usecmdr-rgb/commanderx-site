import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { colors, theme } from "@/theme";

type StatusType = "handled" | "missed" | "needsFollowUp" | "draft" | "review" | "published" | "healthy" | "warning" | "error";

interface StatusChipProps {
  status: StatusType;
  label?: string;
}

const statusColors: Record<StatusType, { bg: string; text: string }> = {
  handled: { bg: colors.status.success + "20", text: colors.status.success },
  missed: { bg: colors.status.error + "20", text: colors.status.error },
  needsFollowUp: { bg: colors.status.warning + "20", text: colors.status.warning },
  draft: { bg: colors.text.tertiary + "20", text: colors.text.tertiary },
  review: { bg: colors.status.warning + "20", text: colors.status.warning },
  published: { bg: colors.status.success + "20", text: colors.status.success },
  healthy: { bg: colors.status.success + "20", text: colors.status.success },
  warning: { bg: colors.status.warning + "20", text: colors.status.warning },
  error: { bg: colors.status.error + "20", text: colors.status.error },
};

const statusLabels: Record<StatusType, string> = {
  handled: "Handled",
  missed: "Missed",
  needsFollowUp: "Needs Follow-up",
  draft: "Draft",
  review: "Review",
  published: "Published",
  healthy: "Healthy",
  warning: "Warning",
  error: "Error",
};

export const StatusChip: React.FC<StatusChipProps> = ({ status, label }) => {
  const statusColors_config = statusColors[status];
  const displayLabel = label || statusLabels[status];

  // Web-specific inline style for text outline
  const webTextStyle = Platform.OS === "web" ? {
    textShadow: `
      -1px -1px 0 #000000,
      1px -1px 0 #000000,
      -1px 1px 0 #000000,
      1px 1px 0 #000000,
      0 -1px 0 #000000,
      0 1px 0 #000000,
      -1px 0 0 #000000,
      1px 0 0 #000000
    `,
  } : {};

  return (
    <View style={[styles.chip, { backgroundColor: statusColors_config.bg }]}>
      <Text 
        style={[
          styles.text, 
          { color: statusColors_config.text },
          Platform.OS === "web" ? webTextStyle : styles.textOutlineNative,
        ]}
      >
        {displayLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "700",
    textTransform: "capitalize",
    includeFontPadding: false,
  },
  // Strong black text shadow for outline effect on native platforms
  textOutlineNative: {
    textShadowColor: "#000000",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
    ...Platform.select({
      ios: {
        textShadowColor: "#000000",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 4,
      },
      android: {
        elevation: 1,
        textShadowColor: "#000000",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 4,
      },
    }),
  },
});
