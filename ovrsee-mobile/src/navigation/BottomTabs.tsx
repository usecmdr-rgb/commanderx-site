import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { colors, theme } from "@/theme";
import { TabBarIcon } from "@/components/TabBarIcon";
import { RootTabParamList } from "./types";
import SyncScreen from "@/screens/SyncScreen";
import AlohaScreen from "@/screens/AlohaScreen";
import SummaryScreen from "@/screens/SummaryScreen";
import StudioScreen from "@/screens/StudioScreen";
import InsightsScreen from "@/screens/InsightsScreen";

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.designSystem.tabBar.activeColor, // Matches web brand accent
        tabBarInactiveTintColor: theme.designSystem.tabBar.inactiveColor, // Matches web muted icon color
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: theme.designSystem.tabBar.backgroundColor, // Matches web bg-black
          borderTopWidth: 0,
          paddingBottom: 8,
          paddingTop: 8,
          height: theme.designSystem.tabBar.height,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
      initialRouteName="Summary"
    >
      <Tab.Screen
        name="Sync"
        component={SyncScreen}
        options={{
          title: "Sync",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="mail-outline" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Aloha"
        component={AlohaScreen}
        options={{
          title: "Aloha",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="call-outline" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Summary"
        component={SummaryScreen}
        options={{
          title: "Summary",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="home" focused={focused} isCenter={true} />
          ),
        }}
      />
      <Tab.Screen
        name="Studio"
        component={StudioScreen}
        options={{
          title: "Studio",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="image-outline" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{
          title: "Insights",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="bar-chart-outline" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
