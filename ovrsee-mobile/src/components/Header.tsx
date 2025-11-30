import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { CompositeNavigationProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Logo } from "./Logo";
import { colors } from "@/theme";
import { RootStackParamList, RootTabParamList } from "@/navigation/types";

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

export const Header: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const navigateToHome = () => {
    // Navigate to Summary screen (home) in the tab navigator
    // If we're in MainTabs, navigate to Summary tab directly
    // Otherwise, navigate to MainTabs with Summary as the screen
    try {
      (navigation as any).navigate("Summary");
    } catch {
      // Fallback: navigate to MainTabs with Summary screen
      (navigation as any).navigate("MainTabs", { screen: "Summary" });
    }
  };

  const navigateToSettings = () => {
    // Navigate to Settings screen in root stack
    (navigation as any).navigate("Settings");
  };

  const navigateToProfile = () => {
    // Navigate to Profile screen in root stack
    (navigation as any).navigate("Profile");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.logoContainer}
        onPress={navigateToHome}
        activeOpacity={0.7}
      >
        <Logo size={32} />
      </TouchableOpacity>
      <View style={styles.rightContainer}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={navigateToSettings}
        >
          <Ionicons name="settings-outline" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={navigateToProfile}
        >
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={colors.text.primary} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.dark,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  logoContainer: {
    flex: 1,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.surface,
    alignItems: "center",
    justifyContent: "center",
  },
});
