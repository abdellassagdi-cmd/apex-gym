import type { TrainingProgram } from "../data/workoutCatalog";
import { supabase } from "../../../lib/supabase";

export type SavedContent = {
  favoriteExerciseIds: string[];
  favoriteProgramIds: string[];
  myPrograms: TrainingProgram[];
  coachPrograms: TrainingProgram[];
};

export const emptySavedContent: SavedContent = {
  favoriteExerciseIds: [],
  favoriteProgramIds: [],
  myPrograms: [],
  coachPrograms: [],
};

export async function loadSavedContent(userId: string): Promise<SavedContent> {
  if (!supabase || userId === "local-device") return emptySavedContent;
  const [savedResult, coachResult] = await Promise.all([
    supabase.from("member_saved_content").select("favorite_exercise_keys,favorite_program_keys,custom_programs").eq("user_id", userId).maybeSingle(),
    supabase.from("coach_member_programs").select("program_data").eq("member_user_id", userId).eq("status", "active").order("created_at", { ascending: false }),
  ]);
  if (savedResult.error) throw savedResult.error;
  if (coachResult.error) throw coachResult.error;
  return {
    favoriteExerciseIds: savedResult.data?.favorite_exercise_keys ?? [],
    favoriteProgramIds: savedResult.data?.favorite_program_keys ?? [],
    myPrograms: (savedResult.data?.custom_programs ?? []) as TrainingProgram[],
    coachPrograms: (coachResult.data ?? []).map((row) => row.program_data as TrainingProgram),
  };
}

export async function saveSavedContent(userId: string, content: SavedContent) {
  if (!supabase || userId === "local-device") return;
  const { error } = await supabase.from("member_saved_content").upsert({
    user_id: userId,
    favorite_exercise_keys: content.favoriteExerciseIds,
    favorite_program_keys: content.favoriteProgramIds,
    custom_programs: content.myPrograms,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
