import type { MedicalCondition, OnboardingHealthProfile } from "../types";

const blockingConditions = new Set<MedicalCondition>([
  "heart_condition",
  "chest_pain",
  "recent_surgery",
  "fainting_or_dizziness",
]);

const restrictedConditions = new Set<MedicalCondition>([
  "pregnancy",
  "hypertension",
  "severe_joint_injury",
]);

export type MedicalClearance =
  | {
      status: "cleared";
      allowedIntensity: "standard";
      message: string;
    }
  | {
      status: "restricted";
      allowedIntensity: "low";
      message: string;
    }
  | {
      status: "blocked";
      allowedIntensity: "none";
      message: string;
    };

export function assessMedicalClearance(
  profile: OnboardingHealthProfile,
): MedicalClearance {
  if (
    profile.age < 13 ||
    profile.medicalConditions.some((condition) => blockingConditions.has(condition))
  ) {
    return {
      status: "blocked",
      allowedIntensity: "none",
      message:
        "For your safety, strenuous training is locked until a physician clears you for exercise.",
    };
  }

  if (profile.medicalConditions.some((condition) => restrictedConditions.has(condition))) {
    return {
      status: "restricted",
      allowedIntensity: "low",
      message:
        "Your plan should stay low impact until a qualified clinician confirms your training limits.",
    };
  }

  return {
    status: "cleared",
    allowedIntensity: "standard",
    message: "You are cleared for standard program recommendations.",
  };
}
