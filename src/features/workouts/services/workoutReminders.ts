import type { TrainingWeekday } from "../data/workoutCatalog";

export type WorkoutReminderSettings = {
  enabled: boolean;
  hour: number;
  minute: number;
  weekdays: TrainingWeekday[];
};

const reminderKind = "gym-workout-reminder";
const androidChannelId = "gym-reminders";

export async function configureWorkoutNotifications() {
  if (process.env.EXPO_OS === "web") {
    return;
  }

  const Notifications = await import("expo-notifications");
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function syncWorkoutReminders(
  settings: WorkoutReminderSettings,
): Promise<string> {
  if (process.env.EXPO_OS === "web") {
    return "Reminders can be scheduled from the iOS or Android app.";
  }

  const Notifications = await import("expo-notifications");

  if (process.env.EXPO_OS === "android") {
    await Notifications.setNotificationChannelAsync(androidChannelId, {
      name: "Gym reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 180, 250],
    });
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const existingReminderIds = scheduled
    .filter((notification) => notification.content.data?.kind === reminderKind)
    .map((notification) => notification.identifier);

  await Promise.all(
    existingReminderIds.map((identifier) =>
      Notifications.cancelScheduledNotificationAsync(identifier),
    ),
  );

  if (!settings.enabled) {
    return "Workout reminders are off.";
  }

  const existingPermission = await Notifications.getPermissionsAsync();
  const permission = existingPermission.granted
    ? existingPermission
    : await Notifications.requestPermissionsAsync();

  if (!permission.granted) {
    throw new Error("Notification permission was not granted.");
  }

  await Promise.all(
    settings.weekdays.map((weekday) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: "Gym time",
          body: "Your planned workout is ready. Open Apex Gym to start.",
          data: { kind: reminderKind, weekday },
          sound: "default",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour: settings.hour,
          minute: settings.minute,
          channelId: process.env.EXPO_OS === "android" ? androidChannelId : undefined,
        },
      }),
    ),
  );

  const time = `${String(settings.hour).padStart(2, "0")}:${String(
    settings.minute,
  ).padStart(2, "0")}`;
  return `${settings.weekdays.length} weekly reminder${
    settings.weekdays.length === 1 ? "" : "s"
  } scheduled for ${time}.`;
}
