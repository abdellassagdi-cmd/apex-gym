import { supabase } from "../../../lib/supabase";
import type {
  AthleteProfile,
  SettingsPreferences,
  WorkoutReminderSettings,
} from "../components/ManagementSheets";
import type { CompletedWorkoutSession } from "../components/WorkoutSessionOverlay";

type ProfileRow = {
  fitness_level: AthleteProfile["fitnessLevel"];
  goal: string;
  height: number;
  name: string;
  preferred_intensity: AthleteProfile["preferredIntensity"];
  training_days_per_week: number;
  user_id: string;
  weight: number;
};

type SettingsRow = {
  equipment: string;
  health: string[];
  privacy: string[];
  reminder: WorkoutReminderSettings;
  user_id: string;
};

type SessionRow = {
  completed_at: string;
  exercise_count: number;
  id: string;
  title: string;
  total_sets: number;
  user_id: string;
};

export type CloudUserData = {
  profile?: AthleteProfile;
  reminder?: WorkoutReminderSettings;
  settings?: SettingsPreferences;
  sessions?: CompletedWorkoutSession[];
};

function fromProfileRow(row: ProfileRow): AthleteProfile {
  return {
    fitnessLevel: row.fitness_level,
    goal: row.goal,
    height: row.height,
    name: row.name,
    preferredIntensity: row.preferred_intensity,
    trainingDaysPerWeek: row.training_days_per_week,
    weight: row.weight,
  };
}

function toProfileRow(userId: string, profile: AthleteProfile): ProfileRow {
  return {
    fitness_level: profile.fitnessLevel,
    goal: profile.goal,
    height: profile.height,
    name: profile.name,
    preferred_intensity: profile.preferredIntensity,
    training_days_per_week: profile.trainingDaysPerWeek,
    user_id: userId,
    weight: profile.weight,
  };
}

function fromSessionRow(row: SessionRow): CompletedWorkoutSession {
  return {
    completedAt: row.completed_at,
    exerciseCount: row.exercise_count,
    id: row.id,
    title: row.title,
    totalSets: row.total_sets,
  };
}

function toSessionRow(userId: string, session: CompletedWorkoutSession): SessionRow {
  return {
    completed_at: session.completedAt,
    exercise_count: session.exerciseCount,
    id: session.id,
    title: session.title,
    total_sets: session.totalSets,
    user_id: userId,
  };
}

export async function loadCloudUserData(userId: string): Promise<CloudUserData> {
  if (!supabase) {
    return {};
  }

  const [profileResult, settingsResult, sessionsResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle<ProfileRow>(),
    supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle<SettingsRow>(),
    supabase
      .from("workout_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(20)
      .returns<SessionRow[]>(),
  ]);

  if (profileResult.error) {
    throw profileResult.error;
  }
  if (settingsResult.error) {
    throw settingsResult.error;
  }
  if (sessionsResult.error) {
    throw sessionsResult.error;
  }

  return {
    profile: profileResult.data ? fromProfileRow(profileResult.data) : undefined,
    reminder: settingsResult.data?.reminder,
    settings: settingsResult.data
      ? {
          equipment: settingsResult.data.equipment,
          health: settingsResult.data.health,
          privacy: settingsResult.data.privacy,
        }
      : undefined,
    sessions: sessionsResult.data?.map(fromSessionRow),
  };
}

export async function saveCloudProfile(userId: string, profile: AthleteProfile) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("profiles").upsert(toProfileRow(userId, profile));
  if (error) {
    throw error;
  }
}

export async function saveCloudSettings(
  userId: string,
  settings: SettingsPreferences,
  reminder: WorkoutReminderSettings,
) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("user_settings").upsert({
    equipment: settings.equipment,
    health: settings.health,
    privacy: settings.privacy,
    reminder,
    user_id: userId,
  });

  if (error) {
    throw error;
  }
}

export async function saveCloudSession(userId: string, session: CompletedWorkoutSession) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("workout_sessions").upsert(toSessionRow(userId, session));
  if (error) {
    throw error;
  }
}
