import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Calendar from "expo-calendar/legacy";
import { Platform } from "react-native";
import type { CalendarDayEvent, Todo } from "../types/todo";
import { fromDateKey, minutesToTime, timeToMinutes, toDateKey } from "./date";

const APP_CALENDAR_KEY = "@app_calendar_id";
const APP_CALENDAR_TITLE = "ToDoList";
const APP_CALENDAR_COLOR = "#6366f1";

/** Le calendrier natif n'existe pas sur web */
export const isCalendarSupported = Platform.OS !== "web";

/** Demande (ou vérifie) la permission calendrier complète */
export const ensureCalendarPermission = async (): Promise<boolean> => {
  if (!isCalendarSupported) return false;
  try {
    const current = await Calendar.getCalendarPermissionsAsync();
    if (current.granted) return true;
    const res = await Calendar.requestCalendarPermissionsAsync();
    return res.granted;
  } catch {
    return false;
  }
};

export const hasCalendarPermission = async (): Promise<boolean> => {
  if (!isCalendarSupported) return false;
  try {
    return (await Calendar.getCalendarPermissionsAsync()).granted;
  } catch {
    return false;
  }
};

export type DeviceCalendar = {
  id: string;
  title: string;
  color: string;
  sourceName: string;
  allowsModifications: boolean;
};

/** Tous les calendriers du téléphone (y compris abonnements iCloud/Google/Exchange) */
export const getDeviceCalendars = async (): Promise<DeviceCalendar[]> => {
  if (!isCalendarSupported) return [];
  try {
    const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    return cals.map((c) => ({
      id: c.id,
      title: c.title ?? "Calendrier",
      color: c.color ?? "#71717a",
      sourceName: c.source?.name ?? "",
      allowsModifications: c.allowsModifications ?? false,
    }));
  } catch {
    return [];
  }
};

/** Retourne (et crée au besoin) le calendrier dédié de l'app pour l'écriture */
export const getAppCalendarId = async (): Promise<string | null> => {
  if (!isCalendarSupported) return null;
  try {
    const stored = await AsyncStorage.getItem(APP_CALENDAR_KEY);
    if (stored) {
      const cals = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.EVENT,
      );
      if (cals.some((c) => c.id === stored)) return stored;
    }

    let details: Parameters<typeof Calendar.createCalendarAsync>[0];
    if (Platform.OS === "ios") {
      const def = await Calendar.getDefaultCalendarAsync();
      details = {
        title: APP_CALENDAR_TITLE,
        color: APP_CALENDAR_COLOR,
        entityType: Calendar.EntityTypes.EVENT,
        sourceId: def.source?.id,
        source: def.source,
      };
    } else {
      details = {
        title: APP_CALENDAR_TITLE,
        color: APP_CALENDAR_COLOR,
        accessLevel: Calendar.CalendarAccessLevel.OWNER,
        ownerAccount: "todolist",
        name: APP_CALENDAR_TITLE,
        source: {
          name: APP_CALENDAR_TITLE,
          isLocalAccount: true,
          type: Calendar.SourceType.LOCAL,
        },
      };
    }
    const id = await Calendar.createCalendarAsync(details);
    await AsyncStorage.setItem(APP_CALENDAR_KEY, id);
    return id;
  } catch (e) {
    console.warn("Calendrier app introuvable", e);
    return null;
  }
};

const taskToEventDetails = (todo: Todo) => {
  const base = {
    title: todo.title,
    notes: todo.notes || undefined,
    // Pas d'alarme sur l'événement : les rappels passent par les
    // notifications locales de l'app (évite les doubles alertes)
    alarms: [],
    availability: Calendar.Availability.BUSY,
  };
  if (!todo.date) return null;
  if (todo.startTime) {
    const start = fromDateKey(todo.date);
    start.setHours(0, timeToMinutes(todo.startTime), 0, 0);
    const end = new Date(start.getTime() + todo.duration * 60_000);
    return { ...base, startDate: start, endDate: end, allDay: false };
  }
  const day = fromDateKey(todo.date);
  return {
    ...base,
    startDate: day,
    endDate: day,
    allDay: true,
  };
};

/**
 * Crée ou met à jour l'événement calendrier lié à la tâche.
 * Retourne l'eventId, ou null si rien à synchroniser / échec.
 */
