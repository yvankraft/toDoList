import { useColorScheme } from "nativewind";
import {
    BatteryFullIcon,
    BatteryLowIcon,
    BatteryMediumIcon,
    BellIcon,
    CheckCircleIcon,
    CircleIcon,
    RepeatIcon,
    TrashIcon,
} from "phosphor-react-native";
import { Pressable, Text, View } from "react-native";
import { cardShadow } from "../components/glass-card";
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
  low: BatteryLowIcon,
  medium: BatteryMediumIcon,
  high: BatteryFullIcon,
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
          : "bg-white/80 border-zinc-100"
      }`}
      style={cardShadow}
    >
      {/* Toggle */}
      <Pressable
        onPress={() => onToggle(todo.id)}
        className="active:scale-90 transition-all"
        hitSlop={8}
      >
        {todo.isCompleted ? (
          <CheckCircleIcon size={24} color="#22c55e" weight="fill" />
        ) : (
          <CircleIcon
            size={24}
            color={isDark ? "#52525b" : "#d4d4d8"}
            weight="regular"
          />
        )}
      </Pressable>

      {/* Icône colorée */}
      <View
        className="w-10 h-10 rounded-2xl items-center justify-center ml-3"
        style={{ backgroundColor: todo.color + "22" }}
      >
        <Icon size={20} color={todo.color} weight="duotone" />
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
            <RepeatIcon size={12} color={todo.color} weight="duotone" />
          )}
          {todo.reminderMinutes != null && todo.startTime && (
            <BellIcon size={12} color={todo.color} weight="duotone" />
          )}
          {EnergyIcon && (
            <EnergyIcon size={14} color={todo.color} weight="duotone" />
          )}
        </View>
      </Pressable>

      {/* Supprimer */}
      <Pressable
        onPress={() => onDelete(todo.id)}
        className="p-2 active:opacity-60 rounded-full"
        hitSlop={8}
      >
        <TrashIcon size={18} color="#ef4444" weight="duotone" />
      </Pressable>
    </View>
  );
}
