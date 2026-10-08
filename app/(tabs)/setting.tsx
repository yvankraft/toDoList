import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import {
    BellRingingIcon as Bell,
    CalendarDotsIcon as CalendarIcon,
    CaretRightIcon as ChevronRight,
    CodeIcon as Code2,
    DownloadSimpleIcon as Download,
    InfoIcon as Info,
    MoonStarsIcon as Moon,
    PaletteIcon as Palette,
    ShieldCheckIcon as ShieldCheck,
    TrashIcon as Trash2,
    UploadSimpleIcon as Upload,
    XIcon as X
} from "phosphor-react-native";
import { useEffect, useState } from "react";
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    Share,
    Switch,
    Text,
    TextInput,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cardShadow } from "../../components/glass-card";
import { ACCENT_COLORS } from "../../constants/tasks";
import { useTodos } from "../../hooks/use-todos";
import {
    ensureCalendarPermission,
    getDeviceCalendars,
    isCalendarSupported,
    type DeviceCalendar,
} from "../../lib/calendar";
import { requestNotificationPermission } from "../../lib/notifications";
import type { Todo } from "../../types/todo";

const SettingItem = ({
  icon: Icon,
  title,
  value,
  onPress,
  type = "link",
  color = "#94a3b8",
  accent = "#3b82f6",
}: any) => (
  <Pressable
    onPress={onPress}
    className="flex-row items-center bg-white/80 dark:bg-zinc-800/50 p-4 rounded-2xl mb-3 active:opacity-70 border border-zinc-200 dark:border-zinc-700/50"
    style={cardShadow}
  >
    <View className="p-2 rounded-xl bg-white dark:bg-zinc-800 shadow-sm">
      <Icon size={22} color={color} weight="duotone" />
    </View>
    <Text className="flex-1 ml-4 text-lg font-medium dark:text-white">
      {title}
    </Text>
    {type === "toggle" ? (
      <Switch
        value={value}
        onValueChange={onPress}
        trackColor={{ false: "#e2e8f0", true: accent }}
      />
    ) : (
      <ChevronRight size={20} color="#94a3b8" />
    )}
  </Pressable>
);

