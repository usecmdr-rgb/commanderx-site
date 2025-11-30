import React from "react";
import { View, StyleSheet, ViewStyle, TouchableOpacity } from "react-native";
import { colors, theme } from "@/theme";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, style, onPress }) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card, // Matches web: bg-slate-900/40
    borderRadius: theme.borderRadius.card, // rounded-3xl (24px) - matches web
    borderWidth: 1,
    borderColor: colors.border.default, // Matches web: border-slate-800
    padding: theme.padding.card, // Matches web: p-4 (16px)
    ...theme.shadows.sm, // Matches web: shadow-sm
  },
});
