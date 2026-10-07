import React, { createContext, useCallback, useContext, useState } from "react";
import { AddTaskModal, type TaskDefaults } from "../app/modal";
import type { Todo, TodoDraft } from "../types/todo";
import { useTodos } from "./use-todos";

export type { TaskDefaults } from "../app/modal";

type OpenOptions = {
  editing?: Todo | null;
  defaults?: TaskDefaults;
};

const TaskModalContext = createContext<(opts?: OpenOptions) => void>(() => {});

/** Ouvre l'éditeur de tâche global depuis n'importe quel écran */
export function useTaskModal() {
  return useContext(TaskModalContext);
}

export function TaskModalProvider({ children }: { children: React.ReactNode }) {
  const { addTodo, updateTodo, deleteTodo } = useTodos();
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState<Todo | null>(null);
  const [defaults, setDefaults] = useState<TaskDefaults>({});

  const open = useCallback((opts?: OpenOptions) => {
    setEditing(opts?.editing ?? null);
    setDefaults(opts?.defaults ?? {});
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    setEditing(null);
  }, []);

  const handleSave = useCallback(
    (draft: TodoDraft) => {
      if (editing) {
        updateTodo(editing.id, draft);
      } else {
        addTodo(draft);
      }
      setEditing(null);
    },
    [editing, addTodo, updateTodo],
  );

  const handleDelete = useCallback(() => {
    if (editing) deleteTodo(editing.id);
    close();
  }, [editing, deleteTodo, close]);

  return (
    <TaskModalContext.Provider value={open}>
      {children}
      <AddTaskModal
        isVisible={visible}
        initialData={editing}
        defaults={defaults}
        onSave={handleSave}
        onDelete={editing ? handleDelete : undefined}
        onClose={close}
      />
    </TaskModalContext.Provider>
  );
}
