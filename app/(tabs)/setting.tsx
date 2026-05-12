import React from "react";
import { View, Text, ScrollView, Pressable, Alert, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Moon,
  Trash2,
  Info,
  Code2,
  Bell,
  ShieldCheck,
  ChevronRight,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SettingsScreen() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  // Fonction pour vider le stockage
  const clearAllData = () => {
    Alert.alert(
      "Supprimer tout ?",
      "Cette action est irréversible. Toutes vos tâches seront effacées.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert("Terminé", "L'application a été réinitialisée.");
          },
        },
      ],
    );
  };

  // Composant pour une ligne de réglage
  const SettingItem = ({
    icon: Icon,
    title,
    value,
    onPress,
    type = "link",
    color = "#94a3b8",
  }: any) => (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-2xl mb-3 active:opacity-70"
    >
      <View className={`p-2 rounded-xl bg-white dark:bg-zinc-800 shadow-sm`}>
        <Icon size={22} color={color} />
      </View>
      <Text className="flex-1 ml-4 text-lg font-medium dark:text-white">
        {title}
      </Text>

      {type === "toggle" ? (
        <Switch
          value={value}
          onValueChange={onPress}
          trackColor={{ false: "#e2e8f0", true: "#3b82f6" }}
        />
      ) : (
        <ChevronRight size={20} color="#94a3b8" />
      )}
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-900">
      <ScrollView className="flex-1 px-6">
        {/* Header */}
        <View className="py-8">
          <Text className="text-4xl font-black dark:text-white">Settings</Text>
          <Text className="text-gray-500 font-mono">Version 1.0.0</Text>
        </View>

        {/* Section: Personnalisation */}
        <View className="mb-8">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">
            Personnalisation
          </Text>
          <SettingItem
            icon={Moon}
            title="Mode Sombre"
            type="toggle"
            value={isDark}
            onPress={toggleColorScheme}
            color={isDark ? "#fbbf24" : "#6366f1"}
          />
          <SettingItem
            icon={Bell}
            title="Notifications"
            onPress={() => Alert.alert("Bientôt", "Disponible en V2")}
          />
        </View>

        {/* Section: Support & Infos */}
        <View className="mb-8">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">
            À propos
          </Text>
          <SettingItem
            icon={Code2}
            title="Voir le code source"
            onPress={() => router.push("/setting")}
          />
          <SettingItem
            icon={ShieldCheck}
            title="Confidentialité"
            onPress={() => {}}
          />
          <SettingItem
            icon={Info}
            title="Crédits"
            onPress={() =>
              Alert.alert("Crédits", "Développé avec ❤️ par Wildis")
            }
          />
        </View>

        {/* Section: Danger Zone */}
        <View className="mb-10">
          <Text className="text-xs font-bold text-red-400 uppercase tracking-widest mb-4 ml-1">
            Zone de danger
          </Text>
          <SettingItem
            icon={Trash2}
            title="Réinitialiser l'application"
            onPress={clearAllData}
            color="#ef4444"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
