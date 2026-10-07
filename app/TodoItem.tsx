import {
    BatteryFull,
    BatteryLow,
    BatteryMedium,
    Bell,
    CheckCircle2,
    Circle,
    Repeat,
    Trash2,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { Pressable, Text, View } from "react-native";
import { TASK_ICONS } from "../constants/tasks";
import { formatDayLabel, formatDuration, taskTimeRange } from "../lib/date";
import type { Todo } from "../types/todo";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (todo: Todo) => void;
  /** Affiche le badge de date (utile dans Inbox/recherche) */
  showDate?: boolean;
}

const ENERGY_ICONS = {
  low: BatteryLow,
  medium: BatteryMedium,
  high: BatteryFull,
};

export default function TodoItem({
  todo,
  onToggle,
  onDelete,
  onEdit,
  showDate = false,
}: TodoItemProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const Icon = TASK_ICONS[todo.icon] ?? TASK_ICONS.check;

  const doneSubtasks = todo.subtasks.filter((s) => s.isCompleted).length;
  const EnergyIcon = todo.energy ? ENERGY_ICONS[todo.energy] : null;

  // Méta : "09:00 → 10:30 · 1h30 · 2/5" etc.
  const meta: string[] = [];
  if (showDate) {
    meta.push(todo.date ? formatDayLabel(todo.date) : "Inbox");
  }
  if (todo.startTime) {
    meta.push(taskTimeRange(todo.startTime, todo.duration));
  } else {
    meta.push(formatDuration(todo.duration));
  }
  if (todo.subtasks.length > 0) {
    meta.push(`${doneSubtasks}/${todo.subtasks.length}`);
  }

  return (
    <View
      className={`flex-row items-center p-4 mb-3 rounded-[24px] border ${
        isDark
          ? "bg-zinc-800/40 border-zinc-700/50"
          : "bg-white border-zinc-100 shadow-sm shadow-zinc-200"
      }`}
    >
      {/* Toggle */}
      <Pressable
        onPress={() => onToggle(todo.id)}
        className="active:scale-90 transition-all"
        hitSlop={8}
      >
        {todo.isCompleted ? (
          <CheckCircle2 size={24} color="#22c55e" strokeWidth={2.5} />
        ) : (
          <Circle
            size={24}
            color={isDark ? "#52525b" : "#d4d4d8"}
            strokeWidth={2}
          />
        )}
      </Pressable>

      {/* Icône colorée */}
      <View
        className="w-10 h-10 rounded-2xl items-center justify-center ml-3"
        style={{ backgroundColor: todo.color + "22" }}
      >
        <Icon size={20} color={todo.color} strokeWidth={2.2} />
      </View>

      {/* Titre + méta */}
      <Pressable
        onPress={() => onEdit(todo)}
        className="flex-1 ml-3 active:opacity-60"
      >
        <Text
          numberOfLines={1}
          className={`text-[16px] font-semibold ${
            todo.isCompleted
              ? "line-through text-zinc-400 dark:text-zinc-500"
              : "text-zinc-900 dark:text-zinc-100"
          }`}
        >
          {todo.title}
        </Text>
        <View className="flex-row items-center mt-0.5 gap-2">
          <Text numberOfLines={1} className="text-[12px] text-zinc-400">
            {meta.join("  ·  ")}
          </Text>
          {todo.recurrence !== "none" && (
            <Repeat size={12} color={todo.color} />
          )}
          {todo.reminderMinutes != null && todo.startTime && (
            <Bell size={12} color={todo.color} />
          )}
          {EnergyIcon && <EnergyIcon size={14} color={todo.color} />}
        </View>
      </Pressable>

      {/* Supprimer */}
      <Pressable
        onPress={() => onDelete(todo.id)}
        className="p-2 active:opacity-60 rounded-full"
        hitSlop={8}
      >
        <Trash2 size={18} color="#ef4444" strokeWidth={2} />
      </Pressable>
    </View>
  );
}
