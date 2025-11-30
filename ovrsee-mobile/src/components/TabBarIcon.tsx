import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors, theme } from "@/theme";

interface TabBarIconProps {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  isCenter?: boolean;
}

export const TabBarIcon: React.FC<TabBarIconProps> = ({ name, focused, isCenter = false }) => {
  // Matches web nav bar icon colors
  const iconColor = focused 
    ? theme.designSystem.tabBar.activeColor // Matches web brand accent
    : theme.designSystem.tabBar.inactiveColor; // Matches web muted icon color
  const iconSize = isCenter && focused ? 28 : 24;

  return (
    <Ionicons
      name={name}
      size={iconSize}
      color={iconColor}
    />
  );
};
