import {
  Bike,
  BookOpen,
  Briefcase,
  Check,
  Code2,
  Coffee,
  Dumbbell,
  GraduationCap,
  Heart,
  Home,
  Music,
  Phone,
  Plane,
  ShoppingCart,
  Star,
  Utensils,
  Wallet,
} from "lucide-react-native";
import type { EnergyLevel, Recurrence } from "../types/todo";

/** Palette de couleurs pour les tâches */
export const TASK_COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#71717a", // zinc
];

/** Couleurs d'accent de l'app (settings) */
export const ACCENT_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#22c55e",
  "#06b6d4",
];

export const TASK_ICONS: Record<string, any> = {
  check: Check,
  briefcase: Briefcase,
  book: BookOpen,
  dumbbell: Dumbbell,
  cart: ShoppingCart,
  coffee: Coffee,
  home: Home,
  heart: Heart,
  music: Music,
  code: Code2,
  phone: Phone,
  plane: Plane,
  star: Star,
  food: Utensils,
  wallet: Wallet,
  bike: Bike,
  school: GraduationCap,
};

export const ICON_KEYS = Object.keys(TASK_ICONS);

export const DURATIONS = [15, 30, 45, 60, 90, 120, 180];

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  none: "Jamais",
  daily: "Quotidienne",
  weekdays: "Jours ouvrés",
  weekly: "Hebdomadaire",
};

export const REMINDER_OPTIONS = [
  { label: "Aucun", value: null },
  { label: "À l'heure", value: 0 },
  { label: "5 min", value: 5 },
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 h", value: 60 },
];

export const ENERGY_LABELS: Record<EnergyLevel, string> = {
  low: "Faible",
  medium: "Moyenne",
  high: "Haute",
};

/** Créneaux horaires proposés (toutes les 30 min) */
export const TIME_SLOTS: string[] = Array.from(
  { length: 48 },
  (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`,
);
