import { CheckCircle2, Circle, Pencil, Trash2 } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { Pressable, Text, View } from "react-native";
import { Todo } from "../types/todo";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (todo: Todo) => void;
}

export default function TodoItem({
  todo,
  onToggle,
  onDelete,
  onEdit,
}: TodoItemProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      className={`flex-row items-center p-4 mb-3 rounded-[24px] border ${
        isDark
          ? "bg-zinc-800/40 border-zinc-700/50"
          : "bg-white border-zinc-100 shadow-sm shadow-zinc-200"
      }`}
    >
      {/* Bouton de validation (Toggle) */}
      <Pressable
        onPress={() => onToggle(todo.id)}
        className="active:scale-90 transition-all"
      >
        {todo.isCompleted ? (
          <View className="bg-green-500/10 p-1 rounded-full">
            <CheckCircle2 size={22} color="#22c55e" strokeWidth={2.5} />
          </View>
        ) : (
          <Circle
            size={22}
            color={isDark ? "#52525b" : "#d4d4d8"}
            strokeWidth={2}
          />
        )}
      </Pressable>

      {/* Texte de la tâche */}
      <View className="flex-1 ml-3">
        <Text
          numberOfLines={1}
          className={`text-[17px] font-medium ${
            todo.isCompleted
              ? "line-through text-zinc-400 dark:text-zinc-500"
              : "text-zinc-900 dark:text-zinc-100"
          }`}
        >
          {todo.title}
        </Text>
      </View>

      {/* Actions */}
      <View className="flex-row items-center gap-1">
        {/* Bouton Modifier */}
        <Pressable
          onPress={() => onEdit(todo)}
          className="p-2 active:opacity-60 rounded-full"
        >
          <Pencil
            size={20}
            color={isDark ? "#a1a1aa" : "#71717a"}
            strokeWidth={2}
          />
        </Pressable>

        {/* Bouton Supprimer */}
        <Pressable
          onPress={() => onDelete(todo.id)}
          className="p-2 active:opacity-60 rounded-full"
        >
          <Trash2 size={20} color="#ef4444" strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}
