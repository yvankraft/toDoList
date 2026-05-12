import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { X } from "lucide-react-native";

export type Todo = {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: number;
};

interface AddTaskModalProps {
  isVisible: boolean;
  onClose: () => void;
  onAdd: (title: string) => void;
  initialData?: Todo | null;
}

export const AddTaskModal = ({
  isVisible,
  onClose,
  onAdd,
  initialData,
}: AddTaskModalProps) => {
  const [taskTitle, setTaskTitle] = useState("");

  // On remplit le champ si on reçoit des données à modifier
  useEffect(() => {
    if (initialData) {
      setTaskTitle(initialData.title);
    } else {
      setTaskTitle("");
    }
  }, [initialData, isVisible]);

  const handleAdd = () => {
    if (taskTitle.trim().length > 0) {
      onAdd(taskTitle);
      setTaskTitle("");
      onClose();
    }
  };

  return (
    <Modal
      animationType="fade" // "fade" pour l'overlay, le contenu montera avec le KeyboardAvoidingView
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      {/* Overlay assombri (marche en light et dark) */}
      <View className="flex-1 justify-end bg-black/60">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          // Couleurs de fond pour Light et Dark
          className="bg-white dark:bg-zinc-900 rounded-t-[35px] p-8 pb-12 shadow-2xl"
        >
          {/* Header de la Modale */}
          <View className="flex-row justify-between items-center mb-8">
            <Text className="text-2xl font-black text-gray-900 dark:text-slate-50">
              {initialData ? "Modifier la tâche" : "Nouvelle tâche"}
            </Text>
            <Pressable
              onPress={onClose}
              className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full active:opacity-70"
            >
              {/* Couleur de l'icône adaptable */}
              <X size={20} color="#94a3b8" />
            </Pressable>
          </View>

          {/* Champ de saisie */}
          <View>
            <Text className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-2 ml-1">
              Titre de la mission
            </Text>
            <TextInput
              placeholder="Ex: Acheter du pain..."
              placeholderTextColor="#64748b"
              className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-2xl text-lg dark:text-white border border-gray-100 dark:border-zinc-700 focus:border-gray-500"
              autoFocus={true}
              value={taskTitle}
              onChangeText={setTaskTitle}
              selectionColor="#3b82f6" // Couleur du curseur
            />
          </View>

          {/* Bouton de validation */}
          <Pressable
            onPress={handleAdd}
            className="bg-gray-900 dark:bg-white  mt-8 p-4 rounded-2xl items-center shadow-lg active:scale-95 transition-all mb-4"
          >
            <Text className="text-white dark:text-gray-500 font-extrabold text-lg">
              {initialData ? "Enregistrer" : "Créer la tâche"}
            </Text>
          </Pressable>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};
