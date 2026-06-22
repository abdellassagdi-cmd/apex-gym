import { supabase } from "./supabase";
import type {
  AdCampaign,
  BillingEvent,
  Coach,
  ExerciseContent,
  CoachAssignment,
  DashboardData,
  MemberProfile,
  Plan,
  PlanCode,
  ProgramContent,
  Subscription,
} from "../types";
import { exerciseLibrary } from "../../../src/features/workouts/data/exerciseLibrary";
import { trainingPrograms } from "../../../src/features/workouts/data/workoutCatalog";

function requireClient() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  return supabase;
}

export async function verifyAdminAccess(userId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from("admin_members")
    .select("role,status")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw error;
  return data as { role: string; status: string } | null;
}

export async function verifyStaffAccess(userId: string) {
  const admin = await verifyAdminAccess(userId);
  if (admin) return { kind: "admin" as const, role: admin.role, coachId: null };

  const client = requireClient();
  const { data, error } = await client
    .from("coach_profiles")
    .select("id,status")
    .eq("user_id", userId)
    .in("status", ["active", "away"])
    .maybeSingle();
  if (error) throw error;
  return data ? { kind: "coach" as const, role: "Coach", coachId: data.id as string } : null;
}

export async function loadDashboardData(): Promise<DashboardData> {
  const client = requireClient();
  const [
    profilesResult,
    subscriptionsResult,
    plansResult,
    coachesResult,
    assignmentsResult,
    adsResult,
    billingResult,
    workoutResult,
    exercisesResult,
    programsResult,
    exerciseVideosResult,
    conversationsResult,
    messagesResult,
    settingsResult,
    intakesResult,
    workoutsResult,
  ] = await Promise.all([
    client
      .from("profiles")
      .select("user_id,email,name,account_status,created_at,last_active_at,fitness_level,goal,weight,height,training_days_per_week,preferred_intensity")
      .order("created_at", { ascending: false }),
    client.from("subscriptions").select("*").order("created_at", { ascending: false }),
    client.from("plans").select("*").order("sort_order"),
    client.from("coach_profiles").select("*").order("created_at", { ascending: false }),
    client.from("coach_assignments").select("*").eq("status", "active"),
    client.from("ad_campaigns").select("*").order("created_at", { ascending: false }),
    client.from("billing_events").select("*").order("created_at", { ascending: false }).limit(50),
    client.from("workout_sessions").select("id", { count: "exact", head: true }),
    client.from("exercise_content").select("*").order("sort_order"),
    client.from("program_content").select("*").order("sort_order"),
    client.from("exercise_video_assets").select("*"),
    client.from("conversations").select("*").order("created_at", { ascending: false }),
    client.from("messages").select("*").order("created_at", { ascending: true }).limit(500),
    client.from("user_settings").select("*"),
    client.from("member_intake").select("*"),
    client.from("workout_sessions").select("*").order("completed_at", { ascending: false }).limit(500),
  ]);

  const firstError = [
    profilesResult.error,
    subscriptionsResult.error,
    plansResult.error,
    coachesResult.error,
    assignmentsResult.error,
    adsResult.error,
    billingResult.error,
    workoutResult.error,
    exercisesResult.error,
    programsResult.error,
    exerciseVideosResult.error,
    conversationsResult.error,
    messagesResult.error,
    settingsResult.error,
    intakesResult.error,
    workoutsResult.error,
  ].find(Boolean);

  if (firstError) throw firstError;

  return {
    profiles: (profilesResult.data ?? []) as MemberProfile[],
    subscriptions: (subscriptionsResult.data ?? []) as Subscription[],
    plans: (plansResult.data ?? []) as Plan[],
    coaches: (coachesResult.data ?? []) as Coach[],
    assignments: (assignmentsResult.data ?? []) as CoachAssignment[],
    ads: (adsResult.data ?? []) as AdCampaign[],
    billingEvents: (billingResult.data ?? []) as BillingEvent[],
    workoutCount: workoutResult.count ?? 0,
    exercises: mergeExerciseCatalog((exercisesResult.data ?? []).map((exercise) => {
      const video = (exerciseVideosResult.data ?? []).find((item) => item.exercise_key === exercise.exercise_key);
      return { ...exercise, video_url: video?.video_url ?? null, video_storage_path: video?.video_storage_path ?? null };
    }) as DashboardData["exercises"]),
    programs: mergeProgramCatalog((programsResult.data ?? []) as ProgramContent[]),
    conversations: (conversationsResult.data ?? []) as DashboardData["conversations"],
    messages: (messagesResult.data ?? []) as DashboardData["messages"],
    userSettings: (settingsResult.data ?? []) as DashboardData["userSettings"],
    memberIntakes: (intakesResult.data ?? []) as DashboardData["memberIntakes"],
    workouts: (workoutsResult.data ?? []) as DashboardData["workouts"],
  };
}

