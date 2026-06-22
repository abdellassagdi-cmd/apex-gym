export type FitnessLevel = "beginner" | "intermediate" | "advanced" | "athlete";

export type Gender = "male" | "female";

export type FocusArea = "arms" | "shoulders" | "chest" | "core" | "legs" | "full_body";

export type MainGoal = "lose_weight" | "build_muscle" | "keep_fit" | "mobility";

export type WorkoutIntensity = "easy" | "light_sweat" | "challenging";

export type StatementAnswer = "yes" | "no";

export type MedicalCondition =
  | "none"
  | "controlled_asthma"
  | "pregnancy"
  | "hypertension"
  | "heart_condition"
  | "chest_pain"
  | "recent_surgery"
  | "fainting_or_dizziness"
  | "severe_joint_injury";

export type OnboardingHealthProfile = {
  age: number;
  weightKg: number;
  fitnessLevel: FitnessLevel;
  medicalConditions: MedicalCondition[];
};

export type OnboardingProfile = OnboardingHealthProfile & {
  gender: Gender | null;
  focusAreas: FocusArea[];
  mainGoal: MainGoal | null;
  birthYear: number;
  heightCm: number;
  targetWeightKg: number;
  targetShapeLevel: number;
  role: string | null;
  injuries: string[];
  activityLevel: number;
  workoutDaysPerWeek: number;
  preferredIntensity: WorkoutIntensity | null;
  activities: string[];
  motivation: string[];
  statementAnswer: StatementAnswer | null;
  reward: string | null;
};
