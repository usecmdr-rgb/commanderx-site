import React from "react";
import { Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createStackNavigator } from "@react-navigation/stack";
import { colors } from "@/theme";
import BottomTabs from "./BottomTabs";
import ProfileScreen from "@/screens/ProfileScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import SyncDetailScreen from "@/screens/SyncDetailScreen";
import CallDetailScreen from "@/screens/CallDetailScreen";
import StudioDetailScreen from "@/screens/StudioDetailScreen";
import CalendarScreen from "@/screens/CalendarScreen";
import SyncNotificationsScreen from "@/screens/SyncNotificationsScreen";
import SyncCalendarScreen from "@/screens/SyncCalendarScreen";
import SyncEmailQueueScreen from "@/screens/SyncEmailQueueScreen";
import SyncDraftPreviewScreen from "@/screens/SyncDraftPreviewScreen";
import AlohaOverviewScreen from "@/screens/AlohaOverviewScreen";
import AlohaContactsScreen from "@/screens/AlohaContactsScreen";
import AlohaCallTranscriptsScreen from "@/screens/AlohaCallTranscriptsScreen";
import AlohaSettingsScreen from "@/screens/AlohaSettingsScreen";
import StudioInteractionsScreen from "@/screens/StudioInteractionsScreen";
import StudioUploadMediaScreen from "@/screens/StudioUploadMediaScreen";
import StudioSocialAccountsScreen from "@/screens/StudioSocialAccountsScreen";
import StudioCreativesScreen from "@/screens/StudioCreativesScreen";
import InsightsCommandBriefScreen from "@/screens/InsightsCommandBriefScreen";
import InsightsMyAutomationScreen from "@/screens/InsightsMyAutomationScreen";
import InsightsSuggestionsScreen from "@/screens/InsightsSuggestionsScreen";
import InsightsAskInsightsScreen from "@/screens/InsightsAskInsightsScreen";
import PrivacyPolicyScreen from "@/screens/PrivacyPolicyScreen";
import TermsOfServiceScreen from "@/screens/TermsOfServiceScreen";
import LoginScreen from "@/screens/LoginScreen";
import { RootStackParamList } from "./types";

// Use regular Stack for web (better web compatibility), Native Stack for native
const NativeStack = createNativeStackNavigator<RootStackParamList>();
const WebStack = createStackNavigator<RootStackParamList>();
const Stack = Platform.OS === "web" ? WebStack : NativeStack;

const screenOptions = {
  headerStyle: {
    backgroundColor: colors.background.dark,
  },
  headerTintColor: colors.text.primary,
  headerTitleStyle: {
    fontWeight: "600" as const,
  },
  contentStyle: {
    backgroundColor: colors.background.dark,
  },
};

export default function AppNavigator() {
  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: colors.brand.accent,
          background: colors.background.dark,
          card: colors.background.card,
          text: colors.text.primary,
          border: colors.border.default,
          notification: colors.brand.accent,
        },
      }}
    >
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen
          name="MainTabs"
          component={BottomTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: "Profile" }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: "Settings" }}
        />
        <Stack.Screen
          name="SyncDetail"
          component={SyncDetailScreen}
          options={{ title: "Sync Details" }}
        />
        <Stack.Screen
          name="CallDetail"
          component={CallDetailScreen}
          options={{ title: "Call Details" }}
        />
        <Stack.Screen
          name="StudioDetail"
          component={StudioDetailScreen}
          options={{ title: "Studio Details" }}
        />
        <Stack.Screen
          name="Calendar"
          component={CalendarScreen}
          options={{ title: "Calendar", headerShown: true }}
        />
        {/* Sync Agent Pages */}
        <Stack.Screen
          name="SyncNotifications"
          component={SyncNotificationsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SyncCalendar"
          component={SyncCalendarScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SyncEmailQueue"
          component={SyncEmailQueueScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SyncDraftPreview"
          component={SyncDraftPreviewScreen}
          options={{ headerShown: false }}
        />
        {/* Aloha Agent Pages */}
        <Stack.Screen
          name="AlohaOverview"
          component={AlohaOverviewScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AlohaContacts"
          component={AlohaContactsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AlohaCallTranscripts"
          component={AlohaCallTranscriptsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AlohaSettings"
          component={AlohaSettingsScreen}
          options={{ headerShown: false }}
        />
        {/* Studio Agent Pages */}
        <Stack.Screen
          name="StudioInteractions"
          component={StudioInteractionsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="StudioUploadMedia"
          component={StudioUploadMediaScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="StudioSocialAccounts"
          component={StudioSocialAccountsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="StudioCreatives"
          component={StudioCreativesScreen}
          options={{ headerShown: false }}
        />
        {/* Insights Agent Pages */}
        <Stack.Screen
          name="InsightsCommandBrief"
          component={InsightsCommandBriefScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="InsightsMyAutomation"
          component={InsightsMyAutomationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="InsightsSuggestions"
          component={InsightsSuggestionsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="InsightsAskInsights"
          component={InsightsAskInsightsScreen}
          options={{ headerShown: false }}
        />
        {/* Legal Screens */}
        <Stack.Screen
          name="PrivacyPolicy"
          component={PrivacyPolicyScreen}
          options={{ title: "Privacy Policy", headerShown: false }}
        />
        <Stack.Screen
          name="TermsOfService"
          component={TermsOfServiceScreen}
          options={{ title: "Terms of Service", headerShown: false }}
        />
        {/* Auth Screen */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}