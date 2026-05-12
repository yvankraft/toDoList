import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ShieldCheck,
  Lock,
  Database,
  EyeOff,
  ChevronLeft,
} from "lucide-react-native";

export default function PrivacyScreen() {
  const router = useRouter();

  const PrivacySection = ({ icon: Icon, title, description }: any) => (
    <View className="flex-row mb-8">
      <View className="bg-blue-500/10 p-3 rounded-2xl h-12 w-12 items-center justify-center">
        <Icon size={24} color="#3b82f6" />
      </View>
      <View className="flex-1 ml-4">
        <Text className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
          {title}
        </Text>
        <Text className="text-zinc-500 dark:text-zinc-400 leading-6">
          {description}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#18181b]">
      {/* Header avec retour */}
      <View className="px-6 py-4 flex-row items-center">
        <Pressable
          onPress={() => router.back()}
          className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full"
        >
          <ChevronLeft size={24} color="#94a3b8" />
        </Pressable>
        <Text className="ml-4 text-xl font-bold dark:text-white">
          Confidentialité
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-8 pt-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-10">
          <View className="bg-green-500/10 p-6 rounded-full mb-4">
            <ShieldCheck size={48} color="#22c55e" strokeWidth={1.5} />
          </View>
          <Text className="text-2xl font-black text-center dark:text-white">
            Vos données vous appartiennent
          </Text>
          <Text className="text-zinc-500 text-center mt-2 px-4">
            Nous croyons en une transparence totale sur la gestion de vos
            tâches.
          </Text>
        </View>

        <PrivacySection
          icon={Database}
          title="Stockage Local"
          description="Toutes vos tâches sont stockées directement sur votre téléphone via AsyncStorage. Aucune donnée ne quitte votre appareil."
        />

        <PrivacySection
          icon={Lock}
          title="Pas de Compte"
          description="L'application ne nécessite aucune création de compte. Nous ne collectons ni votre nom, ni votre email, ni votre position."
        />

        <PrivacySection
          icon={EyeOff}
          title="Zéro Traçage"
          description="Nous n'utilisons aucun tracker publicitaire ou outil d'analyse tiers. Votre productivité reste privée."
        />

        <View className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-[32px] mb-10 border border-zinc-100 dark:border-zinc-700">
          <Text className="text-zinc-900 dark:text-white font-bold mb-2">
            Besoin d'aide ?
          </Text>
          <Text className="text-zinc-500 dark:text-zinc-400 text-sm leading-5">
            Si vous avez des questions sur la sécurité de l'application, vous
            pouvez consulter le code source sur GitHub ou nous contacter
            directement.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
