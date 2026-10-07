import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import {
    fetchCalendarEvents,
    isCalendarSupported,
} from "../lib/calendar";
import { addDays, toDateKey } from "../lib/date";
import type { CalendarDayEvent } from "../types/todo";
import { useTodos } from "./use-todos";

/**
 * Charge les événements des calendriers de l'appareil pour une plage
 * [startKey, startKey + spanDays[ et les regroupe par jour ("YYYY-MM-DD").
 * Se recharge quand l'app revient au premier plan ou quand les réglages
 * de sync changent.
 */
export function useCalendarEvents(
  startKey: string,
  spanDays = 7,
): Map<string, CalendarDayEvent[]> {
  const { settings } = useTodos();
  const [eventsByDay, setEventsByDay] = useState<
    Map<string, CalendarDayEvent[]>
  >(new Map());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hiddenIds = settings.hiddenCalendarIds;
  const enabled = settings.calendarSyncEnabled && isCalendarSupported;

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const events = await fetchCalendarEvents(
      startKey,
      addDays(startKey, spanDays - 1),
      hiddenIds,
    );
    const map = new Map<string, CalendarDayEvent[]>();
    for (const e of events) {
      // Un événement multi-jours apparaît chaque jour couvert
      let cursor = toDateKey(e.start);
      const last = toDateKey(new Date(e.end.getTime() - 1));
      while (cursor <= last) {
        const list = map.get(cursor) ?? [];
        list.push(e);
        map.set(cursor, list);
        cursor = addDays(cursor, 1);
      }
    }
    setEventsByDay(map);
  }, [startKey, spanDays, enabled, hiddenIds]);

  useEffect(() => {
    const t = setTimeout(refresh, 0);
    return () => clearTimeout(t);
  }, [refresh]);

  // Recharge quand l'app revient au premier plan (léger debounce)
  useEffect(() => {
    if (!enabled) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(refresh, 400);
    });
    return () => {
      sub.remove();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [refresh, enabled]);

  // Sync désactivée -> toujours une map vide (peu importe le cache)
  return enabled ? eventsByDay : EMPTY_EVENTS;
}

const EMPTY_EVENTS = new Map<string, CalendarDayEvent[]>();
