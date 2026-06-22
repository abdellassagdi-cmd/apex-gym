import { supabase } from "../../../lib/supabase";
import type { OnboardingProfile } from "../../onboarding/types";
import { storage } from "../../../utils/storage";

export async function syncOnboardingIntake(userId: string) {
  if (!supabase || userId === "local-device") return;
  const answers = storage.get<OnboardingProfile | null>("apex-gym:onboarding-profile", null);
  if (!answers) return;

  const { error } = await supabase.from("member_intake").upsert({
    user_id: userId,
    answers,
    completed_at: new Date().toISOString(),
  });
  if (error) throw error;
}
