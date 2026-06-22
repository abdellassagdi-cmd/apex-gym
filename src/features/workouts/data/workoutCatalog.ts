import type { MuscleGroup } from "../types";
import { getExercisesByIds } from "./exerciseLibrary";

export type TrainingEnvironment = "Gym" | "Home" | "Mobility";

export type TrainingWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type ProgramScheduleDay = {
  weekday: TrainingWeekday;
  label: string;
  exercises: ReturnType<typeof getExercisesByIds>;
};

export type TrainingProgram = {
  id: string;
  title: string;
  subtitle: string;
  environment: TrainingEnvironment;
  level: "Beginner" | "Intermediate" | "Advanced";
  eligibleLevels: Array<"beginner" | "intermediate" | "advanced" | "athlete">;
  durationWeeks: number;
  sessionsPerWeek: number;
  target: string;
  imageUrl: string;
  featured?: boolean;
  adminCurated?: boolean;
  exercises: ReturnType<typeof getExercisesByIds>;
  schedule: ProgramScheduleDay[];
};

function createSchedule(
  exercises: ReturnType<typeof getExercisesByIds>,
  weekdays: TrainingWeekday[],
  labels: string[],
  perDay = 4,
): ProgramScheduleDay[] {
  return weekdays.map((weekday, index) => {
    const offset = index % Math.max(exercises.length, 1);
    const ordered = [...exercises.slice(offset), ...exercises.slice(0, offset)];

    return {
      weekday,
      label: labels[index] ?? `Workout ${index + 1}`,
      exercises: ordered.slice(0, Math.min(perDay, ordered.length)),
    };
  });
}

const upperPowerPool = getExercisesByIds([
  "ex-bench-press",
  "ex-incline-dumbbell-press",
  "ex-incline-row",
  "ex-lat-pulldown",
  "ex-standing-press",
  "ex-face-pull",
  "ex-triceps-pressdown",
  "ex-incline-curl",
]);

const athleticFoundationPool = getExercisesByIds([
  "ex-goblet-squat",
  "ex-incline-dumbbell-press",
  "ex-band-row",
  "ex-glute-bridge-march",
  "ex-pike-push-up",
  "ex-dead-bug",
]);

const hypertrophyPool = getExercisesByIds([
  "ex-bench-press",
  "ex-cable-fly",
  "ex-pull-up",
  "ex-seated-row",
  "ex-seated-shoulder-press",
  "ex-lateral-raise",
  "ex-hammer-curl",
  "ex-overhead-triceps",
  "ex-back-squat",
  "ex-rdl",
  "ex-leg-press",
  "ex-seated-leg-curl",
  "ex-hip-thrust",
  "ex-calf-raise",
  "ex-cable-wood-chop",
]);

const recompositionPool = getExercisesByIds([
  "ex-goblet-squat",
  "ex-incline-dumbbell-press",
  "ex-lat-pulldown",
  "ex-kettlebell-swing",
  "ex-walking-lunge",
  "ex-pike-push-up",
  "ex-plank-shoulder-tap",
  "ex-mountain-climber",
]);

const lowerForcePool = getExercisesByIds([
  "ex-back-squat",
  "ex-leg-press",
  "ex-rdl",
  "ex-seated-leg-curl",
  "ex-hip-thrust",
  "ex-calf-raise",
  "ex-hanging-knee-raise",
  "ex-cable-wood-chop",
]);

const homeStrengthPool = getExercisesByIds([
  "ex-deficit-push-up",
  "ex-band-row",
  "ex-goblet-squat",
  "ex-single-leg-rdl",
  "ex-pike-push-up",
  "ex-glute-bridge-march",
  "ex-dead-bug",
  "ex-mountain-climber",
]);

const conditioningPool = getExercisesByIds([
  "ex-kettlebell-swing",
  "ex-mountain-climber",
  "ex-walking-lunge",
  "ex-deficit-push-up",
  "ex-band-row",
  "ex-plank-shoulder-tap",
  "ex-hanging-knee-raise",
]);

const mobilityPool = getExercisesByIds([
  "ex-worlds-greatest-stretch",
  "ex-hip-switch",
  "ex-open-book",
  "ex-couch-stretch",
  "ex-ankle-rocker",
  "ex-glute-bridge-march",
]);

