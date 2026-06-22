import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bell,
  BicepsFlexed,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Dumbbell,
  Flame,
  HeartPulse,
  LockKeyhole,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  Weight,
  X,
} from "lucide-react-native";

import { colors } from "../../../theme/colors";
import type {
  TrainingProgram,
  TrainingWeekday,
} from "../data/workoutCatalog";
import type { WorkoutReminderSettings } from "../services/workoutReminders";
import type { Exercise } from "../types";

export type { WorkoutReminderSettings } from "../services/workoutReminders";

const trainingWeekdays: Array<{
  weekday: TrainingWeekday;
  short: string;
  label: string;
}> = [
  { weekday: 2, short: "Mon", label: "Monday" },
  { weekday: 3, short: "Tue", label: "Tuesday" },
  { weekday: 4, short: "Wed", label: "Wednesday" },
  { weekday: 5, short: "Thu", label: "Thursday" },
  { weekday: 6, short: "Fri", label: "Friday" },
  { weekday: 7, short: "Sat", label: "Saturday" },
  { weekday: 1, short: "Sun", label: "Sunday" },
];

export type AthleteProfile = {
  name: string;
  weight: number;
  height: number;
  fitnessLevel: "Beginner" | "Intermediate" | "Advanced" | "Athlete";
  goal: string;
  trainingDaysPerWeek: number;
  preferredIntensity: "Easy" | "Light sweat" | "Challenging" | "Progressive";
};

export type DailyTargets = {
  calories: number;
  protein: number;
};

export type SettingsPage = "health" | "equipment" | "privacy" | "help";

export type SettingsPreferences = {
  health: string[];
  equipment: string;
  privacy: string[];
};

