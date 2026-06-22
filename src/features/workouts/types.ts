export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "arms"
  | "core"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves";

export type FatigueState = "recovered" | "primed" | "fatigued" | "overloaded";

export type MuscleReadiness = {
  id: MuscleGroup;
  label: string;
  state: FatigueState;
  recoveryPercent: number;
  isTargetedToday: boolean;
};

export type Exercise = {
  id: string;
  exerciseDbId: string;
  name: string;
  targetMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: string;
  sets: number;
  reps: string;
  weight: string;
  restSeconds: number;
  tempo: string;
  intensity: "strength" | "hypertrophy" | "conditioning";
  eligibleLevels: Array<"beginner" | "intermediate" | "advanced" | "athlete">;
  gifUrl: string;
  videoUrl?: string | null;
  coachCue: string;
  instructions: string[];
};

export type WorkoutDay = {
  date: string;
  dayLabel: string;
  dayNumber: string;
  focus: string;
  isToday: boolean;
};

export type AthleteProgress = {
  xp: number;
  nextLevelXp: number;
  streakDays: number;
  league: string;
  rank: number;
  badge: "platinum" | "titanium" | "onyx";
};

export type DailyWorkout = {
  id: string;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  accentColor: string;
  days: WorkoutDay[];
  exercises: Exercise[];
};
