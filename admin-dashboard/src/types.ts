export type PlanCode = "free" | "plus" | "pro";
export type FitnessLevel = "beginner" | "intermediate" | "advanced" | "athlete";
export type NavKey =
  | "overview"
  | "members"
  | "subscriptions"
  | "coach_requests"
  | "coaches"
  | "messages"
  | "exercises"
  | "programs"
  | "ads"
  | "payments"
  | "settings";

export type Entitlements = {
  exercise_limit: number | null;
  all_exercises: boolean;
  show_ads: boolean;
  video_access: boolean;
  coach_chat: boolean;
  priority_support: boolean;
};

export type Plan = {
  code: PlanCode;
  name: string;
  description: string;
  monthly_price: number;
  yearly_price: number;
  currency: string;
  entitlements: Entitlements;
  active: boolean;
  sort_order: number;
};

export type MemberProfile = {
  user_id: string;
  email: string | null;
  name: string;
  account_status: "active" | "suspended" | "deleted";
  created_at: string;
  last_active_at: string | null;
  fitness_level: string;
  goal: string;
  weight: number;
  height: number;
  training_days_per_week: number;
  preferred_intensity: string;
};

export type MemberSettings = {
  user_id: string;
  health: string[];
  equipment: string;
  privacy: string[];
  reminder: { enabled: boolean; hour: number; minute: number; weekdays: number[] };
};

export type MemberIntake = {
  user_id: string;
  answers: Record<string, unknown>;
  completed_at: string;
};

export type MemberWorkout = {
  id: string;
  user_id: string;
  title: string;
  exercise_count: number;
  total_sets: number;
  completed_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan_code: PlanCode;
  status: "active" | "trialing" | "past_due" | "canceled" | "expired" | "paused";
  provider: "manual" | "google_play" | "revenuecat" | "stripe";
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export type Coach = {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  status: "active" | "away" | "disabled";
  max_clients: number;
  specialties: string[];
  response_sla_minutes: number;
};

export type ExerciseContent = {
  id: string;
  exercise_key: string;
  name: string;
  target_muscle: string;
  secondary_muscles: string[];
  equipment: string;
  difficulty_levels: FitnessLevel[];
  sets: number;
  reps: string;
  weight: string;
  rest_seconds: number;
  tempo: string;
  intensity: "strength" | "hypertrophy" | "conditioning";
  gif_url: string;
  video_url: string | null;
  video_storage_path: string | null;
  coach_cue: string;
  instructions: string[];
  published: boolean;
  sort_order: number;
};

export type ProgramContent = {
  id: string;
  program_key: string;
  title: string;
  subtitle: string;
  environment: "Gym" | "Home" | "Mobility";
  difficulty_levels: FitnessLevel[];
  duration_weeks: number;
  sessions_per_week: number;
  target: string;
  image_url: string;
  exercise_keys: string[];
  schedule: Array<{ weekday: number; label: string; exercise_keys: string[] }>;
  featured: boolean;
  published: boolean;
  sort_order: number;
};

export type Conversation = {
  id: string;
  member_user_id: string;
  coach_id: string;
  status: "open" | "closed" | "archived";
  last_message_at: string | null;
};

export type CoachMessage = {
  id: string;
  conversation_id: string;
  sender_user_id: string | null;
  sender_kind: "member" | "coach" | "admin" | "system";
  body: string;
  read_at: string | null;
  created_at: string;
};

export type CoachAssignment = {
  id: string;
  member_user_id: string;
  coach_id: string;
  status: "active" | "paused" | "ended";
};

export type AdCampaign = {
  id: string;
  name: string;
  placement: "home_feed" | "exercise_list" | "workout_complete";
  headline: string;
  status: "draft" | "active" | "paused" | "ended";
  impressions: number;
  clicks: number;
};

export type BillingEvent = {
  id: string;
  provider: string;
  event_type: string;
  processing_status: string;
  created_at: string;
};

export type DashboardData = {
  profiles: MemberProfile[];
  subscriptions: Subscription[];
  plans: Plan[];
  coaches: Coach[];
  assignments: CoachAssignment[];
  ads: AdCampaign[];
  billingEvents: BillingEvent[];
  workoutCount: number;
  exercises: ExerciseContent[];
  programs: ProgramContent[];
  conversations: Conversation[];
  messages: CoachMessage[];
  userSettings: MemberSettings[];
  memberIntakes: MemberIntake[];
  workouts: MemberWorkout[];
};

export type MemberRow = MemberProfile & {
  plan: PlanCode;
  subscriptionStatus: Subscription["status"];
  provider: Subscription["provider"];
  coachName: string | null;
};
