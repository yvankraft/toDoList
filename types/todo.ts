export type SubTask = {
  id: string;
  title: string;
  isCompleted: boolean;
};

export type Recurrence = "none" | "daily" | "weekdays" | "weekly";

export type EnergyLevel = "low" | "medium" | "high";

export type Todo = {
  id: string;
  title: string;
  notes: string;
  isCompleted: boolean;
  createdAt: number;
  completedAt: number | null;
  /** "YYYY-MM-DD" ou null = Inbox (non planifiée) */
  date: string | null;
  /** "HH:mm" ou null = toute la journée */
  startTime: string | null;
  /** Durée en minutes */
  duration: number;
  color: string;
  /** Clé dans TASK_ICONS */
  icon: string;
  subtasks: SubTask[];
  recurrence: Recurrence;
  /** Minutes avant startTime, null = pas de rappel */
  reminderMinutes: number | null;
  notificationId: string | null;
  energy: EnergyLevel | null;
  /** ID de l'événement calendrier lié (sync bidirectionnelle) */
  calendarEventId: string | null;
};

/** Champs éditables d'une tâche (ce que le modal produit) */
export type TodoDraft = Omit<
  Todo,
  | "id"
  | "createdAt"
  | "isCompleted"
  | "completedAt"
  | "notificationId"
  | "calendarEventId"
>;

/** Événement natif lu depuis le calendrier de l'appareil (affichage timeline) */
export type CalendarDayEvent = {
  id: string;
  title: string;
  calendarId: string;
  calendarTitle: string;
  color: string;
  notes: string;
  allDay: boolean;
  start: Date;
  end: Date;
  /** ID de la tâche liée, si l'événement provient de l'app */
  linkedTodoId: string | null;
};

export type Settings = {
  accent: string;
  notificationsEnabled: boolean;
  /** Sync bidirectionnelle avec le calendrier système */
  calendarSyncEnabled: boolean;
  /** Calendriers exclus de l'affichage (vide = tous visibles) */
  hiddenCalendarIds: string[];
};