export async function loadCoachDashboardData(coachId: string): Promise<DashboardData> {
  const client = requireClient();
  const [coachResult, assignmentsResult, conversationsResult, messagesResult] = await Promise.all([
    client.from("coach_profiles").select("*").eq("id", coachId).single(),
    client.from("coach_assignments").select("*").eq("coach_id", coachId).eq("status", "active"),
    client.from("conversations").select("*").eq("coach_id", coachId).order("created_at"),
    client.from("messages").select("*").order("created_at", { ascending: true }).limit(500),
  ]);
  const firstError = [coachResult.error, assignmentsResult.error, conversationsResult.error, messagesResult.error].find(Boolean);
  if (firstError) throw firstError;
  const assignments = (assignmentsResult.data ?? []) as DashboardData["assignments"];
  const memberIds = assignments.map((assignment) => assignment.member_user_id);
  const [profilesResult, settingsResult, intakesResult, workoutsResult] = memberIds.length
    ? await Promise.all([
        client.from("profiles").select("user_id,email,name,account_status,created_at,last_active_at,fitness_level,goal,weight,height,training_days_per_week,preferred_intensity").in("user_id", memberIds),
        client.from("user_settings").select("*").in("user_id", memberIds),
        client.from("member_intake").select("*").in("user_id", memberIds),
        client.from("workout_sessions").select("*").in("user_id", memberIds).order("completed_at", { ascending: false }).limit(200),
      ])
    : [
        { data: [], error: null }, { data: [], error: null },
        { data: [], error: null }, { data: [], error: null },
      ];
  const detailError = [profilesResult.error, settingsResult.error, intakesResult.error, workoutsResult.error].find(Boolean);
  if (detailError) throw detailError;

  return {
    profiles: (profilesResult.data ?? []) as DashboardData["profiles"],
    subscriptions: [], plans: [], coaches: [coachResult.data as Coach], assignments,
    ads: [], billingEvents: [], workoutCount: 0, exercises: [], programs: [],
    conversations: (conversationsResult.data ?? []) as DashboardData["conversations"],
    messages: (messagesResult.data ?? []) as DashboardData["messages"],
    userSettings: (settingsResult.data ?? []) as DashboardData["userSettings"],
    memberIntakes: (intakesResult.data ?? []) as DashboardData["memberIntakes"],
    workouts: (workoutsResult.data ?? []) as DashboardData["workouts"],
  };
}

export async function updatePlan(plan: Plan) {
  const client = requireClient();
  const { error } = await client
    .from("plans")
    .update({
      active: plan.active,
      description: plan.description,
      entitlements: plan.entitlements,
      monthly_price: plan.monthly_price,
      yearly_price: plan.yearly_price,
    })
    .eq("code", plan.code);
  if (error) throw error;
}

export async function updateMemberPlan(userId: string, planCode: PlanCode) {
  const client = requireClient();
  const { error } = await client
    .from("subscriptions")
    .update({
      plan_code: planCode,
      provider: "manual",
      status: "active",
      current_period_end: null,
    })
    .eq("user_id", userId);
  if (error) throw error;
}

export async function updateMemberStatus(
  userId: string,
  accountStatus: MemberProfile["account_status"],
) {
  const client = requireClient();
  const { error } = await client
    .from("profiles")
    .update({ account_status: accountStatus })
    .eq("user_id", userId);
  if (error) throw error;
}

export async function assignCoach(userId: string, coachId: string | null) {
  const client = requireClient();

  if (!coachId) {
    const { error } = await client
      .from("coach_assignments")
      .update({ ended_at: new Date().toISOString(), status: "ended" })
      .eq("member_user_id", userId)
      .eq("status", "active");
    if (error) throw error;
    const { error: conversationError } = await client
      .from("conversations")
      .update({ status: "closed" })
      .eq("member_user_id", userId)
      .eq("status", "open");
    if (conversationError) throw conversationError;
    return;
  }

  const { error } = await client.from("coach_assignments").upsert(
    {
      coach_id: coachId,
      member_user_id: userId,
      status: "active",
      ended_at: null,
    },
    { onConflict: "member_user_id" },
  );
  if (error) throw error;

  const { error: conversationError } = await client.from("conversations").upsert(
    { member_user_id: userId, coach_id: coachId, status: "open" },
    { onConflict: "member_user_id" },
  );
  if (conversationError) throw conversationError;
}

export async function saveExerciseContent(input: Omit<ExerciseContent, "id"> & { id?: string }) {
  const client = requireClient();
  const { id: _id, video_url, video_storage_path, ...content } = input;
  const payload = { ...content, video_url: null, video_storage_path: null, updated_at: new Date().toISOString() };
  const { data, error } = await client
    .from("exercise_content")
    .upsert(payload, { onConflict: "exercise_key" })
    .select("*")
    .single();
  if (error) throw error;
  if (video_url && video_storage_path) {
    const { error: videoError } = await client.from("exercise_video_assets").upsert({
      exercise_key: input.exercise_key, video_url, video_storage_path, updated_at: new Date().toISOString(),
    }, { onConflict: "exercise_key" });
    if (videoError) throw videoError;
  }
  return { ...data, video_url: video_url ?? null, video_storage_path: video_storage_path ?? null } as ExerciseContent;
}

