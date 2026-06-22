import { colors } from "../../../theme/colors";
import type { DailyWorkout, WorkoutDay } from "../types";
import { getExercisesByIds } from "./exerciseLibrary";

const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const focusCycle = ["Mobility", "Push", "Pull", "Legs", "Recovery", "Power", "Core"];

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildPlannerDays(): WorkoutDay[] {
  const today = new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index - 1);

    return {
      date: toIsoDate(date),
      dayLabel: dayNames[date.getDay()],
      dayNumber: String(date.getDate()).padStart(2, "0"),
      focus: focusCycle[index],
      isToday: index === 1,
    };
  });
}

export const todayWorkout: DailyWorkout = {
  id: "admin-plan-upper-power-a",
  title: "Upper Power Architecture",
  subtitle: "Admin curated: strength-biased push session",
  estimatedMinutes: 54,
  accentColor: colors.accent,
  days: buildPlannerDays(),
  exercises: getExercisesByIds([
    "ex-bench-press",
    "ex-incline-row",
    "ex-standing-press",
    "ex-cable-fly",
    "ex-triceps-pressdown",
  ]),
};
