import { supabase } from "../../../lib/supabase";

export type PlanCode = "free" | "plus" | "pro";

export type MembershipState = {
  plan: PlanCode;
  showAds: boolean;
  videoAccess: boolean;
  coachChat: boolean;
  coach: { id: string; fullName: string; email: string } | null;
  assignmentId: string | null;
  conversationId: string | null;
  messages: Array<{ id: string; body: string; senderKind: string; createdAt: string }>;
};

export const freeMembership: MembershipState = {
  plan: "free", showAds: true, videoAccess: false, coachChat: false,
  coach: null, assignmentId: null, conversationId: null, messages: [],
};

export async function loadMembership(userId: string): Promise<MembershipState> {
  if (!supabase) return freeMembership;
  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("plan_code,status,plans(entitlements)")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  const plan = (subscription?.plan_code ?? "free") as PlanCode;
  const planRelation = subscription?.plans as unknown as { entitlements?: Record<string, boolean> } | Array<{ entitlements?: Record<string, boolean> }> | null;
  const entitlements = Array.isArray(planRelation) ? planRelation[0]?.entitlements : planRelation?.entitlements;
  const base: MembershipState = {
    plan,
    showAds: entitlements?.show_ads ?? plan === "free",
    videoAccess: entitlements?.video_access ?? plan !== "free",
    coachChat: entitlements?.coach_chat ?? plan === "pro",
    coach: null, assignmentId: null, conversationId: null, messages: [],
  };
  if (plan !== "pro") return base;

  const { data: assignment, error: assignmentError } = await supabase
    .from("coach_assignments")
    .select("id,coach_id,coach_profiles(id,full_name,email)")
    .eq("member_user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (assignmentError) throw assignmentError;
  if (!assignment) return base;
  const coachRelation = assignment.coach_profiles as unknown as { id: string; full_name: string; email: string } | Array<{ id: string; full_name: string; email: string }> | null;
  const coach = Array.isArray(coachRelation) ? coachRelation[0] : coachRelation;
  const { data: conversation } = await supabase.from("conversations").select("id").eq("member_user_id", userId).eq("status", "open").maybeSingle();
  const { data: messages } = conversation
    ? await supabase.from("messages").select("id,body,sender_kind,created_at").eq("conversation_id", conversation.id).order("created_at")
    : { data: [] };
  return {
    ...base,
    assignmentId: assignment.id,
    conversationId: conversation?.id ?? null,
    coach: coach ? { id: coach.id, fullName: coach.full_name, email: coach.email } : null,
    messages: (messages ?? []).map((message) => ({ id: message.id, body: message.body, senderKind: message.sender_kind, createdAt: message.created_at })),
  };
}

export async function loadExerciseContent() {
  if (!supabase) return [];
  const [contentResult, videosResult] = await Promise.all([
    supabase.from("exercise_content").select("*").eq("published", true).order("sort_order"),
    supabase.from("exercise_video_assets").select("exercise_key,video_url"),
  ]);
  if (contentResult.error) throw contentResult.error;
  if (videosResult.error) {
    console.warn("Exercise videos could not be loaded; continuing with published exercise content.", videosResult.error.message);
  }
  const videoByExercise = new Map((videosResult.data ?? []).map((item) => [item.exercise_key, item.video_url]));
  return (contentResult.data ?? []).map((item) => ({ ...item, video_url: videoByExercise.get(item.exercise_key) ?? null }));
}

export async function loadProgramContent() {
  if (!supabase) return [];
  const { data, error } = await supabase.from("program_content").select("*").eq("published", true).order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function sendMemberMessage(conversationId: string, userId: string, body: string) {
  if (!supabase) return;
  const { error } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_user_id: userId, sender_kind: "member", body: body.trim() });
  if (error) throw error;
}
