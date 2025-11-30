import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { colors, theme } from "@/theme";

interface BubbleItem {
  id: string;
  title: string;
  preview: (pressed: boolean) => React.ReactNode;
  onPress: () => void;
}

interface BubbleGridProps {
  bubbles: BubbleItem[];
}

/**
 * BubbleGrid Component
 * 
 * Creates a 2×2 grid layout for agent home screens.
 * Each bubble is a square/rounded rectangle that opens a new page.
 * NO VERTICAL SCROLLING - fixed grid layout.
 */
export const BubbleGrid: React.FC<BubbleGridProps> = ({ bubbles }) => {
  const screenWidth = Dimensions.get("window").width;
  const padding = theme.spacing.md;
  const gap = theme.spacing.md;
  const totalPadding = padding * 2;
  const totalGaps = gap;
  const bubbleWidth = (screenWidth - totalPadding - totalGaps) / 2;
  const bubbleHeight = bubbleWidth; // Square bubbles
  const [pressedBubble, setPressedBubble] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {bubbles.map((bubble) => (
          <TouchableOpacity
            key={bubble.id}
            style={[
              styles.bubble,
              {
                width: bubbleWidth,
                height: bubbleHeight,
              },
            ]}
            onPress={bubble.onPress}
            onPressIn={() => setPressedBubble(bubble.id)}
            onPressOut={() => setPressedBubble(null)}
            activeOpacity={0.8}
          >
            {bubble.preview(pressedBubble === bubble.id)}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

/**
 * Bubble Component
 * 
 * Individual bubble wrapper - styled container for bubble content
 */
interface BubbleProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: any;
}

export const Bubble: React.FC<BubbleProps> = ({ children, onPress, style }) => {
  return (
    <TouchableOpacity
      style={[styles.bubbleBase, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    justifyContent: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  bubble: {
    backgroundColor: colors.background.card, // Matches web: bg-slate-900/40
    borderRadius: theme.borderRadius.bubble, // rounded-3xl (24px)
    borderWidth: 1,
    borderColor: colors.border.default, // Matches web: border-slate-800
    padding: theme.padding.card, // Matches web: p-4 (16px)
    ...theme.shadows.sm, // Matches web: shadow-sm
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  bubbleBase: {
    backgroundColor: colors.background.card,
    borderRadius: theme.borderRadius.bubble,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: theme.padding.card,
    ...theme.shadows.sm,
  },
});

