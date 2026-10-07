import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { fromDateKey, timeToMinutes } from "./date";
import type { Todo } from "../types/todo";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === "web") return false;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === "granted") return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.status === "granted";
  } catch {
    return false;
  }
};

/** Planifie un rappel local pour une tâche. Retourne l'id de notification ou null. */
export const scheduleTaskReminder = async (
  todo: Todo,
): Promise<string | null> => {
  if (
    Platform.OS === "web" ||
    todo.reminderMinutes == null ||
    !todo.date ||
    !todo.startTime ||
    todo.isCompleted
  ) {
    return null;
  }
  try {
    const day = fromDateKey(todo.date);
    const start = timeToMinutes(todo.startTime);
    const fireDate = new Date(day);
    fireDate.setMinutes(start - todo.reminderMinutes);
    if (fireDate.getTime() <= Date.now()) return null;

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: todo.title,
        body:
          todo.reminderMinutes === 0
            ? "C'est l'heure !"
            : `Commence dans ${todo.reminderMinutes} min`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireDate,
      },
    });
  } catch {
    return null;
  }
};

export const cancelTaskReminder = async (todo: Todo): Promise<void> => {
  if (!todo.notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(todo.notificationId);
  } catch {
    // ignore
  }
};
