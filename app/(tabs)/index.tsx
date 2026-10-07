import {
    Calendar as CalendarIcon,
    Check,
    ChevronLeft,
    ChevronRight,
    Inbox
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    Text,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TASK_ICONS } from "../../constants/tasks";
import { useCalendarEvents } from "../../hooks/use-calendar-events";
import { useTaskModal, type TaskDefaults } from "../../hooks/use-task-modal";
import { useTodos } from "../../hooks/use-todos";
import {
    addDays,
    DAYS_SHORT,
    formatDayLabel,
    fromDateKey,
    minutesToTime,
    timeToMinutes,
    todayKey,
    weekDays
} from "../../lib/date";
import type { CalendarDayEvent, Todo } from "../../types/todo";

const HOUR_HEIGHT = 64;
const LABEL_WIDTH = 46;
const DAY_MINUTES = 24 * 60;

/** Un bloc positionnable sur la timeline : tâche de l'app ou événement natif */
type TimedBlock = {
  id: string;
  kind: "todo" | "event";
  start: number; // minutes dans la journée
  end: number;
  todo?: Todo;
  event?: CalendarDayEvent;
};

type PlacedBlock = TimedBlock & {
  top: number;
  height: number;
  leftPct: number;
  widthPct: number;
};

/** Répartit les blocs qui se chevauchent en colonnes */
const layoutTimedBlocks = (blocks: TimedBlock[]): PlacedBlock[] => {
  const sorted = [...blocks].sort(
    (a, b) => a.start - b.start || b.end - b.start - (a.end - a.start),
  );
  const result: PlacedBlock[] = [];
  let cluster: (TimedBlock & { col: number })[] = [];
  let clusterEnd = -1;

  const flush = () => {
    if (cluster.length === 0) return;
    const colEnds: number[] = [];
    for (const item of cluster) {
      let col = colEnds.findIndex((end) => end <= item.start);
      if (col === -1) {
        col = colEnds.length;
        colEnds.push(0);
      }
      colEnds[col] = item.end;
      item.col = col;
    }
    const n = colEnds.length;
    for (const item of cluster) {
      result.push({
        ...item,
        top: (item.start / 60) * HOUR_HEIGHT,
        height:
          ((Math.min(item.end, DAY_MINUTES) - item.start) / 60) *
          HOUR_HEIGHT,
        leftPct: (item.col / n) * 100,
        widthPct: 100 / n,
      });
    }
    cluster = [];
    clusterEnd = -1;
  };

  for (const block of sorted) {
    if (cluster.length > 0 && block.start >= clusterEnd) flush();
    cluster.push({ ...block, col: 0 });
    clusterEnd = Math.max(clusterEnd, block.end);
  }
  flush();
  return result;
};

/** Portion d'un événement (potentiellement multi-jours) visible ce jour-là */
const eventBlockForDay = (
  e: CalendarDayEvent,
  dayKey: string,
): TimedBlock | null => {
  const dayStart = fromDateKey(dayKey).getTime();
  const startMin = Math.max(
    0,
    Math.round((e.start.getTime() - dayStart) / 60_000),
  );
  const endMin = Math.min(
    DAY_MINUTES,
    Math.round((e.end.getTime() - dayStart) / 60_000),
  );
  if (endMin - startMin < 5) return null;
  return {
    id: `ev-${e.id}`,
    kind: "event",
    start: startMin,
    end: endMin,
    event: e,
  };
};

