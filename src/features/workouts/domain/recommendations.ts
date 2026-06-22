import type { MainGoal, OnboardingProfile } from "../../onboarding/types";
import type { AthleteProfile, DailyTargets } from "../components/ManagementSheets";
import type { TrainingProgram, TrainingWeekday } from "../data/workoutCatalog";

const defaultWeekdays: TrainingWeekday[] = [2, 4, 6];

function titleCaseLevel(level: OnboardingProfile["fitnessLevel"]): AthleteProfile["fitnessLevel"] {
  if (level === "athlete") {
    return "Athlete";
  }

  return `${level.charAt(0).toUpperCase()}${level.slice(1)}` as AthleteProfile["fitnessLevel"];
}

function formatGoal(goal: MainGoal | null): string {
  switch (goal) {
    case "lose_weight":
      return "Fat loss";
    case "build_muscle":
      return "Muscle gain";
    case "mobility":
      return "Mobility";
    case "keep_fit":
      return "Performance";
    default:
      return "General fitness";
  }
}

function formatIntensity(
  intensity: OnboardingProfile["preferredIntensity"],
): AthleteProfile["preferredIntensity"] {
  switch (intensity) {
    case "easy":
      return "Easy";
    case "light_sweat":
      return "Light sweat";
    case "challenging":
      return "Challenging";
    default:
      return "Progressive";
  }
}

export function buildReminderWeekdays(count: number): TrainingWeekday[] {
  const safeCount = Math.max(2, Math.min(5, Math.round(count || defaultWeekdays.length)));
  const patterns: Record<number, TrainingWeekday[]> = {
    2: [2, 5],
    3: [2, 4, 6],
    4: [2, 3, 5, 7],
    5: [2, 3, 4, 6, 7],
  };

  return patterns[safeCount] ?? defaultWeekdays;
}

export function buildDailyTargets(profile: OnboardingProfile): DailyTargets {
  const proteinMultiplier =
    profile.mainGoal === "build_muscle" ? 2.2 : profile.mainGoal === "lose_weight" ? 2.0 : 1.8;
  const caloriesBase = Math.round(profile.weightKg * 29 + profile.activityLevel * 120);
  const calorieAdjustment =
    profile.mainGoal === "build_muscle"
      ? 240
      : profile.mainGoal === "lose_weight"
        ? -280
        : profile.mainGoal === "mobility"
          ? -40
          : 80;

  return {
    calories: Math.max(1700, Math.round((caloriesBase + calorieAdjustment) / 10) * 10),
    protein: Math.max(100, Math.round(profile.weightKg * proteinMultiplier)),
  };
}

export function buildAthleteProfile(profile: OnboardingProfile): AthleteProfile {
  return {
    fitnessLevel: titleCaseLevel(profile.fitnessLevel),
    goal: formatGoal(profile.mainGoal),
    height: profile.heightCm,
    name: profile.name?.trim() || "Apex Member",
    preferredIntensity: formatIntensity(profile.preferredIntensity),
    trainingDaysPerWeek: profile.workoutDaysPerWeek,
    weight: profile.weightKg,
  };
}

export function recommendProgramId(
  profile: OnboardingProfile,
  programs: TrainingProgram[],
): string | null {
  const programsById = new Map(programs.map((program) => [program.id, program]));

  const exactByGoal = (() => {
    if (profile.mainGoal === "mobility") {
      return "restore-move";
    }
    if (profile.mainGoal === "lose_weight") {
      return profile.workoutDaysPerWeek >= 4 ? "lean-recomp" : "express-conditioning";
    }
    if (profile.mainGoal === "build_muscle") {
      if (profile.fitnessLevel === "advanced" || profile.fitnessLevel === "athlete") {
        return profile.workoutDaysPerWeek >= 5 ? "hypertrophy-system" : "upper-power";
      }
      return profile.workoutDaysPerWeek <= 3 ? "athletic-foundation" : "upper-power";
    }
    if (profile.workoutDaysPerWeek <= 3) {
      return "athletic-foundation";
    }
    if (profile.activities.includes("home")) {
      return "home-strength";
    }
    return profile.fitnessLevel === "beginner" ? "athletic-foundation" : "upper-power";
  })();

  if (exactByGoal && programsById.has(exactByGoal)) {
    return exactByGoal;
  }

  return programs[0]?.id ?? null;
}
