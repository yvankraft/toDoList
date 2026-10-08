import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState
} from "react";
import { AppState, Platform } from "react-native";
import { TASK_COLORS } from "../constants/tasks";
import {
    deleteTaskEvent,
    diffEventAgainstTodo,
    ensureCalendarPermission,
    hasCalendarPermission,
    syncTaskToCalendar,
} from "../lib/calendar";
import { nextOccurrence } from "../lib/date";
import {
    cancelTaskReminder,
    scheduleTaskReminder,
} from "../lib/notifications";
import type { Settings, Todo, TodoDraft } from "../types/todo";

const TODOS_KEY = "@my_todo_list";
const SETTINGS_KEY = "@app_settings";

const DEFAULT_SETTINGS: Settings = {
  accent: "#3b82f6",
  notificationsEnabled: true,
  calendarSyncEnabled: true,
  hiddenCalendarIds: [],
};

/** Migre les anciennes tâches vers le nouveau schéma */
const migrateTodo = (raw: any): Todo => ({
  id: raw.id ?? `${Date.now()}-${Math.random()}`,
  title: raw.title ?? "",
  notes: raw.notes ?? "",
  isCompleted: !!raw.isCompleted,
  createdAt: raw.createdAt ?? Date.now(),
  completedAt: raw.completedAt ?? null,
  date: raw.date ?? null,
  startTime: raw.startTime ?? null,
  duration: raw.duration ?? 30,
  color: raw.color ?? TASK_COLORS[0],
  icon: raw.icon ?? "check",
  subtasks: Array.isArray(raw.subtasks) ? raw.subtasks : [],
  recurrence: raw.recurrence ?? "none",
  reminderMinutes: raw.reminderMinutes ?? null,
  notificationId: raw.notificationId ?? null,
  energy: raw.energy ?? null,
  calendarEventId: raw.calendarEventId ?? null,
});

type TodosContextValue = {
  todos: Todo[];
  hydrated: boolean;
  settings: Settings;
  addTodo: (draft: TodoDraft) => Promise<void>;
  updateTodo: (id: string, draft: TodoDraft) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  toggleSubtask: (todoId: string, subtaskId: string) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  importData: (todos: Todo[], settings?: Partial<Settings>) => Promise<void>;
  clearAll: () => Promise<void>;
  /** Réconcilie les tâches avec les événements calendrier modifiés nativement */
  syncFromCalendar: () => Promise<void>;
};