export async function saveProgramContent(input: Omit<ProgramContent, "id"> & { id?: string }) {
  const client = requireClient();
  const { id: _id, ...content } = input;
  const { error } = await client.from("program_content").upsert(
    { ...content, updated_at: new Date().toISOString() },
    { onConflict: "program_key" },
  );
  if (error) throw error;
}

function mergeExerciseCatalog(remote: ExerciseContent[]): ExerciseContent[] {
  const remoteByKey = new Map(remote.map((item) => [item.exercise_key, item]));
  const local = exerciseLibrary.map((exercise, index): ExerciseContent => ({
    id: `local-${exercise.id}`,
    exercise_key: exercise.id,
    name: exercise.name,
    target_muscle: exercise.targetMuscle,
    secondary_muscles: exercise.secondaryMuscles,
    equipment: exercise.equipment,
    difficulty_levels: exercise.eligibleLevels,
    sets: exercise.sets,
    reps: exercise.reps,
    weight: exercise.weight,
    rest_seconds: exercise.restSeconds,
    tempo: exercise.tempo,
    intensity: exercise.intensity,
    gif_url: exercise.gifUrl,
    video_url: null,
    video_storage_path: null,
    coach_cue: exercise.coachCue,
    instructions: exercise.instructions,
    published: true,
    sort_order: index + 1,
  }));
  const merged = local.map((item) => {
    const combined = { ...item, ...(remoteByKey.get(item.exercise_key) ?? {}) };
    return { ...combined, difficulty_levels: combined.difficulty_levels?.length ? combined.difficulty_levels : item.difficulty_levels };
  });
  const localKeys = new Set(local.map((item) => item.exercise_key));
  return [...merged, ...remote.filter((item) => !localKeys.has(item.exercise_key))];
}

function mergeProgramCatalog(remote: ProgramContent[]): ProgramContent[] {
  const remoteByKey = new Map(remote.map((item) => [item.program_key, item]));
  const local = trainingPrograms.map((program, index): ProgramContent => ({
    id: `local-${program.id}`,
    program_key: program.id,
    title: program.title,
    subtitle: program.subtitle,
    environment: program.environment,
    difficulty_levels: program.eligibleLevels,
    duration_weeks: program.durationWeeks,
    sessions_per_week: program.sessionsPerWeek,
    target: program.target,
    image_url: program.imageUrl,
    exercise_keys: program.exercises.map((exercise) => exercise.id),
    schedule: program.schedule.map((day) => ({ weekday: day.weekday, label: day.label, exercise_keys: day.exercises.map((exercise) => exercise.id) })),
    featured: Boolean(program.featured),
    published: true,
    sort_order: index + 1,
  }));
  const merged = local.map((item) => {
    const combined = { ...item, ...(remoteByKey.get(item.program_key) ?? {}) };
    return { ...combined, difficulty_levels: combined.difficulty_levels?.length ? combined.difficulty_levels : item.difficulty_levels };
  });
  const localKeys = new Set(local.map((item) => item.program_key));
  return [...merged, ...remote.filter((item) => !localKeys.has(item.program_key))];
}

export async function uploadExerciseVideo(file: File, exerciseKey: string) {
  const client = requireClient();
  const extension = file.name.split(".").pop()?.toLowerCase() || "mp4";
  const safeKey = exerciseKey.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  const path = `${safeKey}/${crypto.randomUUID()}.${extension}`;
  const { error } = await client.storage.from("exercise-videos").upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || "video/mp4",
  });
  if (error) throw error;
  const { data } = client.storage.from("exercise-videos").getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function sendCoachMessage(input: {
  conversationId: string;
  senderUserId: string;
  senderKind: "coach" | "admin";
  body: string;
}) {
  const client = requireClient();
  const { error } = await client.from("messages").insert({
    conversation_id: input.conversationId,
    sender_user_id: input.senderUserId,
    sender_kind: input.senderKind,
    body: input.body.trim(),
  });
  if (error) throw error;
}

export async function createCoach(input: {
  full_name: string;
  email: string;
  max_clients: number;
  specialties: string[];
}) {
  const client = requireClient();
  const { error } = await client.from("coach_profiles").insert(input);
  if (error) throw error;
}

export async function createAdCampaign(input: {
  name: string;
  placement: AdCampaign["placement"];
  headline: string;
}) {
  const client = requireClient();
  const { error } = await client.from("ad_campaigns").insert({
    ...input,
    status: "draft",
  });
  if (error) throw error;
}