export const trainingPrograms: TrainingProgram[] = [
  {
    id: "upper-power",
    title: "Upper Power",
    subtitle: "Build pressing strength while keeping shoulder volume clean and sustainable.",
    environment: "Gym",
    level: "Intermediate",
    eligibleLevels: ["intermediate", "advanced", "athlete"],
    durationWeeks: 6,
    sessionsPerWeek: 4,
    target: "Upper strength",
    imageUrl:
      "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=88",
    featured: true,
    adminCurated: true,
    exercises: upperPowerPool,
    schedule: createSchedule(
      upperPowerPool,
      [2, 3, 5, 7],
      ["Upper strength", "Back + arms", "Pressing volume", "Full upper"],
    ),
  },
  {
    id: "athletic-foundation",
    title: "Athletic Foundation",
    subtitle: "A balanced beginner block that teaches clean compound patterns first.",
    environment: "Gym",
    level: "Beginner",
    eligibleLevels: ["beginner", "intermediate"],
    durationWeeks: 8,
    sessionsPerWeek: 3,
    target: "Full body",
    imageUrl:
      "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1200&q=88",
    featured: true,
    exercises: athleticFoundationPool,
    schedule: createSchedule(
      athleticFoundationPool,
      [2, 4, 6],
      ["Foundation A", "Foundation B", "Foundation C"],
    ),
  },
  {
    id: "hypertrophy-system",
    title: "Hypertrophy System",
    subtitle: "High-quality weekly volume with enough structure for advanced lifters.",
    environment: "Gym",
    level: "Advanced",
    eligibleLevels: ["advanced", "athlete"],
    durationWeeks: 10,
    sessionsPerWeek: 5,
    target: "Muscle gain",
    imageUrl:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=88",
    exercises: hypertrophyPool,
    schedule: createSchedule(
      hypertrophyPool,
      [2, 3, 4, 5, 6],
      ["Push alpha", "Pull density", "Legs heavy", "Shoulders + arms", "Posterior chain"],
    ),
  },
  {
    id: "lean-recomp",
    title: "Lean Recomp",
    subtitle: "Tighter rest windows and dense sessions for body recomposition and fat loss.",
    environment: "Gym",
    level: "Intermediate",
    eligibleLevels: ["intermediate", "advanced", "athlete"],
    durationWeeks: 6,
    sessionsPerWeek: 4,
    target: "Fat loss",
    imageUrl:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=88",
    featured: true,
    exercises: recompositionPool,
    schedule: createSchedule(
      recompositionPool,
      [2, 3, 5, 7],
      ["Density upper", "Lower burn", "Conditioning mix", "Athletic circuit"],
    ),
  },
  {
    id: "lower-force",
    title: "Lower Force",
    subtitle: "A lower-body biased phase for stronger legs, glutes, and trunk stiffness.",
    environment: "Gym",
    level: "Advanced",
    eligibleLevels: ["advanced", "athlete"],
    durationWeeks: 7,
    sessionsPerWeek: 4,
    target: "Leg strength",
    imageUrl:
      "https://images.unsplash.com/photo-1541534401786-2077eed87a72?auto=format&fit=crop&w=1200&q=88",
    exercises: lowerForcePool,
    schedule: createSchedule(
      lowerForcePool,
      [2, 4, 6, 7],
      ["Squat focus", "Posterior chain", "Single-leg power", "Core + calves"],
    ),
  },
  {
    id: "home-strength",
    title: "Home Strength",
    subtitle: "Minimal-equipment sessions for consistency, posture, and full-body strength.",
    environment: "Home",
    level: "Beginner",
    eligibleLevels: ["beginner", "intermediate"],
    durationWeeks: 4,
    sessionsPerWeek: 4,
    target: "Full body",
    imageUrl:
      "https://images.unsplash.com/photo-1609899464726-209befaac5bc?auto=format&fit=crop&w=1200&q=88",
    featured: true,
    adminCurated: true,
    exercises: homeStrengthPool,
    schedule: createSchedule(
      homeStrengthPool,
      [2, 3, 5, 7],
      ["Home A", "Home B", "Home C", "Home finisher"],
    ),
  },
  {
    id: "express-conditioning",
    title: "Express Conditioning",
    subtitle: "Short sessions that build work capacity without wrecking recovery.",
    environment: "Home",
    level: "Intermediate",
    eligibleLevels: ["intermediate", "advanced", "athlete"],
    durationWeeks: 5,
    sessionsPerWeek: 3,
    target: "Conditioning",
    imageUrl:
      "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1200&q=88",
    exercises: conditioningPool,
    schedule: createSchedule(
      conditioningPool,
      [2, 4, 6],
      ["Engine builder", "Athletic core", "Sweat circuit"],
    ),
  },
  {
    id: "restore-move",
    title: "Restore + Move",
    subtitle: "Mobility sessions tuned to stiff hips, shoulders, and training fatigue.",
    environment: "Mobility",
    level: "Beginner",
    eligibleLevels: ["beginner", "intermediate", "advanced", "athlete"],
    durationWeeks: 4,
    sessionsPerWeek: 5,
    target: "Recovery",
    imageUrl:
      "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?auto=format&fit=crop&w=1200&q=88",
    featured: true,
    exercises: mobilityPool,
    schedule: createSchedule(
      mobilityPool,
      [2, 3, 4, 5, 6],
      ["Mobility flow", "Upper reset", "Hip restore", "Desk opener", "Full-body downshift"],
      3,
    ),
  },
  {
    id: "mobility-primer",
    title: "Mobility Primer",
    subtitle: "Short reset blocks for lifters who want clean warmups before hard training.",
    environment: "Mobility",
    level: "Intermediate",
    eligibleLevels: ["intermediate", "advanced", "athlete"],
    durationWeeks: 3,
    sessionsPerWeek: 3,
    target: "Warm-up",
    imageUrl:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=88",
    exercises: mobilityPool,
    schedule: createSchedule(
      mobilityPool,
      [2, 4, 6],
      ["Upper mobility", "Lower mobility", "Pre-lift reset"],
      3,
    ),
  },
];

export const muscleFilters: Array<{ id: "all" | MuscleGroup; label: string }> = [
  { id: "all", label: "All" },
  { id: "chest", label: "Chest" },
  { id: "back", label: "Back" },
  { id: "shoulders", label: "Shoulders" },
  { id: "arms", label: "Arms" },
  { id: "core", label: "Core" },
  { id: "quads", label: "Quads" },
  { id: "hamstrings", label: "Hamstrings" },
  { id: "glutes", label: "Glutes" },
  { id: "calves", label: "Calves" },
];