const TodosContext = createContext<TodosContextValue | null>(null);

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export function TodosProvider({ children }: { children: React.ReactNode }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [rawTodos, rawSettings] = await Promise.all([
          AsyncStorage.getItem(TODOS_KEY),
          AsyncStorage.getItem(SETTINGS_KEY),
        ]);
        if (rawTodos) setTodos(JSON.parse(rawTodos).map(migrateTodo));
        if (rawSettings)
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(rawSettings) });
      } catch (e) {
        console.error("Erreur de chargement", e);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const persist = useCallback(async (next: Todo[]) => {
    setTodos(next);
    try {
      await AsyncStorage.setItem(TODOS_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("Erreur de sauvegarde", e);
    }
  }, []);

  const syncCalendar = settings.calendarSyncEnabled;

  // Sync app -> calendrier : crée/met à jour l'événement lié si nécessaire
  const pushToCalendar = useCallback(
    async (todo: Todo): Promise<void> => {
      if (!syncCalendar || !(await hasCalendarPermission())) return;
      todo.calendarEventId = await syncTaskToCalendar(todo);
    },
    [syncCalendar],
  );

  // Local-first : persist() immédiat, puis les effets natifs (notifs +
  // calendrier) en arrière-plan. Un module natif qui bloque dans Expo Go
  // ne doit jamais empêcher la sauvegarde locale.
  const runNativeSideEffects = async (
    todo: Todo,
    list: Todo[],
  ): Promise<void> => {
    try {
      if (settings.notificationsEnabled && !todo.isCompleted) {
        todo.notificationId = await scheduleTaskReminder(todo);
      }
      await pushToCalendar(todo);
      if (todo.notificationId || todo.calendarEventId) {
        await persist([...list]);
      }
    } catch (e) {
      console.warn("Sync natif échouée", e);
    }
  };

  const addTodo = useCallback(
    async (draft: TodoDraft) => {
      const todo: Todo = {
        ...draft,
        id: uid(),
        isCompleted: false,
        createdAt: Date.now(),
        completedAt: null,
        notificationId: null,
        calendarEventId: null,
      };
      const list = [todo, ...todos];
      await persist(list);
      await runNativeSideEffects(todo, list);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [todos, persist, settings.notificationsEnabled, pushToCalendar],
  );

  const updateTodo = useCallback(
    async (id: string, draft: TodoDraft) => {
      const existing = todos.find((t) => t.id === id);
      if (!existing) return;
      const updated: Todo = { ...existing, ...draft, notificationId: null };
      const list = todos.map((t) => (t.id === id ? updated : t));
      await persist(list);
      try {
        await cancelTaskReminder(existing);
        if (settings.notificationsEnabled && !updated.isCompleted) {
          updated.notificationId = await scheduleTaskReminder(updated);
        }
        await pushToCalendar(updated);
        await persist([...list]);
      } catch (e) {
        console.warn("Sync native échouée", e);
      }
    },
    [todos, persist, settings.notificationsEnabled, pushToCalendar],
  );

  const deleteTodo = useCallback(
    async (id: string) => {
      const existing = todos.find((t) => t.id === id);
      await persist(todos.filter((t) => t.id !== id));
      if (existing) {
        try {
          await cancelTaskReminder(existing);
          if (existing.calendarEventId) {
            await deleteTaskEvent(existing.calendarEventId);
          }
        } catch (e) {
          console.warn("Nettoyage natif échoué", e);
        }
      }
    },
    [todos, persist],
  );

  const toggleTodo = useCallback(
    async (id: string) => {
      const target = todos.find((t) => t.id === id);
      if (!target) return;

      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }

      const completing = !target.isCompleted;
      const updated: Todo = {
        ...target,
        isCompleted: completing,
        completedAt: completing ? Date.now() : null,
      };

      let next = todos.map((t) => (t.id === id ? updated : t));

      // Tâche récurrente terminée -> génère la prochaine occurrence
      let occurrence: Todo | null = null;
      if (
        completing &&
        updated.recurrence !== "none" &&
        updated.date
      ) {
        occurrence = {
          ...updated,
          id: uid(),
          isCompleted: false,
          createdAt: Date.now(),
          completedAt: null,
          date: nextOccurrence(updated.date, updated.recurrence),
          notificationId: null,
          calendarEventId: null,
        };
        next = [...next, occurrence];
      }

      await persist(next);
      try {
        if (completing) {
          await cancelTaskReminder(updated);
          updated.notificationId = null;
        }
        if (occurrence) {
          if (settings.notificationsEnabled) {
            occurrence.notificationId =
              await scheduleTaskReminder(occurrence);
          }
          await pushToCalendar(occurrence);
          await persist([...next]);
        }
      } catch (e) {
        console.warn("Sync native échouée", e);
      }
    },
    [todos, persist, settings.notificationsEnabled, pushToCalendar],
  );

  const toggleSubtask = useCallback(
    async (todoId: string, subtaskId: string) => {
      const next = todos.map((t) =>
        t.id === todoId
          ? {
              ...t,
              subtasks: t.subtasks.map((s) =>
                s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s,
              ),
            }
          : t,
      );
      await persist(next);
    },
    [todos, persist],
  );

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const importData = useCallback(
    async (incoming: Todo[], incomingSettings?: Partial<Settings>) => {
      const migrated = incoming.map(migrateTodo);
      // Les IDs d'événements d'une autre sauvegarde ne sont pas valides ici
      for (const t of migrated) t.calendarEventId = null;
      await persist(migrated);
      if (incomingSettings) await updateSettings(incomingSettings);
      // Réécriture calendrier en arrière-plan
      try {
        if (syncCalendar && (await hasCalendarPermission())) {
          for (const t of migrated) {
            t.calendarEventId = await syncTaskToCalendar(t);
          }
          await persist([...migrated]);
        }
      } catch (e) {
        console.warn("Import : sync calendrier échouée", e);
      }
    },
    [persist, updateSettings, syncCalendar],
  );

  const clearAll = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([TODOS_KEY, SETTINGS_KEY]);
    } catch {}
    setTodos([]);
    setSettings(DEFAULT_SETTINGS);
    // Supprime les événements créés dans le calendrier par l'app
    for (const t of todos) {
      if (t.calendarEventId) await deleteTaskEvent(t.calendarEventId);
    }
  }, [todos]);

  // Ref pour la réconciliation (évite les dépendances de callback)
  const todosRef = useRef(todos);
  const settingsRef = useRef(settings);
  useEffect(() => {
    todosRef.current = todos;
    settingsRef.current = settings;
  }, [todos, settings]);

  /**
   * Sync retour : relit les événements liés aux tâches.
   * - événement supprimé nativement -> la tâche retourne dans l'Inbox
   * - événement modifié nativement -> la tâche suit (date/heure/durée/titre/notes)
   * La comparaison par diff rend l'opération idempotente : nos propres
   * écritures calendrier ne produisent aucun changement.
   */
  const syncFromCalendar = useCallback(async () => {
    if (!settingsRef.current.calendarSyncEnabled) return;
    if (!(await hasCalendarPermission())) return;
    const linked = todosRef.current.filter((t) => t.calendarEventId);
    if (linked.length === 0) return;

    const patches = new Map<string, Partial<Todo>>();
    for (const t of linked) {
      const res = await diffEventAgainstTodo(t);
      if (res === "deleted") {
        patches.set(t.id, {
          calendarEventId: null,
          date: null,
          startTime: null,
        });
      } else if (res) {
        patches.set(t.id, res);
      }
    }
    if (patches.size === 0) return;
    await persist(
      todosRef.current.map((t) =>
        patches.has(t.id) ? { ...t, ...patches.get(t.id)! } : t,
      ),
    );
  }, [persist]);

  // Réconcilie au démarrage (demande la permission si nécessaire)
  useEffect(() => {
    if (!hydrated || !settings.calendarSyncEnabled) return;
    (async () => {
      if (await ensureCalendarPermission()) syncFromCalendar();
    })();
  }, [hydrated, settings.calendarSyncEnabled, syncFromCalendar]);

  // Réconcilie quand l'app revient au premier plan
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") syncFromCalendar();
    });
    return () => sub.remove();
  }, [syncFromCalendar]);

  const value: TodosContextValue = {
    todos,
    hydrated,
    settings,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    toggleSubtask,
    updateSettings,
    importData,
    clearAll,
    syncFromCalendar,
  };

  return (
    <TodosContext.Provider value={value}>{children}</TodosContext.Provider>
  );
}

export function useTodos(): TodosContextValue {
  const ctx = useContext(TodosContext);
  if (!ctx) throw new Error("useTodos doit être utilisé dans TodosProvider");
  return ctx;
}
