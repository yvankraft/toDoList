import { useColorScheme } from "nativewind";
import {
    CalendarCheckIcon,
    FireIcon,
    ListChecksIcon,
    TimerIcon,
} from "phosphor-react-native";
import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { cardShadow } from "../../components/glass-card";
import { useTodos } from "../../hooks/use-todos";
import {
    addDays,
    DAYS_SHORT,
    formatDuration,
    fromDateKey,
    toDateKey,
    todayKey,
} from "../../lib/date";

const ProgressRing = ({
  progress,
  accent,
  size = 60,
}: {
  progress: number;
  accent: string;
  size?: number;
}) => {
  const { colorScheme } = useColorScheme();
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={colorScheme === "dark" ? "#3f3f46" : "#e4e4e7"}
        strokeWidth={stroke}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={accent}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${c} ${c}`}
        strokeDashoffset={c * (1 - Math.min(progress, 1))}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  progress,
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string;
  accent: string;
  /** 0-1 : affiche un anneau de progression à la place du texte */
  progress?: number;
}) => (
  <View
    className="flex-1 bg-white/80 dark:bg-zinc-800/50 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-700/50"
    style={cardShadow}
  >
    <View
      className="w-9 h-9 rounded-xl items-center justify-center mb-3"
      style={{ backgroundColor: accent + "22" }}
    >
      <Icon size={18} color={accent} weight="duotone" />
    </View>
    {progress !== undefined ? (
      <View style={{ width: 60, height: 60 }}>
        <ProgressRing progress={progress} accent={accent} />
        <View className="absolute inset-0 items-center justify-center">
          <Text className="font-black text-[15px] text-zinc-900 dark:text-white">
            {value}
          </Text>
        </View>
      </View>
    ) : (
      <Text className="text-2xl font-black text-zinc-900 dark:text-white">
        {value}
      </Text>
    )}
    <Text className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mt-0.5">
      {label}
    </Text>
    {sub && (
      <Text className="text-xs text-zinc-400 mt-1 font-medium">{sub}</Text>
    )}
  </View>
);

export default function StatsScreen() {
  const { todos, settings } = useTodos();
  const accent = settings.accent;
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const stats = useMemo(() => {
    // Comptage des complétions par jour
    const byDay = new Map<string, number>();
    let completedTotal = 0;
    for (const t of todos) {
      if (t.isCompleted) completedTotal++;
      if (t.completedAt) {
        const key = toDateKey(new Date(t.completedAt));
        byDay.set(key, (byDay.get(key) ?? 0) + 1);
      }
    }

    // Streak : jours consécutifs avec >= 1 complétion
    let streak = 0;
    let cursor = todayKey();
    if (!(byDay.get(cursor) ?? 0)) cursor = addDays(cursor, -1); // tolère un jour "en cours"
    while ((byDay.get(cursor) ?? 0) > 0) {
      streak++;
      cursor = addDays(cursor, -1);
    }

    const today = todayKey();
    const todayTasks = todos.filter((t) => t.date === today);
    const scheduledMin = todayTasks
      .filter((t) => !t.isCompleted)
      .reduce((s, t) => s + t.duration, 0);

    // 7 derniers jours pour le graphe
    const week = Array.from({ length: 7 }, (_, i) => {
      const key = addDays(today, i - 6);
      return { key, count: byDay.get(key) ?? 0 };
    });

    return {
      byDay,
      week,
      streak,
      completedTotal,
      total: todos.length,
      doneToday: todayTasks.filter((t) => t.isCompleted).length,
      scheduledMin,
    };
  }, [todos]);

  const maxCount = Math.max(...stats.week.map((d) => d.count), 1);
  const rate =
    stats.total > 0 ? Math.round((stats.completedTotal / stats.total) * 100) : 0;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#18181b]">
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        <View className="mt-8 mb-6">
          <Text className="text-4xl font-black text-zinc-900 dark:text-white">
            Statistiques
          </Text>
          <Text className="text-lg font-medium text-zinc-400">
            Ta productivité en un clin d’œil
          </Text>
        </View>

        {/* Cartes */}
        <View className="flex-row gap-3 mb-3">
          <StatCard
            icon={FireIcon}
            label="Streak"
            value={`${stats.streak}`}
            sub={stats.streak > 1 ? "jours de suite" : "jour"}
            accent={accent}
          />
          <StatCard
            icon={CalendarCheckIcon}
            label="Aujourd'hui"
            value={`${stats.doneToday}`}
            sub="tâches faites"
            accent={accent}
          />
        </View>
        <View className="flex-row gap-3 mb-3">
          <StatCard
            icon={ListChecksIcon}
            label="Complétion"
            value={`${rate}%`}
            sub={`${stats.completedTotal}/${stats.total} tâches`}
            accent={accent}
            progress={rate / 100}
          />
          <StatCard
            icon={TimerIcon}
            label="À faire"
            value={formatDuration(stats.scheduledMin)}
            sub="planifiées aujourd'hui"
            accent={accent}
          />
        </View>

        {/* Graphe 7 jours */}
        <View
          className="bg-white/80 dark:bg-zinc-800/50 p-5 rounded-3xl border border-zinc-100 dark:border-zinc-700/50 mt-3"
          style={cardShadow}
        >
          <Text className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-4">
            Tâches complétées · 7 derniers jours
          </Text>
          <View className="flex-row items-end justify-between h-32">
            {stats.week.map(({ key, count }) => {
              const d = fromDateKey(key);
              const isToday = key === todayKey();
              return (
                <View key={key} className="items-center flex-1">
                  <Text
                    className="text-[10px] font-bold mb-1"
                    style={{ color: count > 0 ? accent : "#a1a1aa" }}
                  >
                    {count > 0 ? count : ""}
                  </Text>
                  <View
                    className="w-6 rounded-lg"
                    style={{
                      height: Math.max((count / maxCount) * 80, 6),
                      backgroundColor:
                        count > 0
                          ? accent
                          : isDark
                            ? "#3f3f46"
                            : "#e4e4e7",
                      opacity: isToday ? 1 : 0.75,
                    }}
                  />
                  <Text
                    className={`text-[10px] font-bold mt-1.5 uppercase ${
                      isToday
                        ? ""
                        : "text-zinc-400 dark:text-zinc-500"
                    }`}
                    style={isToday ? { color: accent } : undefined}
                  >
                    {DAYS_SHORT[d.getDay()]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Message motivant */}
        <View
          className="mt-4 p-5 rounded-3xl"
          style={{ backgroundColor: accent + "15" }}
        >
          <Text
            className="font-bold text-base text-center"
            style={{ color: accent }}
          >
            {stats.streak >= 3
              ? "En feu ! Continue comme ça."
              : stats.doneToday > 0
                ? "Beau travail aujourd'hui."
                : "Une petite tâche pour lancer la journée ?"}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