type BaseSheetProps = {
  title: string;
  eyebrow: string;
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

function BaseSheet({ title, eyebrow, visible, onClose, children }: BaseSheetProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      statusBarTranslucent
      visible={visible}
    >
      <SafeAreaView className="flex-1 bg-obsidian">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <Animated.View
            entering={FadeIn.duration(160)}
            className="flex-1 bg-obsidian"
            style={{ backgroundColor: colors.background, flex: 1, minHeight: 0 }}
          >
            <View
              className="flex-row items-center justify-between border-b border-line bg-white/80 px-5 py-4"
              style={{ boxShadow: "0 14px 34px rgba(17, 19, 24, 0.06)" }}
            >
              <View className="min-w-0 flex-1 pr-4">
                <Text className="text-[10px] font-black uppercase text-electric">{eyebrow}</Text>
                <Text className="mt-1 text-xl font-black text-bone" numberOfLines={1}>
                  {title}
                </Text>
              </View>
              <Pressable
                accessibilityLabel={`Close ${title}`}
                accessibilityRole="button"
                onPress={onClose}
                className="h-10 w-10 items-center justify-center rounded-2xl border border-line bg-white"
                style={{ boxShadow: "0 10px 24px rgba(17, 19, 24, 0.08)" }}
              >
                <X color={colors.steel} size={18} />
              </Pressable>
            </View>
            <View className="flex-1">{children}</View>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

export function NotificationCenter({
  onUnreadChange,
  visible,
  onClose,
}: {
  onUnreadChange?: (count: number) => void;
  visible: boolean;
  onClose: () => void;
}) {
  const [readIds, setReadIds] = useState<string[]>([]);
  const notices = [
    {
      id: "reminder",
      title: "Gym reminders are available",
      body: "Choose your training days and exact gym time from Profile.",
      time: "Info",
      icon: <Bell color={colors.accent} size={18} />,
    },
    {
      id: "recovery-data",
      title: "Recovery scores are hidden",
      body: "Apex needs permissioned wearable data before showing recovery or readiness percentages.",
      time: "Data",
      icon: <HeartPulse color={colors.steel} size={18} />,
    },
  ];

  useEffect(() => {
    onUnreadChange?.(notices.length - readIds.length);
  }, [onUnreadChange, readIds.length, notices.length]);

  return (
    <BaseSheet eyebrow="Training inbox" onClose={onClose} title="Notifications" visible={visible}>
      <ScrollView contentContainerClassName="gap-3 px-5 pb-8 pt-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-ash">{notices.length - readIds.length} unread</Text>
          <Pressable onPress={() => setReadIds(notices.map((notice) => notice.id))}>
            <Text className="text-xs font-black uppercase text-electric">Mark all read</Text>
          </Pressable>
        </View>
        {notices.map((notice) => {
          const isRead = readIds.includes(notice.id);
          return (
            <Pressable
              accessibilityRole="button"
              className={`flex-row gap-3 rounded-lg border p-4 ${
                isRead ? "border-line bg-graphite" : "border-electric/35 bg-electric/10"
              }`}
              key={notice.id}
              onPress={() =>
                setReadIds((current) =>
                  current.includes(notice.id) ? current : [...current, notice.id],
                )
              }
            >
              <View className="h-10 w-10 items-center justify-center rounded-md bg-carbon">
                {notice.icon}
              </View>
              <View className="min-w-0 flex-1">
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="min-w-0 flex-1 font-black text-bone">{notice.title}</Text>
                  <Text className="text-[10px] font-semibold uppercase text-ash">{notice.time}</Text>
                </View>
                <Text className="mt-2 text-xs leading-5 text-steel">{notice.body}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </BaseSheet>
  );
}

export function WorkoutReminderSheet({
  visible,
  settings,
  programWeekdays,
  onClose,
  onSave,
}: {
  visible: boolean;
  settings: WorkoutReminderSettings;
  programWeekdays: TrainingWeekday[];
  onClose: () => void;
  onSave: (settings: WorkoutReminderSettings) => Promise<string>;
}) {
  const [enabled, setEnabled] = useState(settings.enabled);
  const [hour, setHour] = useState(String(settings.hour).padStart(2, "0"));
  const [minute, setMinute] = useState(String(settings.minute).padStart(2, "0"));
  const [weekdays, setWeekdays] = useState<TrainingWeekday[]>(settings.weekdays);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setEnabled(settings.enabled);
    setHour(String(settings.hour).padStart(2, "0"));
    setMinute(String(settings.minute).padStart(2, "0"));
    setWeekdays(settings.weekdays);
    setStatus("");
  }, [visible]);

  const parsedHour = Number(hour);
  const parsedMinute = Number(minute);
  const isValid =
    Number.isInteger(parsedHour) &&
    parsedHour >= 0 &&
    parsedHour <= 23 &&
    Number.isInteger(parsedMinute) &&
    parsedMinute >= 0 &&
    parsedMinute <= 59 &&
    (!enabled || weekdays.length > 0);

  function toggleDay(weekday: TrainingWeekday) {
    setWeekdays((current) =>
      current.includes(weekday)
        ? current.filter((item) => item !== weekday)
        : [...current, weekday],
    );
  }

  async function saveReminder() {
    if (!isValid || saving) {
      return;
    }

    setSaving(true);
    setStatus("");
    try {
      const message = await onSave({
        enabled,
        hour: parsedHour,
        minute: parsedMinute,
        weekdays,
      });
      setStatus(message);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not schedule reminders.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <BaseSheet eyebrow="Training schedule" onClose={onClose} title="Gym reminder" visible={visible}>
      <ScrollView
        contentContainerClassName="gap-5 px-5 pb-8 pt-5"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center gap-3 rounded-lg border border-line bg-graphite p-4">
          <View className="h-11 w-11 items-center justify-center rounded-md bg-carbon">
            <Bell color={colors.accent} size={20} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-black text-bone">Remind me when it is gym time</Text>
            <Text className="mt-1 text-xs leading-5 text-ash">
              Uses a local notification on this phone. No account or push server is required.
            </Text>
          </View>
          <Switch
            onValueChange={setEnabled}
            thumbColor={enabled ? colors.background : colors.steel}
            trackColor={{ false: colors.line, true: colors.accent }}
            value={enabled}
          />
        </View>

        <View
          className={enabled ? "" : "opacity-40"}
          style={{ pointerEvents: enabled ? "auto" : "none" }}
        >
          <View className="mb-3 flex-row items-center gap-2">
            <Clock3 color={colors.steel} size={18} />
            <Text className="text-xs font-black uppercase text-ash">Gym time</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <TextInput
              accessibilityLabel="Gym reminder hour"
              className="h-16 rounded-lg border border-line bg-graphite text-center text-3xl font-black text-bone"
              inputMode="numeric"
              maxLength={2}
              onChangeText={setHour}
              selectTextOnFocus
              style={{ flex: 1, minWidth: 0 }}
              value={hour}
            />
            <Text className="text-center text-2xl font-black text-ash">:</Text>
            <TextInput
              accessibilityLabel="Gym reminder minute"
              className="h-16 rounded-lg border border-line bg-graphite text-center text-3xl font-black text-bone"
              inputMode="numeric"
              maxLength={2}
              onChangeText={setMinute}
              selectTextOnFocus
              style={{ flex: 1, minWidth: 0 }}
              value={minute}
            />
          </View>
        </View>

        <View
          className={enabled ? "" : "opacity-40"}
          style={{ pointerEvents: enabled ? "auto" : "none" }}
        >
          <View className="mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <CalendarDays color={colors.steel} size={18} />
              <Text className="text-xs font-black uppercase text-ash">Reminder days</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => setWeekdays(programWeekdays)}
            >
              <Text className="text-xs font-black uppercase text-electric">Use program days</Text>
            </Pressable>
          </View>
          <View className="flex-row gap-1.5">
            {trainingWeekdays.map((day) => {
              const selected = weekdays.includes(day.weekday);
              return (
                <Pressable
                  accessibilityLabel={day.label}
                  accessibilityState={{ selected }}
                  className={`h-11 flex-1 items-center justify-center rounded-md border ${
                    selected ? "border-electric bg-electric" : "border-line bg-graphite"
                  }`}
                  key={day.weekday}
                  onPress={() => toggleDay(day.weekday)}
                >
                  <Text className={`text-[10px] font-black ${selected ? "text-white" : "text-steel"}`}>
                    {day.short}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {status ? (
          <View className="rounded-lg border border-electric/30 bg-electric/10 p-4">
            <Text className="text-sm font-semibold leading-5 text-bone">{status}</Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          className={`h-16 items-center justify-center rounded-lg bg-electric ${
            isValid && !saving ? "" : "opacity-35"
          }`}
          disabled={!isValid || saving}
          onPress={saveReminder}
        >
          <Text className="text-sm font-black uppercase text-white">
            {saving ? "Scheduling..." : "Save reminder"}
          </Text>
        </Pressable>
      </ScrollView>
    </BaseSheet>
  );
}

export function ProgramBuilderSheet({
  visible,
  exercises,
  onClose,
  onSave,
}: {
  visible: boolean;
  exercises: Exercise[];
  onClose: () => void;
  onSave: (program: TrainingProgram) => void;
}) {
  const [title, setTitle] = useState("My Performance Block");
  const [goal, setGoal] = useState("Strength");
  const [selectedWeekdays, setSelectedWeekdays] = useState<TrainingWeekday[]>([2, 4, 6]);
  const [activeWeekday, setActiveWeekday] = useState<TrainingWeekday>(2);
  const [dayLabels, setDayLabels] = useState<Record<number, string>>({
    2: "Workout A",
    4: "Workout B",
    6: "Workout C",
  });
  const [exerciseIdsByDay, setExerciseIdsByDay] = useState<Record<number, string[]>>({
    2: exercises.slice(0, 3).map((item) => item.id),
    4: exercises.slice(1, 4).map((item) => item.id),
    6: exercises.filter((_, index) => index % 2 === 0).map((item) => item.id),
  });

  const activeDay = trainingWeekdays.find((item) => item.weekday === activeWeekday)!;
  const activeExerciseIds = exerciseIdsByDay[activeWeekday] ?? [];
  const scheduleIsComplete = selectedWeekdays.every(
    (weekday) => (exerciseIdsByDay[weekday] ?? []).length > 0,
  );
  const canSave = Boolean(title.trim()) && selectedWeekdays.length > 0 && scheduleIsComplete;

  function toggleWeekday(weekday: TrainingWeekday) {
    if (process.env.EXPO_OS !== "web") {
      void Haptics.selectionAsync();
    }

    setSelectedWeekdays((current) => {
      if (current.includes(weekday)) {
        if (current.length === 1) {
          return current;
        }
        const next = current.filter((item) => item !== weekday);
        if (activeWeekday === weekday) {
          setActiveWeekday(next[0]);
        }
        return next;
      }

      setActiveWeekday(weekday);
      setDayLabels((labels) => ({
        ...labels,
        [weekday]: labels[weekday] ?? `Workout ${String.fromCharCode(65 + current.length)}`,
      }));
      setExerciseIdsByDay((byDay) => ({
        ...byDay,
        [weekday]: byDay[weekday] ?? exercises.slice(0, 1).map((item) => item.id),
      }));
      return [...current, weekday];
    });
  }

  function toggleExercise(id: string) {
    if (process.env.EXPO_OS !== "web") {
      void Haptics.selectionAsync();
    }
    setExerciseIdsByDay((current) => {
      const selectedIds = current[activeWeekday] ?? [];
      return {
        ...current,
        [activeWeekday]: selectedIds.includes(id)
          ? selectedIds.filter((item) => item !== id)
          : [...selectedIds, id],
      };
    });
  }

  function saveProgram() {
    if (!canSave) {
      return;
    }

    const schedule = trainingWeekdays
      .filter((day) => selectedWeekdays.includes(day.weekday))
      .map((day) => ({
        weekday: day.weekday,
        label: dayLabels[day.weekday]?.trim() || `${day.label} workout`,
        exercises: exercises.filter((exercise) =>
          (exerciseIdsByDay[day.weekday] ?? []).includes(exercise.id),
        ),
      }));
    const selectedExercises = Array.from(
      new Map(schedule.flatMap((day) => day.exercises).map((exercise) => [exercise.id, exercise])).values(),
    );

    onSave({
      id: `custom-${Date.now()}`,
      title: title.trim(),
      subtitle: `A custom ${goal.toLowerCase()} routine built around your selected movements.`,
      environment: "Gym",
      level: "Intermediate",
      eligibleLevels: ["intermediate", "advanced", "athlete"],
      durationWeeks: 6,
      sessionsPerWeek: schedule.length,
      target: goal,
      imageUrl:
        "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=88",
      exercises: selectedExercises,
      schedule,
    });
    onClose();
  }

  return (
    <BaseSheet eyebrow="Custom training" onClose={onClose} title="Program builder" visible={visible}>
      <ScrollView
        contentContainerClassName="gap-6 px-5 pb-8 pt-5"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text className="mb-2 text-xs font-black uppercase text-ash">Program name</Text>
          <TextInput
            accessibilityLabel="Program name"
            className="h-14 rounded-lg border border-line bg-graphite px-4 text-sm font-black text-bone"
            onChangeText={setTitle}
            placeholder="Name your training block"
            placeholderTextColor={colors.muted}
            value={title}
          />
        </View>

        <View>
          <Text className="mb-3 text-xs font-black uppercase text-ash">Primary goal</Text>
          <View className="flex-row gap-2">
            {["Strength", "Muscle", "Conditioning"].map((item) => (
              <Pressable
                accessibilityState={{ selected: goal === item }}
                className={`h-12 flex-1 items-center justify-center rounded-md border ${
                  goal === item ? "border-electric bg-electric" : "border-line bg-graphite"
                }`}
                key={item}
                onPress={() => setGoal(item)}
              >
                <Text className={`text-xs font-black ${goal === item ? "text-white" : "text-steel"}`}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-xs font-black uppercase text-ash">Training days</Text>
            <Text className="text-sm font-black text-electric">
              {selectedWeekdays.length} days / week
            </Text>
          </View>
          <View className="flex-row gap-1.5">
            {trainingWeekdays.map((day) => {
              const selected = selectedWeekdays.includes(day.weekday);
              return (
              <Pressable
                accessibilityLabel={day.label}
                accessibilityState={{ selected }}
                className={`h-11 flex-1 items-center justify-center rounded-md border ${
                  selected ? "border-electric bg-electric" : "border-line bg-graphite"
                }`}
                key={day.weekday}
                onPress={() => toggleWeekday(day.weekday)}
              >
                <Text className={`text-[10px] font-black ${selected ? "text-white" : "text-steel"}`}>
                  {day.short}
                </Text>
              </Pressable>
            )})}
          </View>
          <Text className="mt-2 text-xs leading-5 text-ash">
            Select the exact days you train. Each selected day gets its own exercise list.
          </Text>
        </View>

        <View>
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-xs font-black uppercase text-ash">Build each day</Text>
            <Text className="text-xs font-black text-electric">
              {activeExerciseIds.length} exercises
            </Text>
          </View>
          <ScrollView
            horizontal
            contentContainerClassName="gap-2 pb-3"
            showsHorizontalScrollIndicator={false}
          >
            {trainingWeekdays
              .filter((day) => selectedWeekdays.includes(day.weekday))
              .map((day) => {
                const active = day.weekday === activeWeekday;
                return (
                  <Pressable
                    accessibilityState={{ selected: active }}
                    className={`rounded-full border px-4 py-2 ${
                      active ? "border-electric bg-electric" : "border-line bg-graphite"
                    }`}
                    key={day.weekday}
                    onPress={() => setActiveWeekday(day.weekday)}
                  >
                    <Text className={`text-xs font-black ${active ? "text-white" : "text-steel"}`}>
                      {day.short}
                    </Text>
                  </Pressable>
                );
              })}
          </ScrollView>
          <TextInput
            accessibilityLabel={`${activeDay.label} workout name`}
            className="mb-3 h-12 rounded-lg border border-line bg-graphite px-4 text-sm font-black text-bone"
            onChangeText={(value) =>
              setDayLabels((current) => ({ ...current, [activeWeekday]: value }))
            }
            placeholder={`${activeDay.label} workout`}
            placeholderTextColor={colors.muted}
            value={dayLabels[activeWeekday] ?? ""}
          />
          <View className="gap-2">
            {exercises.map((exercise) => {
              const selected = activeExerciseIds.includes(exercise.id);
              return (
                <Pressable
                  accessibilityState={{ selected }}
                  className={`flex-row items-center gap-3 rounded-lg border p-3 ${
                    selected ? "border-electric bg-electric/10" : "border-line bg-graphite"
                  }`}
                  key={exercise.id}
                  onPress={() => toggleExercise(exercise.id)}
                >
                  <Image
                    className="h-14 w-14 rounded-md bg-bone"
                    resizeMode="cover"
                    source={{ uri: exercise.gifUrl }}
                  />
                  <View className="min-w-0 flex-1">
                    <Text className="font-black text-bone" numberOfLines={1}>
                      {exercise.name}
                    </Text>
                    <Text className="mt-1 text-xs text-ash">
                      {exercise.targetMuscle} · {exercise.sets} sets
                    </Text>
                  </View>
                  <View
                    className={`h-7 w-7 items-center justify-center rounded-md ${
                      selected ? "bg-electric" : "border border-line"
                    }`}
                  >
                    {selected ? <Check color={colors.background} size={16} strokeWidth={3} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={!canSave}
          onPress={saveProgram}
          className={`h-16 flex-row items-center justify-center gap-2 rounded-lg bg-electric ${
            canSave ? "" : "opacity-35"
          }`}
        >
          <Save color={colors.background} size={20} />
          <Text className="text-sm font-black uppercase text-white">Create program</Text>
        </Pressable>
      </ScrollView>
    </BaseSheet>
  );
}

export function WeightLogSheet({
  visible,
  currentWeight,
  onClose,
  onSave,
}: {
  visible: boolean;
  currentWeight: number;
  onClose: () => void;
  onSave: (weight: number) => void;
}) {
  const [value, setValue] = useState(currentWeight.toFixed(1));

  useEffect(() => {
    if (visible) {
      setValue(currentWeight.toFixed(1));
    }
  }, [currentWeight, visible]);

  const numericValue = Number(value.replace(",", "."));
  const isValid = Number.isFinite(numericValue) && numericValue >= 35 && numericValue <= 250;

  return (
    <BaseSheet eyebrow="Body metrics" onClose={onClose} title="Log body weight" visible={visible}>
      <View className="gap-5 px-5 pb-8 pt-5">
        <View className="items-center rounded-lg border border-line bg-graphite p-6">
          <View className="h-14 w-14 items-center justify-center rounded-md bg-electric">
            <Weight color={colors.background} size={25} />
          </View>
          <Text className="mt-4 text-xs font-black uppercase text-ash">Today's measurement</Text>
          <View className="mt-3 flex-row items-end justify-center">
            <TextInput
              accessibilityLabel="Current weight in kilograms"
              className="min-w-[160px] text-center text-5xl font-black text-bone"
              inputMode="decimal"
              onChangeText={setValue}
              selectTextOnFocus
              value={value}
            />
            <Text className="mb-2 text-lg font-black text-ash">kg</Text>
          </View>
          <Text className="mt-3 text-center text-xs leading-5 text-ash">
            Apex uses this entry only for your body-weight history and change over time.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={!isValid}
          onPress={() => {
            onSave(Math.round(numericValue * 10) / 10);
            onClose();
          }}
          className={`h-16 flex-row items-center justify-center gap-2 rounded-lg bg-electric ${
            isValid ? "" : "opacity-35"
          }`}
        >
          <Check color={colors.background} size={21} strokeWidth={3} />
          <Text className="text-sm font-black uppercase text-white">Save measurement</Text>
        </Pressable>
      </View>
    </BaseSheet>
  );
}

export function ProfileEditorSheet({
  visible,
  profile,
  onClose,
  onSave,
}: {
  visible: boolean;
  profile: AthleteProfile;
  onClose: () => void;
  onSave: (profile: AthleteProfile) => void;
}) {
  const [name, setName] = useState(profile.name);
  const [weight, setWeight] = useState(String(profile.weight));
  const [height, setHeight] = useState(String(profile.height));

  useEffect(() => {
    if (visible) {
      setName(profile.name);
      setWeight(String(profile.weight));
      setHeight(String(profile.height));
    }
  }, [profile, visible]);

  const nextWeight = Number(weight.replace(",", "."));
  const nextHeight = Number(height);
  const isValid =
    name.trim().length >= 2 &&
    Number.isFinite(nextWeight) &&
    nextWeight >= 35 &&
    Number.isFinite(nextHeight) &&
    nextHeight >= 120;

  return (
    <BaseSheet eyebrow="Athlete identity" onClose={onClose} title="Edit profile" visible={visible}>
      <ScrollView
        contentContainerClassName="gap-5 px-5 pb-8 pt-5"
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center">
          <View className="h-20 w-20 items-center justify-center rounded-lg bg-electric">
            <UserRound color={colors.background} size={31} strokeWidth={2.4} />
          </View>
        </View>
        <FormField label="Full name" onChangeText={setName} value={name} />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <FormField
              inputMode="decimal"
              label="Weight (kg)"
              onChangeText={setWeight}
              value={weight}
            />
          </View>
          <View className="flex-1">
            <FormField
              inputMode="numeric"
              label="Height (cm)"
              onChangeText={setHeight}
              value={height}
            />
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={!isValid}
          onPress={() => {
            onSave({
              ...profile,
              name: name.trim(),
              weight: Math.round(nextWeight * 10) / 10,
              height: Math.round(nextHeight),
            });
            onClose();
          }}
          className={`h-16 flex-row items-center justify-center gap-2 rounded-lg bg-electric ${
            isValid ? "" : "opacity-35"
          }`}
        >
          <Save color={colors.background} size={20} />
          <Text className="text-sm font-black uppercase text-white">Save profile</Text>
        </Pressable>
      </ScrollView>
    </BaseSheet>
  );
}

export function DailyTargetsSheet({
  visible,
  targets,
  onClose,
  onSave,
}: {
  visible: boolean;
  targets: DailyTargets;
  onClose: () => void;
  onSave: (targets: DailyTargets) => void;
}) {
  const [calories, setCalories] = useState(String(targets.calories));
  const [protein, setProtein] = useState(String(targets.protein));

  useEffect(() => {
    if (visible) {
      setCalories(String(targets.calories));
      setProtein(String(targets.protein));
    }
  }, [targets, visible]);

  const nextCalories = Number(calories);
  const nextProtein = Number(protein);
  const isValid = nextCalories >= 1200 && nextCalories <= 6000 && nextProtein >= 40 && nextProtein <= 400;

  return (
    <BaseSheet eyebrow="Nutrition targets" onClose={onClose} title="Daily performance fuel" visible={visible}>
      <View className="gap-5 px-5 pb-8 pt-5">
        <View className="rounded-lg border border-line bg-graphite p-4">
          <View className="flex-row items-center gap-3">
            <Flame color={colors.accent} size={20} />
            <View>
              <Text className="font-black text-bone">Calories</Text>
              <Text className="mt-1 text-xs text-ash">Energy available for training and recovery</Text>
            </View>
          </View>
          <TextInput
            accessibilityLabel="Daily calories"
            className="mt-4 h-14 rounded-md border border-line bg-carbon px-4 text-2xl font-black text-bone"
            inputMode="numeric"
            onChangeText={setCalories}
            value={calories}
          />
        </View>
        <View className="rounded-lg border border-line bg-graphite p-4">
          <View className="flex-row items-center gap-3">
            <BicepsFlexed color={colors.accent} size={20} />
            <View>
              <Text className="font-black text-bone">Protein</Text>
              <Text className="mt-1 text-xs text-ash">Daily recovery and muscle-building target in grams</Text>
            </View>
          </View>
          <TextInput
            accessibilityLabel="Daily protein"
            className="mt-4 h-14 rounded-md border border-line bg-carbon px-4 text-2xl font-black text-bone"
            inputMode="numeric"
            onChangeText={setProtein}
            value={protein}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={!isValid}
          onPress={() => {
            onSave({ calories: Math.round(nextCalories), protein: Math.round(nextProtein) });
            onClose();
          }}
          className={`h-16 items-center justify-center rounded-lg bg-electric ${
            isValid ? "" : "opacity-35"
          }`}
        >
          <Text className="text-sm font-black uppercase text-white">Update targets</Text>
        </Pressable>
      </View>
    </BaseSheet>
  );
}

const settingsContent: Record<
  SettingsPage,
  {
    title: string;
    eyebrow: string;
    icon: React.ReactNode;
    description: string;
    options: string[];
  }
> = {
  health: {
    title: "Health and medical profile",
    eyebrow: "Safety controls",
    icon: <HeartPulse color={colors.signal} size={24} />,
    description:
      "Your plan currently allows standard strength training. Update restrictions before starting a new block.",
    options: ["No current restrictions", "Shoulder load monitoring", "Low-impact substitutions"],
  },
  equipment: {
    title: "Equipment profile",
    eyebrow: "Training setup",
    icon: <Dumbbell color={colors.accent} size={24} />,
    description:
      "Apex uses your available equipment to filter exercise suggestions. You approve every change.",
    options: ["Full commercial gym", "Dumbbells and bench", "Bodyweight only"],
  },
  privacy: {
    title: "Privacy and data",
    eyebrow: "Account controls",
    icon: <LockKeyhole color={colors.steel} size={24} />,
    description:
      "Control which performance signals are used for recommendations and exports.",
    options: ["Workout analytics", "Body metrics", "Anonymous product improvement"],
  },
  help: {
    title: "Help center",
    eyebrow: "Apex support",
    icon: <CircleHelp color={colors.cyan} size={24} />,
    description:
      "Browse common training questions or send a support request from your account.",
    options: ["Workout and exercise safety", "Subscription and billing", "Contact Apex support"],
  },
};

export function SettingsDetailSheet({
  page,
  preferences,
  onClose,
  onSave,
}: {
  page: SettingsPage | null;
  preferences: SettingsPreferences;
  onClose: () => void;
  onSave: (preferences: SettingsPreferences) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const content = page ? settingsContent[page] : null;

  useEffect(() => {
    if (page === "health") {
      setSelected(preferences.health);
    } else if (page === "equipment") {
      setSelected([preferences.equipment]);
    } else if (page === "privacy") {
      setSelected(preferences.privacy);
    } else {
      setSelected([]);
    }
  }, [page, preferences]);

  if (!content) {
    return null;
  }

  const toggleOption = (option: string) => {
    if (process.env.EXPO_OS !== "web") {
      void Haptics.selectionAsync();
    }

    if (page === "equipment" || page === "help") {
      setSelected([option]);
      return;
    }

    if (page === "health" && option === "No current restrictions") {
      setSelected([option]);
      return;
    }

    setSelected((current) => {
      const withoutClearance =
        page === "health"
          ? current.filter((item) => item !== "No current restrictions")
          : current;

      return withoutClearance.includes(option)
        ? withoutClearance.filter((item) => item !== option)
        : [...withoutClearance, option];
    });
  };

  const saveSelection = () => {
    if (page === "health") {
      onSave({
        ...preferences,
        health: selected.length > 0 ? selected : ["No current restrictions"],
      });
    } else if (page === "equipment") {
      onSave({
        ...preferences,
        equipment: selected[0] ?? preferences.equipment,
      });
    } else if (page === "privacy") {
      onSave({
        ...preferences,
        privacy: selected,
      });
    }
    onClose();
  };

  const healthIsClear =
    page === "health" && selected.includes("No current restrictions");

  return (
    <BaseSheet
      eyebrow={content.eyebrow}
      onClose={onClose}
      title={content.title}
      visible={Boolean(page)}
    >
      <View className="gap-5 px-5 pb-8 pt-5">
        <View className="rounded-lg border border-line bg-graphite p-5">
          <View className="h-12 w-12 items-center justify-center rounded-md bg-carbon">
            {content.icon}
          </View>
          <Text className="mt-4 text-sm leading-6 text-steel">{content.description}</Text>
        </View>
        <View className="overflow-hidden rounded-lg border border-line bg-graphite">
          {content.options.map((option) => (
            <Pressable
              accessibilityLabel={option}
              accessibilityRole={page === "help" ? "button" : "checkbox"}
              accessibilityState={
                page === "help" ? undefined : { checked: selected.includes(option) }
              }
              className="flex-row items-center gap-3 border-b border-line p-4"
              key={option}
              onPress={() => toggleOption(option)}
            >
              <View
                className={`h-6 w-6 items-center justify-center rounded-md ${
                  selected.includes(option) ? "bg-electric" : "border border-line"
                }`}
              >
                {selected.includes(option) ? (
                  <Check color={colors.background} size={14} strokeWidth={3} />
                ) : null}
              </View>
              <Text className="min-w-0 flex-1 text-sm font-black text-bone">{option}</Text>
              {page === "help" ? <ChevronRight color={colors.muted} size={17} /> : null}
            </Pressable>
          ))}
        </View>
        {page === "health" ? (
          <View
            className={`rounded-lg border p-4 ${
              healthIsClear ? "border-signal/35 bg-signal/10" : "border-caution/35 bg-caution/10"
            }`}
          >
            <View className="flex-row items-center gap-2">
              <ShieldCheck color={healthIsClear ? colors.signal : colors.caution} size={18} />
              <Text
                className={`text-xs font-black uppercase ${
                  healthIsClear ? "text-signal" : "text-caution"
                }`}
              >
                {healthIsClear ? "Training access cleared" : "Training controls active"}
              </Text>
            </View>
            <Text className="mt-2 text-xs leading-5 text-steel">
              {healthIsClear
                ? "Severe or restricting conditions will block strenuous programs and display physician guidance."
                : "Apex will keep these restrictions visible so you can choose safer exercises and lighter sessions."}
            </Text>
          </View>
        ) : null}
        {page === "help" && selected.length > 0 ? (
          <View className="rounded-lg border border-electric/30 bg-electric/5 p-4">
            <Text className="text-xs font-black uppercase text-electric">Support topic selected</Text>
            <Text className="mt-2 text-sm font-black text-bone">{selected[0]}</Text>
            <Text className="mt-2 text-xs leading-5 text-steel">
              Your support request is ready. Account and device details will be attached when support messaging is connected.
            </Text>
          </View>
        ) : null}
        {page !== "help" ? (
          <Pressable
            accessibilityRole="button"
            className="h-16 items-center justify-center rounded-lg bg-electric"
            onPress={saveSelection}
          >
            <Text className="text-sm font-black uppercase text-white">Save changes</Text>
          </Pressable>
        ) : null}
      </View>
    </BaseSheet>
  );
}

function FormField({
  label,
  value,
  inputMode,
  accessibilityLabel,
  onChangeText,
}: {
  label: string;
  value: string;
  inputMode?: "text" | "numeric" | "decimal";
  accessibilityLabel?: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View>
      <Text className="mb-2 text-xs font-black uppercase text-ash">{label}</Text>
      <TextInput
        accessibilityLabel={accessibilityLabel ?? label}
        className="h-14 rounded-[22px] border border-line bg-white px-4 text-sm font-black text-bone"
        inputMode={inputMode}
        onChangeText={onChangeText}
        value={value}
        style={{ boxShadow: "0 16px 32px rgba(17, 19, 24, 0.08)" }}
      />
    </View>
  );
}
