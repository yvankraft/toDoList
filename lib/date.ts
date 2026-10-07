export const DAYS_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
export const MONTHS_SHORT = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];
export const MONTHS_LONG = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const pad = (n: number) => String(n).padStart(2, "0");

/** Date -> "YYYY-MM-DD" (heure locale) */
export const toDateKey = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** "YYYY-MM-DD" -> Date locale (minuit) */
export const fromDateKey = (key: string): Date => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const todayKey = () => toDateKey(new Date());

export const addDays = (key: string, n: number): string => {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + n);
  return toDateKey(d);
};

export const isToday = (key: string | null) => key === todayKey();
export const isTomorrow = (key: string | null) => key === addDays(todayKey(), 1);
export const isPast = (key: string) => key < todayKey();

export const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

export const minutesToTime = (mins: number): string =>
  `${pad(Math.floor(mins / 60) % 24)}:${pad(mins % 60)}`;

/** Libellé "Lun 12 Jan" ou "Aujourd'hui"/"Demain" */
export const formatDayLabel = (key: string): string => {
  if (isToday(key)) return "Aujourd'hui";
  if (isTomorrow(key)) return "Demain";
  if (key === addDays(todayKey(), -1)) return "Hier";
  const d = fromDateKey(key);
  return `${DAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
};

export const formatDuration = (mins: number): string => {
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h${pad(m)}`;
};

/** Plage horaire "09:00 → 10:30" pour une tâche */
export const taskTimeRange = (
  startTime: string,
  duration: number,
): string => `${startTime} → ${minutesToTime(timeToMinutes(startTime) + duration)}`;

/** Lundi = début de semaine. Retourne les 7 clés "YYYY-MM-DD" de la semaine contenant `key`. */
export const weekDays = (key: string): string[] => {
  const d = fromDateKey(key);
  const offset = (d.getDay() + 6) % 7; // lundi=0
  const monday = addDays(key, -offset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
};

/** Prochaine date d'occurrence selon la récurrence */
export const nextOccurrence = (
  key: string,
  recurrence: "daily" | "weekdays" | "weekly",
): string => {
  if (recurrence === "daily") return addDays(key, 1);
  if (recurrence === "weekly") return addDays(key, 7);
  // weekdays : ven -> lun, sam -> lun, sinon +1
  const next = addDays(key, 1);
  const day = fromDateKey(next).getDay();
  if (day === 6) return addDays(key, 3); // samedi -> lundi
  if (day === 0) return addDays(key, 2); // dimanche -> lundi
  return next;
};
