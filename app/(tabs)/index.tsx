import React, { useState, useEffect } from "react";
import { Search, Plus } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import {
  Platform,
  Pressable,
  FlatList,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AddTaskModal } from "../modal";
import { TodoItem } from "../components/TodoItem";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

export type Todo = {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: number;
};

const STORAGE_KEY = "@my_todo_list";

export default function ComponentName() {
  const [search, setSearch] = useState("");
  const { colorScheme } = useColorScheme();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [todoToEdit, setTodoToEdit] = useState<Todo | null>(null);

  useFocusEffect(
    useCallback(() => {
      const loadTodos = async () => {
        const storedTodos = await AsyncStorage.getItem(STORAGE_KEY);
        setTodos(storedTodos ? JSON.parse(storedTodos) : []);
      };
      loadTodos();
    }, []),
  );

  useEffect(() => {
    const loadTodos = async () => {
      try {
        const storedTodos = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedTodos) setTodos(JSON.parse(storedTodos));
      } catch (e) {
        console.error("Erreur de chargement", e);
      }
    };
    loadTodos();
  }, []);

  const saveAndSetTodos = async (newTodos: Todo[]) => {
    setTodos(newTodos);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTodos));
    } catch (e) {
      console.error("Erreur de sauvegarde", e);
    }
  };

  const handleSaveTask = (title: string) => {
    if (todoToEdit) {
      const updatedTodos = todos.map((t) =>
        t.id === todoToEdit.id ? { ...t, title: title } : t,
      );
      saveAndSetTodos(updatedTodos);
      setTodoToEdit(null);
    } else {
      const newTodo: Todo = {
        id: Date.now().toString(),
        title,
        isCompleted: false,
        createdAt: Date.now(),
      };
      saveAndSetTodos([newTodo, ...todos]);
    }
  };

  const toggleTodo = (id: string) => {
    const updated = todos.map((t) =>
      t.id === id ? { ...t, isCompleted: !t.isCompleted } : t,
    );
    saveAndSetTodos(updated);
  };

  const deleteTodo = (id: string) => {
    const updated = todos.filter((t) => t.id !== id);
    saveAndSetTodos(updated);
  };

  const handleEditPress = (todo: Todo) => {
    setTodoToEdit(todo);
    setIsModalVisible(true);
  };

  const filteredTodos = todos.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()),
  );

  const iconColor = colorScheme === "dark" ? "#94a3b8" : "#64748b";
  const inverColor = colorScheme === "dark" ? "#18181b" : "#FFFFFF";

  const completedCount = todos.filter((t) => t.isCompleted).length;
  const totalCount = todos.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#18181b]">
      <View className="flex-1 px-6">
        {/* Header Section */}
        <View className="mt-8 mb-6">
          <Text className="text-4xl font-black text-zinc-900 dark:text-white">
            Mes Tâches
          </Text>
          <Text className="text-xl font-medium text-zinc-400 mb-6">
            Soyons productifs !
          </Text>

          {/* Stats & Progress */}
          <View className="bg-zinc-50 dark:bg-zinc-800/50 p-5 rounded-[28px]">
            <View className="flex-row justify-between items-center mb-3">
              <View>
                <Text className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-[10px]">
                  Progression
                </Text>
                <Text className="text-zinc-900 dark:text-white font-bold text-lg">
                  {completedCount}{" "}
                  <Text className="text-zinc-400">/ {totalCount}</Text>
                </Text>
              </View>
              <View className="bg-blue-500 px-3 py-1 rounded-full">
                <Text className="text-white font-bold text-sm">
                  {Math.round(progress)}%
                </Text>
              </View>
            </View>

            {/* Progress Bar Progressive */}
            <View className="h-2 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <View
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </View>
          </View>
        </View>

        {/* Search Bar - Plus fine et élégante */}
        <View className="flex-row items-center bg-zinc-100 dark:bg-zinc-800 px-4 py-1 rounded-2xl mb-6 border border-zinc-200 dark:border-zinc-700">
          <Search size={20} strokeWidth={2} color={iconColor} />
          <TextInput
            placeholder="Rechercher une tâche..."
            value={search}
            onChangeText={setSearch}
            className="flex-1 dark:text-white p-3 font-medium"
            autoCapitalize="none"
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* List Section */}
        <FlatList
          data={filteredTodos}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TodoItem
              todo={item}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
              onEdit={handleEditPress}
            />
          )}
          contentContainerStyle={{ paddingBottom: 160 }}
          ListEmptyComponent={
            <View className="mt-20 items-center">
              <Text className="text-zinc-400 font-medium text-center">
                {search
                  ? "Aucun résultat trouvé pour cette recherche."
                  : "Votre liste est vide.\nCommencez par ajouter une tâche !"}
              </Text>
            </View>
          }
        />

        {/* Floating Action Button (FAB) */}
        <View className="absolute bottom-20 right-6 shadow-2xl shadow-blue-500/50">
          <Pressable
            onPress={() => setIsModalVisible(true)}
            className="bg-zinc-900 dark:bg-white w-16 h-16 rounded-full items-center justify-center active:scale-90 transition-all"
          >
            <Plus size={32} color={inverColor} strokeWidth={3} />
          </Pressable>
        </View>

        <AddTaskModal
          isVisible={isModalVisible}
          initialData={todoToEdit}
          onAdd={handleSaveTask}
          onClose={() => {
            setIsModalVisible(false);
            setTodoToEdit(null);
          }}
        />
      </View>
    </SafeAreaView>
  );
}
