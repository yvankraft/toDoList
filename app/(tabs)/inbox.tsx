import { Inbox as InboxIcon, Search } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useMemo, useState } from "react";
import { FlatList, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTaskModal } from "../../hooks/use-task-modal";
import { useTodos } from "../../hooks/use-todos";
import type { Todo } from "../../types/todo";
import TodoItem from "../TodoItem";

export default function InboxScreen() {
  const { todos, deleteTodo, toggleTodo, settings } = useTodos();
  const openTaskModal = useTaskModal();
  const accent = settings.accent;
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [search, setSearch] = useState("");

  const iconColor = isDark ? "#94a3b8" : "#64748b";

  const inboxTodos = useMemo(
    () => todos.filter((t) => t.date === null),
    [todos],
  );

  // La recherche s'applique à TOUTES les tâches, avec badge de date
  const isSearching = search.trim().length > 0;
  const filtered = useMemo(() => {
    if (!isSearching) return inboxTodos;
    const q = search.toLowerCase();
    return todos.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.notes.toLowerCase().includes(q),
    );
  }, [isSearching, search, inboxTodos, todos]);

  const openEdit = (todo: Todo) => {
    openTaskModal({ editing: todo });
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#18181b]">
      <View className="flex-1 px-6">
        {/* Header */}
        <View className="mt-8 mb-6 flex-row items-center justify-between">
          <View>
            <Text className="text-4xl font-black text-zinc-900 dark:text-white">
              Inbox
            </Text>
            <Text className="text-lg font-medium text-zinc-400">
              {isSearching
                ? "Recherche dans toutes les tâches"
                : "Tâches non planifiées"}
            </Text>
          </View>
          <View
            className="px-3.5 py-1.5 rounded-full"
            style={{ backgroundColor: accent + "22" }}
          >
            <Text className="font-black text-lg" style={{ color: accent }}>
              {inboxTodos.filter((t) => !t.isCompleted).length}
            </Text>
          </View>
        </View>

        {/* Recherche */}
        <View className="flex-row items-center bg-zinc-100 dark:bg-zinc-800 px-4 py-1 rounded-2xl mb-6 border border-zinc-200 dark:border-zinc-700">
          <Search size={20} strokeWidth={2} color={iconColor} />
          <TextInput
            placeholder="Rechercher partout..."
            value={search}
            onChangeText={setSearch}
            className="flex-1 dark:text-white p-3 font-medium"
            autoCapitalize="none"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TodoItem
              todo={item}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
              onEdit={openEdit}
              showDate={isSearching}
            />
          )}
          contentContainerStyle={{ paddingBottom: 160 }}
          ListEmptyComponent={
            <View className="mt-20 items-center">
              <InboxIcon
                size={40}
                color={isDark ? "#3f3f46" : "#d4d4d8"}
                strokeWidth={1.5}
              />
              <Text className="text-zinc-400 font-medium text-center mt-4">
                {isSearching
                  ? "Aucun résultat pour cette recherche."
                  : "Inbox zéro, bravo !\nCapturez ici les idées à planifier plus tard."}
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}