export const syncTaskToCalendar = async (
  todo: Todo,
): Promise<string | null> => {
  if (!isCalendarSupported) return todo.calendarEventId;
  const details = taskToEventDetails(todo);
  // Tâche non planifiée : supprimer l'éventuel événement lié
  if (!details) {
    if (todo.calendarEventId) await deleteTaskEvent(todo.calendarEventId);
    return null;
  }
  try {
    if (todo.calendarEventId) {
      await Calendar.updateEventAsync(todo.calendarEventId, details);
      return todo.calendarEventId;
    }
  } catch {
    // l'événement a été supprimé côté natif -> on en recrée un
  }
  try {
    const calendarId = await getAppCalendarId();
    if (!calendarId) return null;
    return await Calendar.createEventAsync(calendarId, details);
  } catch (e) {
    console.warn("Sync calendrier échouée", e);
    return null;
  }
};

export const deleteTaskEvent = async (eventId: string): Promise<void> => {
  if (!isCalendarSupported) return;
  try {
    await Calendar.deleteEventAsync(eventId);
  } catch {
    // déjà supprimé
  }
};

export type EventPatch = {
  date: string | null;
  startTime: string | null;
  duration: number;
  title: string;
  notes: string;
};

/**
 * Compare un événement natif avec sa tâche liée.
 * Retourne "deleted" si l'événement n'existe plus, un patch si l'événement
 * a été modifié nativement, ou null s'il est conforme à la tâche.
 */
export const diffEventAgainstTodo = async (
  todo: Todo,
): Promise<"deleted" | EventPatch | null> => {
  if (!isCalendarSupported || !todo.calendarEventId) return null;
  let event: Calendar.Event;
  try {
    event = await Calendar.getEventAsync(todo.calendarEventId);
  } catch {
    return "deleted";
  }
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  const patch: EventPatch = {
    title: event.title ?? todo.title,
    notes: event.notes ?? "",
    date: toDateKey(start),
    startTime: event.allDay
      ? null
      : minutesToTime(start.getHours() * 60 + start.getMinutes()),
    duration: event.allDay
      ? todo.duration
      : Math.max(5, Math.round((end.getTime() - start.getTime()) / 60_000)),
  };
  const unchanged =
    patch.date === todo.date &&
    patch.startTime === todo.startTime &&
    patch.duration === todo.duration &&
    patch.title === todo.title &&
    patch.notes === todo.notes;
  return unchanged ? null : patch;
};

/**
 * Lit les événements de tous les calendriers visibles sur une plage de dates.
 * Exclut les événements du calendrier interne de l'app (déjà affichés comme tâches).
 */
export const fetchCalendarEvents = async (
  startDayKey: string,
  endDayKey: string,
  hiddenCalendarIds: string[],
): Promise<CalendarDayEvent[]> => {
  if (!isCalendarSupported) return [];
  try {
    const [calendars, appCalendarId] = await Promise.all([
      Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT),
      AsyncStorage.getItem(APP_CALENDAR_KEY),
    ]);
    const hidden = new Set(hiddenCalendarIds);
    const readable = calendars.filter(
      (c) => c.id !== appCalendarId && !hidden.has(c.id),
    );
    if (readable.length === 0) return [];
    const info = new Map(
      readable.map((c) => [
        c.id,
        {
          title: c.title ?? "Calendrier",
          color: c.color ?? "#71717a",
        },
      ]),
    );
    const start = fromDateKey(startDayKey);
    const end = fromDateKey(endDayKey);
    end.setDate(end.getDate() + 1); // fin exclusive -> jour suivant 00:00
    const events = await Calendar.getEventsAsync(
      readable.map((c) => c.id),
      start,
      end,
    );
    return events.map((e) => {
      const cal = info.get(e.calendarId);
      return {
        id: e.id,
        title: e.title || "Événement",
        calendarId: e.calendarId,
        calendarTitle: cal?.title ?? "Calendrier",
        color: cal?.color ?? "#71717a",
        notes: e.notes ?? "",
        allDay: !!e.allDay,
        start: new Date(e.startDate),
        end: new Date(e.endDate),
        linkedTodoId: null,
      };
    });
  } catch (e) {
    console.warn("Lecture calendrier impossible", e);
    return [];
  }
};