export default function TimelineScreen() {
  const { todos, toggleTodo, settings } = useTodos();
  const openTaskModal = useTaskModal();
  const accent = settings.accent;
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [selectedKey, setSelectedKey] = useState(todayKey());
  const [now, setNow] = useState(new Date());
  const scrollRef = useRef<ScrollView>(null);
  const didScrollRef = useRef(false);

  // Ligne "maintenant" mise à jour chaque minute
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const days = useMemo(() => weekDays(selectedKey), [selectedKey]);

  // Événements du calendrier natif pour la semaine affichée
  const eventsByDay = useCalendarEvents(days[0], days.length);
  const dayEvents = useMemo(
    () => eventsByDay.get(selectedKey) ?? [],
    [eventsByDay, selectedKey],
  );
  const timedEvents = useMemo(
    () => dayEvents.filter((e) => !e.allDay),
    [dayEvents],
  );
  const allDayEvents = useMemo(
    () => dayEvents.filter((e) => e.allDay),
    [dayEvents],
  );

  const dayTodos = useMemo(
    () => todos.filter((t) => t.date === selectedKey),
    [todos, selectedKey],
  );
  const allDay = useMemo(
    () => dayTodos.filter((t) => !t.startTime),
    [dayTodos],
  );
  const placed = useMemo(() => {
    const blocks: TimedBlock[] = [
      ...dayTodos
        .filter((t) => t.startTime)
        .map((todo) => {
          const start = timeToMinutes(todo.startTime!);
          return {
            id: todo.id,
            kind: "todo" as const,
            start,
            end: start + todo.duration,
            todo,
          };
        }),
      ...timedEvents
        .map((e) => eventBlockForDay(e, selectedKey))
        .filter((b): b is TimedBlock => b !== null),
    ];
    return layoutTimedBlocks(blocks);
  }, [dayTodos, timedEvents, selectedKey]);

  // Jours de la semaine affichés contenant des tâches ou des événements
  const busyDays = useMemo(() => {
    const s = new Set(todos.map((t) => t.date).filter(Boolean) as string[]);
    for (const [key, evts] of eventsByDay) {
      if (evts.length > 0) s.add(key);
    }
    return s;
  }, [todos, eventsByDay]);

  const doneCount = dayTodos.filter((t) => t.isCompleted).length;
  const progress =
    dayTodos.length > 0
      ? Math.round((doneCount / dayTodos.length) * 100)
      : 0;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const showNowLine = selectedKey === todayKey();

  // Scroll initial vers l'heure actuelle
  useEffect(() => {
    if (!didScrollRef.current && showNowLine) {
      didScrollRef.current = true;
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          y: Math.max(0, (nowMinutes - 90) * (HOUR_HEIGHT / 60)),
          animated: false,
        });
      }, 100);
    }
  }, [showNowLine, nowMinutes]);

  const openNewTask = (extra?: Partial<TaskDefaults>) => {
    openTaskModal({ defaults: { date: selectedKey, ...extra } });
  };

  const openEdit = (todo: Todo) => {
    openTaskModal({ editing: todo });
  };

  const goToday = () => setSelectedKey(todayKey());

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#18181b]">
      <View className="flex-1 px-5">
        {/* Header */}
        <View className="mt-6 mb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-3xl font-black text-zinc-900 dark:text-white">
              Timeline
            </Text>
            <Pressable onPress={goToday}>
              <Text className="text-base font-semibold" style={{ color: accent }}>
                {formatDayLabel(selectedKey)}
                {!showNowLine && "  ·  Revenir à aujourd'hui"}
              </Text>
            </Pressable>
          </View>
          <View
            className="px-3 py-1.5 rounded-full"
            style={{ backgroundColor: accent + "22" }}
          >
            <Text className="font-bold" style={{ color: accent }}>
              {doneCount}/{dayTodos.length} · {progress}%
            </Text>
          </View>
        </View>

        {/* Sélecteur de semaine */}
        <View className="flex-row items-center mb-4">
          <Pressable
            onPress={() => setSelectedKey(addDays(selectedKey, -7))}
            className="p-2 active:opacity-60"
            hitSlop={8}
          >
            <ChevronLeft size={20} color={isDark ? "#a1a1aa" : "#71717a"} />
          </Pressable>
          <View className="flex-1 flex-row justify-between">
            {days.map((key) => {
              const d = fromDateKey(key);
              const selected = key === selectedKey;
              const today = key === todayKey();
              return (
                <Pressable
                  key={key}
                  onPress={() => setSelectedKey(key)}
                  className="items-center py-1.5 px-1 rounded-2xl w-11"
                  style={selected ? { backgroundColor: accent } : undefined}
                >
                  <Text
                    className={`text-[10px] font-bold uppercase ${
                      selected
                        ? "text-white/80"
                        : "text-zinc-400 dark:text-zinc-500"
                    }`}
                  >
                    {DAYS_SHORT[d.getDay()]}
                  </Text>
                  <Text
                    className={`text-base font-black ${
                      selected
                        ? "text-white"
                        : today
                          ? ""
                          : "text-zinc-800 dark:text-zinc-200"
                    }`}
                    style={
                      !selected && today ? { color: accent } : undefined
                    }
                  >
                    {d.getDate()}
                  </Text>
                  <View
                    className="w-1 h-1 rounded-full mt-0.5"
                    style={{
                      backgroundColor:
                        busyDays.has(key) && !selected
                          ? accent
                          : "transparent",
                    }}
                  />
                </Pressable>
              );
            })}
          </View>
          <Pressable
            onPress={() => setSelectedKey(addDays(selectedKey, 7))}
            className="p-2 active:opacity-60"
            hitSlop={8}
          >
            <ChevronRight size={20} color={isDark ? "#a1a1aa" : "#71717a"} />
          </Pressable>
        </View>

        {/* Tâches "toute la journée" + événements calendrier */}
        {(allDay.length > 0 || allDayEvents.length > 0) && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-3"
            style={{ flexGrow: 0 }}
          >
            {allDayEvents.map((e) => (
              <Pressable
                key={`ev-${e.id}`}
                onPress={() =>
                  Alert.alert(
                    e.title,
                    `${e.calendarTitle}\nToute la journée`,
                  )
                }
                className="flex-row items-center px-3 py-2 rounded-2xl mr-2 border"
                style={{
                  backgroundColor: e.color + "1a",
                  borderColor: e.color + "44",
                }}
              >
                <CalendarIcon size={14} color={e.color} />
                <Text
                  className="ml-1.5 font-semibold text-sm"
                  style={{ color: e.color }}
                >
                  {e.title}
                </Text>
              </Pressable>
            ))}
            {allDay.map((todo) => {
              const Icon = TASK_ICONS[todo.icon] ?? TASK_ICONS.check;
              return (
                <Pressable
                  key={todo.id}
                  onPress={() => openEdit(todo)}
                  onLongPress={() => toggleTodo(todo.id)}
                  className="flex-row items-center px-3 py-2 rounded-2xl mr-2 border"
                  style={{
                    backgroundColor: todo.color + "1a",
                    borderColor: todo.color + "44",
                    opacity: todo.isCompleted ? 0.5 : 1,
                  }}
                >
                  <Icon size={14} color={todo.color} />
                  <Text
                    className={`ml-1.5 font-semibold text-sm ${
                      todo.isCompleted ? "line-through" : ""
                    }`}
                    style={{ color: todo.color }}
                  >
                    {todo.title}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Timeline */}
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 180 }}
        >
          <View style={{ height: HOUR_HEIGHT * 24, flexDirection: "row" }}>
            {/* Colonne des heures */}
            <View style={{ width: LABEL_WIDTH }}>
              {Array.from({ length: 24 }, (_, h) => (
                <View
                  key={h}
                  style={{ height: HOUR_HEIGHT }}
                  className="items-end pr-2"
                >
                  <Text className="text-[11px] font-semibold text-zinc-400 -translate-y-2">
                    {`${String(h).padStart(2, "0")}:00`}
                  </Text>
                </View>
              ))}
            </View>

            {/* Zone des blocs */}
            <View className="flex-1 relative">
              {/* Lignes horaires + zones de tap */}
              {Array.from({ length: 24 }, (_, h) => (
                <Pressable
                  key={h}
                  onPress={() =>
                    openNewTask({
                      startTime: `${String(h).padStart(2, "0")}:00`,
                    })
                  }
                  style={{ height: HOUR_HEIGHT }}
                  className="border-t border-zinc-100 dark:border-zinc-800/60 active:bg-zinc-50 dark:active:bg-zinc-800/30"
                />
              ))}

              {/* Ligne "maintenant" */}
              {showNowLine && (
                <View
                  className="absolute left-0 right-0 flex-row items-center z-10"
                  style={{ top: (nowMinutes / 60) * HOUR_HEIGHT }}
                  pointerEvents="none"
                >
                  <View
                    className="w-2 h-2 rounded-full -ml-1"
                    style={{ backgroundColor: "#ef4444" }}
                  />
                  <View
                    className="flex-1 h-[2px]"
                    style={{ backgroundColor: "#ef4444" }}
                  />
                </View>
              )}

              {/* Blocs de tâches et d'événements calendrier */}
              {placed.map((block) => {
                const { top, height, leftPct, widthPct } = block;
                const compact = height < 44;

                // Événement du calendrier natif (lecture seule)
                if (block.kind === "event" && block.event) {
                  const e = block.event;
                  return (
                    <Pressable
                      key={block.id}
                      onPress={() =>
                        Alert.alert(
                          e.title,
                          `${e.calendarTitle}\n${minutesToTime(
                            e.start.getHours() * 60 + e.start.getMinutes(),
                          )} → ${minutesToTime(
                            e.end.getHours() * 60 + e.end.getMinutes(),
                          )}${e.notes ? `\n\n${e.notes}` : ""}`,
                        )
                      }
                      className="absolute rounded-xl overflow-hidden"
                      style={{
                        top,
                        height: Math.max(height - 2, 22),
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        backgroundColor:
                          e.color + (isDark ? "26" : "14"),
                        borderLeftWidth: 3,
                        borderLeftColor: e.color,
                        borderWidth: 1,
                        borderColor: e.color + "33",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}
                    >
                      <View className="flex-row items-center gap-1">
                        <CalendarIcon
                          size={compact ? 11 : 13}
                          color={e.color}
                          strokeWidth={2.5}
                        />
                        <Text
                          numberOfLines={1}
                          className="flex-1 font-semibold"
                          style={{
                            color: e.color,
                            fontSize: compact ? 11 : 13,
                          }}
                        >
                          {e.title}
                        </Text>
                      </View>
                      {!compact && (
                        <Text
                          className="text-[10px] font-medium"
                          style={{ color: e.color + "bb" }}
                          numberOfLines={1}
                        >
                          {e.calendarTitle}
                        </Text>
                      )}
                    </Pressable>
                  );
                }

                const todo = block.todo!;
                const Icon = TASK_ICONS[todo.icon] ?? TASK_ICONS.check;
                return (
                  <Pressable
                    key={todo.id}
                    onPress={() => openEdit(todo)}
                    onLongPress={() => toggleTodo(todo.id)}
                    className="absolute rounded-xl overflow-hidden"
                    style={{
                      top,
                      height: Math.max(height - 2, 22),
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      backgroundColor: todo.color + (isDark ? "33" : "1f"),
                      borderLeftWidth: 3,
                      borderLeftColor: todo.color,
                      opacity: todo.isCompleted ? 0.45 : 1,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                    }}
                  >
                    <View className="flex-row items-center gap-1">
                      <Icon
                        size={compact ? 11 : 13}
                        color={todo.color}
                        strokeWidth={2.5}
                      />
                      <Text
                        numberOfLines={1}
                        className={`flex-1 font-bold ${
                          todo.isCompleted ? "line-through" : ""
                        }`}
                        style={{
                          color: todo.color,
                          fontSize: compact ? 11 : 13,
                        }}
                      >
                        {todo.title}
                      </Text>
                      <Pressable
                        onPress={() => toggleTodo(todo.id)}
                        hitSlop={6}
                        className="w-5 h-5 rounded-full items-center justify-center border-2 active:scale-90"
                        style={{
                          borderColor: todo.color,
                          backgroundColor: todo.isCompleted
                            ? todo.color
                            : "transparent",
                        }}
                      >
                        {todo.isCompleted && (
                          <Check size={11} color="#fff" strokeWidth={4} />
                        )}
                      </Pressable>
                    </View>
                    {!compact && (
                      <Text
                        className="text-[10px] font-medium"
                        style={{ color: todo.color + "cc" }}
                      >
                        {todo.startTime}
                        {"  ·  "}
                        {todo.duration}min
                        {todo.subtasks.length > 0 &&
                          `  ·  ${todo.subtasks.filter((s) => s.isCompleted).length}/${todo.subtasks.length}`}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Empty state */}
          {dayTodos.length === 0 && dayEvents.length === 0 && (
            <View className="items-center mt-6">
              <Inbox size={32} color={isDark ? "#3f3f46" : "#d4d4d8"} />
              <Text className="text-zinc-400 font-medium text-center mt-3">
                Rien de prévu.{"\n"}Touchez une heure ou le + pour planifier.
              </Text>
            </View>
          )}
        </ScrollView>

      </View>
    </SafeAreaView>
  );
}