export default function SettingsScreen() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const {
    todos,
    settings,
    updateSettings,
    importData,
    clearAll,
    syncFromCalendar,
  } = useTodos();
  const [importVisible, setImportVisible] = useState(false);
  const [importText, setImportText] = useState("");
  const [deviceCalendars, setDeviceCalendars] = useState<DeviceCalendar[]>(
    [],
  );

  // Liste les calendriers du téléphone quand la sync est active
  useEffect(() => {
    if (!settings.calendarSyncEnabled || !isCalendarSupported) return;
    getDeviceCalendars()
      .then(setDeviceCalendars)
      .catch(() => setDeviceCalendars([]));
  }, [settings.calendarSyncEnabled]);

  const handleCalendarToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await ensureCalendarPermission();
      if (!granted) {
        Alert.alert(
          "Accès calendrier refusé",
          "Autorisez l'accès au calendrier dans les réglages de votre téléphone pour synchroniser vos événements.",
        );
        return;
      }
      updateSettings({ calendarSyncEnabled: true });
      syncFromCalendar();
    } else {
      updateSettings({ calendarSyncEnabled: false });
    }
  };

  const toggleCalendarVisible = (id: string) => {
    const hidden = new Set(settings.hiddenCalendarIds);
    if (hidden.has(id)) {
      hidden.delete(id);
    } else {
      hidden.add(id);
    }
    updateSettings({ hiddenCalendarIds: [...hidden] });
  };

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
            await clearAll();
            router.replace("/");
            Alert.alert("Terminé", "L'application a été réinitialisée.");
          },
        },
      ],
    );
  };

  const handleNotificationsToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          "Notifications refusées",
          "Autorisez les notifications dans les réglages de votre téléphone pour recevoir les rappels.",
        );
        return;
      }
    }
    updateSettings({ notificationsEnabled: enabled });
  };

  const handleExport = async () => {
    try {
      const payload = JSON.stringify(
        { app: "todolist", version: 1, todos, settings },
        null,
        2,
      );
      await Share.share({ message: payload });
    } catch {
      // partage annulé
    }
  };

  const handleImport = async () => {
    try {
      const parsed = JSON.parse(importText);
      const incoming: Todo[] = Array.isArray(parsed)
        ? parsed
        : parsed.todos;
      if (!Array.isArray(incoming)) throw new Error("format");
      await importData(incoming, parsed.settings);
      setImportVisible(false);
      setImportText("");
      Alert.alert(
        "Import réussi",
        `${incoming.length} tâche(s) importée(s).`,
      );
    } catch {
      Alert.alert(
        "Import impossible",
        "Le texte collé n'est pas une sauvegarde valide.",
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-900">
      <ScrollView className="flex-1 px-6">
        {/* Header */}
        <View className="py-8">
          <Text className="text-4xl font-black dark:text-white">Réglages</Text>
          <Text className="text-gray-500 font-mono">Version 2.0.0</Text>
        </View>

        {/* Personnalisation */}
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
            accent={settings.accent}
          />
          <View
            className="bg-white/80 dark:bg-zinc-800/50 p-4 rounded-2xl mb-3 border border-zinc-200 dark:border-zinc-700/50"
            style={cardShadow}
          >
            <View className="flex-row items-center mb-3">
              <View className="p-2 rounded-xl bg-white dark:bg-zinc-800 shadow-sm">
                <Palette size={22} color={settings.accent} />
              </View>
              <Text className="flex-1 ml-4 text-lg font-medium dark:text-white">
                Couleur d’accent
              </Text>
            </View>
            <View className="flex-row flex-wrap">
              {ACCENT_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => updateSettings({ accent: c })}
                  className="w-10 h-10 rounded-full mr-3 items-center justify-center active:scale-90"
                  style={{ backgroundColor: c }}
                >
                  {settings.accent === c && (
                    <View className="w-3.5 h-3.5 rounded-full bg-white" />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Rappels */}
        <View className="mb-8">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">
            Rappels
          </Text>
          <SettingItem
            icon={Bell}
            title="Notifications"
            type="toggle"
            value={settings.notificationsEnabled}
            onPress={handleNotificationsToggle}
            color="#f59e0b"
            accent={settings.accent}
          />
        </View>

        {/* Calendrier */}
        {isCalendarSupported && (
          <View className="mb-8">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">
              Calendrier
            </Text>
            <SettingItem
              icon={CalendarIcon}
              title="Synchroniser le calendrier"
              type="toggle"
              value={settings.calendarSyncEnabled}
              onPress={handleCalendarToggle}
              color="#06b6d4"
              accent={settings.accent}
            />
            {settings.calendarSyncEnabled && (
              <View
                className="bg-white/80 dark:bg-zinc-800/50 p-4 rounded-2xl mb-3 border border-zinc-200 dark:border-zinc-700/50"
                style={cardShadow}
              >
                <Text className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-3">
                  Calendriers affichés dans la timeline
                </Text>
                {deviceCalendars.length === 0 ? (
                  <Text className="text-sm text-zinc-400">
                    Aucun calendrier trouvé ou accès non autorisé.
                  </Text>
                ) : (
                  <View className="flex-row flex-wrap gap-2">
                    {deviceCalendars.map((cal) => {
                      const hiddenIds = settings.hiddenCalendarIds;
                      const visible = !hiddenIds.includes(cal.id);
                      return (
                        <Pressable
                          key={cal.id}
                          onPress={() => toggleCalendarVisible(cal.id)}
                          className="flex-row items-center px-3 py-2 rounded-full border active:opacity-70"
                          style={{
                            borderColor: visible
                              ? cal.color + "88"
                              : "#d4d4d8",
                            backgroundColor: visible
                              ? cal.color + "1a"
                              : "transparent",
                            opacity: visible ? 1 : 0.5,
                          }}
                        >
                          <View
                            className="w-2.5 h-2.5 rounded-full mr-2"
                            style={{ backgroundColor: cal.color }}
                          />
                          <Text
                            className="text-sm font-medium dark:text-zinc-200"
                            numberOfLines={1}
                          >
                            {cal.title}
                            {cal.sourceName ? ` · ${cal.sourceName}` : ""}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Sauvegarde */}
        <View className="mb-8">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">
            Sauvegarde locale
          </Text>
          <SettingItem
            icon={Download}
            title="Exporter mes données"
            onPress={handleExport}
            color="#22c55e"
          />
          <SettingItem
            icon={Upload}
            title="Importer une sauvegarde"
            onPress={() => setImportVisible(true)}
            color="#3b82f6"
          />
        </View>

        {/* À propos */}
        <View className="mb-8">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">
            À propos
          </Text>
          <SettingItem
            icon={Code2}
            title="Voir le code source"
            onPress={() => router.push("https://github.com/yvankraft/toDoList")}
          />
          <SettingItem
            icon={ShieldCheck}
            title="Confidentialité"
            onPress={() => router.push("../privacy")}
          />
          <SettingItem
            icon={Info}
            title="Crédits"
            onPress={() =>
              Alert.alert("Crédits", "Développé avec ❤️ par Wildis")
            }
          />
        </View>

        {/* Zone de danger */}
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

      {/* Modal d'import */}
      <Modal
        animationType="fade"
        transparent
        visible={importVisible}
        onRequestClose={() => setImportVisible(false)}
      >
        <View className="flex-1 justify-center bg-black/60 px-6">
          <View className="bg-white dark:bg-zinc-900 rounded-3xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-black dark:text-white">
                Importer une sauvegarde
              </Text>
              <Pressable
                onPress={() => setImportVisible(false)}
                className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full"
              >
                <X size={18} color="#94a3b8" />
              </Pressable>
            </View>
            <Text className="text-sm text-zinc-500 mb-3">
              Collez le JSON exporté précédemment. ⚠️ Cela remplace vos
              données actuelles.
            </Text>
            <TextInput
              placeholder='{"todos": [...]}'
              placeholderTextColor="#64748b"
              className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-2xl dark:text-white border border-gray-100 dark:border-zinc-700 h-32 mb-4"
              multiline
              textAlignVertical="top"
              autoCapitalize="none"
              autoCorrect={false}
              value={importText}
              onChangeText={setImportText}
            />
            <Pressable
              onPress={handleImport}
              className="p-4 rounded-2xl items-center active:scale-95"
              style={{ backgroundColor: settings.accent }}
            >
              <Text className="text-white font-extrabold">Importer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
