import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import { useColorScheme } from "nativewind";
import {
  CalendarBlankIcon,
  ChartBarIcon,
  GearSixIcon,
  PlusIcon,
  TrayIcon,
} from "phosphor-react-native";
import { Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTaskModal } from "../../hooks/use-task-modal";
import { useTodos } from "../../hooks/use-todos";
import { todayKey } from "../../lib/date";

// Props structurelles du tabBar custom (@react-navigation est vendored
// dans expo-router et n'est plus exposé comme package depuis le SDK 56).
interface TabBarProps {
  state: {
    index: number;
    routes: { key: string; name: string }[];
  };
  navigation: {
    emit: (event: {
      type: "tabPress";
      target?: string;
      canPreventDefault: true;
    }) => { defaultPrevented?: boolean };
    navigate: (route: string) => void;
  };
}

const PILL_TABS = [
  { name: "index", label: "Timeline", icon: CalendarBlankIcon },
  { name: "inbox", label: "Inbox", icon: TrayIcon },
  { name: "stats", label: "Stats", icon: ChartBarIcon },
  { name: "setting", label: "Réglages", icon: GearSixIcon },
] as const;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Timeline" }} />
      <Tabs.Screen name="inbox" options={{ title: "Inbox" }} />
      <Tabs.Screen name="stats" options={{ title: "Stats" }} />
      <Tabs.Screen name="setting" options={{ title: "Réglages" }} />
    </Tabs>
  );
}

function FloatingTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { settings } = useTodos();
  const accent = settings.accent;
  const openTaskModal = useTaskModal();

  const indexOf = (name: string) =>
    state.routes.findIndex((r) => r.name === name);

  const currentRoute = state.routes[state.index]?.name;

  const pressTab = (index: number) => {
    if (index === -1) return;
    const route = state.routes[index];
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });
    if (state.index !== index && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const handleAdd = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // Depuis l'Inbox -> tâche non planifiée, sinon -> aujourd'hui
    openTaskModal({
      defaults: { date: currentRoute === "inbox" ? null : todayKey() },
    });
  };

  const inactiveColor = isDark ? "#71717a" : "#a1a1aa";

  return (
    <View
      className="absolute left-0 right-0 bottom-0 px-5 pt-2"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      pointerEvents="box-none"
    >
      <View className="flex-row items-center justify-center gap-3.5 self-center w-full">
        {/* Pilule d'onglets — effet verre dépoli */}
        <View
          className="rounded-full overflow-hidden border border-zinc-200/70 dark:border-white/10"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.3 : 0.12,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <BlurView
            intensity={isDark ? 60 : 80}
            tint={isDark ? "dark" : "light"}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 8,
              paddingVertical: 6,
              // BlurView est translucide sur Android : fond de secours
              backgroundColor:
                Platform.OS === "android"
                  ? isDark
                    ? "rgba(24,24,27,0.88)"
                    : "rgba(255,255,255,0.88)"
                  : undefined,
            }}
          >
          {PILL_TABS.map((tab) => {
            const index = indexOf(tab.name);
            if (index === -1) return null;
            const focused = state.index === index;
            const Icon = tab.icon;
            return (
              <Pressable
                key={tab.name}
                onPress={() => pressTab(index)}
                className="flex-row items-center justify-center gap-1.5 rounded-full px-3.5 py-2.5 active:opacity-70"
                style={focused ? { backgroundColor: accent + "1a" } : undefined}
              >
                <Icon
                  size={21}
                  color={focused ? accent : inactiveColor}
                  weight={focused ? "fill" : "regular"}
                />
                {focused && (
                  <Text
                    numberOfLines={1}
                    className="font-bold"
                    style={{ color: accent }}
                  >
                    {tab.label}
                  </Text>
                )}
              </Pressable>
            );
          })}
          </BlurView>
        </View>

        {/* Bouton + détaché */}
        <Pressable
          onPress={handleAdd}
          className="w-[58px] h-[58px] rounded-full items-center justify-center active:scale-90 transition-all"
          style={{
            backgroundColor: accent,
            shadowColor: accent,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 14,
            elevation: 10,
          }}
        >
          <PlusIcon size={28} color="#ffffff" weight="bold" />
        </Pressable>
      </View>
    </View>
  );
}
