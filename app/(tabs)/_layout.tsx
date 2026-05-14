import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { HapticTab } from "@/components/haptic-tab";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ListChecks, Settings } from "lucide-react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        // Couleur de l'icône et du texte quand l'onglet est sélectionné
        tabBarActiveTintColor: colorScheme === "dark" ? "#F8FAFC" : "#111827", // dk-5 : lt-5

        // Couleur quand l'onglet n'est pas sélectionné
        tabBarInactiveTintColor: colorScheme === "dark" ? "#64748B" : "#9CA3AF", // dk-4 : lt-4

        headerShown: false,
        tabBarButton: HapticTab,

        // --- CONFIGURATION FLOTTANTE & BLUR ---

        // Style de la barre elle-même
        tabBarStyle: {
          backgroundColor: colorScheme === "dark" ? "#18181b" : "#F9FAFB",
          position: "absolute",
          // ajuster le margin bottom de la bar de navigation en fonction que l'on soit sur android ou ios
          bottom: Platform.OS === "android" ? 40 : 30,
          height: 65,
          marginHorizontal: 20,
          paddingBottom: 0,
          borderRadius: 24,
          borderWidth: 2,
          borderColor: colorScheme === "dark" ? "#27272a" : "#E5E7EB",
          elevation: 0, // Supprime l'ombre sur Android
          shadowOpacity: 0, // Supprime l'ombre sur iOS
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          shadowColor: "#000",
        },

        // Style du texte sous les icônes
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "bold",
          textTransform: "uppercase",
          letterSpacing: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color }) => <ListChecks size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="setting"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
