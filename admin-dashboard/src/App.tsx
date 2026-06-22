import { startTransition, useEffect, useMemo, useState } from "react";
import { BellRing, ShieldAlert } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

import { AppShell } from "./components/Shell";
import { MemberDrawer, PlanDrawer } from "./components/Drawers";
import { LoadingState, Toast } from "./components/Ui";
import {
  assignCoach,
  createAdCampaign,
  createCoach,
  loadCoachDashboardData,
  loadDashboardData,
  saveExerciseContent,
  saveProgramContent,
  sendCoachMessage,
  uploadExerciseVideo,
  updateMemberPlan,
  updateMemberStatus,
  updatePlan,
  verifyStaffAccess,
} from "./lib/api";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import type { DashboardData, ExerciseContent, MemberRow, NavKey, Plan, PlanCode, ProgramContent } from "./types";
import { AuthView } from "./AuthView";
import { CoachPortal } from "./CoachPortal";
import { OverviewPage } from "./pages/OverviewPage";
import {
  AdsPage,
  CoachRequestsPage,
  CoachesPage,
  CatalogExercisesPage,
  MembersPage,
  MessagesPage,
  PaymentsPage,
  CatalogProgramsPage,
  SettingsPage,
  SubscriptionsPage,
} from "./pages/OperationsPages";

type ToastState = {
  message: string;
  error?: boolean;
} | null;

const initialData: DashboardData = {
  profiles: [], subscriptions: [], plans: [], coaches: [], assignments: [], ads: [],
  billingEvents: [], workoutCount: 0, exercises: [], programs: [], conversations: [],
  messages: [], userSettings: [], memberIntakes: [], workouts: [],
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(isSupabaseConfigured);
  const [loadingData, setLoadingData] = useState(false);
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [staffKind, setStaffKind] = useState<"admin" | "coach">("admin");
  const [coachId, setCoachId] = useState<string | null>(null);
  const demoMode = false;
  const [data, setData] = useState<DashboardData>(initialData);
  const [activeNav, setActiveNav] = useState<NavKey>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [planDrawerOpen, setPlanDrawerOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberRow | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [coachAlertDismissed, setCoachAlertDismissed] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setCheckingSession(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data: result }) => {
      if (!mounted) return;
      setSession(result.session);
      setCheckingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (demoMode) {
        setAccessDenied(false);
        setAdminRole("Preview");
        setData(initialData);
        setStaffKind("admin");
        setCoachId(null);
        return;
      }

      if (!session?.user?.id) {
        setAdminRole(null);
        return;
      }

      setLoadingData(true);
      try {
        const access = await verifyStaffAccess(session.user.id);
        if (cancelled) return;

        if (!access) {
          setAdminRole(null);
          setAccessDenied(true);
          return;
        }

        setAccessDenied(false);
        setAdminRole(access.role);
        setStaffKind(access.kind);
        setCoachId(access.coachId);
        const nextData = access.kind === "coach"
          ? await loadCoachDashboardData(access.coachId!)
          : await loadDashboardData();
        if (cancelled) return;
        setData(nextData);
      } catch (error) {
        if (cancelled) return;
        setToast({
          error: true,
          message: error instanceof Error ? error.message : "Unable to load dashboard.",
        });
      } finally {
        if (!cancelled) {
          setLoadingData(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [demoMode, session?.user?.id]);

  const members = useMemo(() => buildMemberRows(data), [data]);

  useEffect(() => {
    setCoachAlertDismissed(false);
  }, [session?.user.id, demoMode]);

  async function refreshData() {
    if (demoMode) return;
    const nextData = staffKind === "coach" && coachId
      ? await loadCoachDashboardData(coachId)
      : await loadDashboardData();
    setData(nextData);
  }

  async function handlePlanSave(plan: Plan) {
    if (demoMode) {
      setData((current) => ({
        ...current,
        plans: current.plans.map((item) => (item.code === plan.code ? plan : item)),
      }));
      setToast({ message: `${plan.name} updated in preview.` });
      return;
    }

    await updatePlan(plan);
    await refreshData();
    setToast({ message: `${plan.name} updated.` });
  }

  async function handleMemberSave(input: {
    userId: string;
    plan: PlanCode;
    accountStatus: MemberRow["account_status"];
    coachId: string | null;
  }) {
    if (demoMode) {
      const coachName = input.coachId
        ? data.coaches.find((coach) => coach.id === input.coachId)?.full_name ?? null
        : null;
      setData((current) => ({
        ...current,
        profiles: current.profiles.map((profile) =>
          profile.user_id === input.userId
            ? { ...profile, account_status: input.accountStatus }
            : profile,
        ),
        subscriptions: current.subscriptions.map((subscription) =>
          subscription.user_id === input.userId
            ? {
                ...subscription,
                plan_code: input.plan,
                provider: input.plan === "free" ? "manual" : subscription.provider,
              }
            : subscription,
        ),
        assignments: syncAssignmentPreview(current, input.userId, input.coachId, coachName),
      }));
      setToast({ message: "Member access updated in preview." });
      return;
    }

    await updateMemberPlan(input.userId, input.plan);
    await updateMemberStatus(input.userId, input.accountStatus);
    await assignCoach(input.userId, input.plan === "pro" ? input.coachId : null);
    await refreshData();
    setToast({ message: "Member updated." });
  }

  async function handleCreateCoach(input: {
    full_name: string;
    email: string;
    max_clients: number;
    specialties: string[];
  }) {
    if (demoMode) {
      setData((current) => ({
        ...current,
        coaches: [
          {
            id: `coach-${crypto.randomUUID()}`,
            user_id: null,
            status: "active",
            response_sla_minutes: 720,
            ...input,
          },
          ...current.coaches,
        ],
      }));
      setToast({ message: "Coach added in preview." });
      return;
    }

    await createCoach(input);
    await refreshData();
    setToast({ message: "Coach added." });
  }

  async function handleCreateCampaign(input: {
    name: string;
    placement: "home_feed" | "exercise_list" | "workout_complete";
    headline: string;
  }) {
    if (demoMode) {
      setData((current) => ({
        ...current,
        ads: [
          {
            id: `ad-${crypto.randomUUID()}`,
            impressions: 0,
            clicks: 0,
            status: "draft",
            ...input,
          },
          ...current.ads,
        ],
      }));
      setToast({ message: "Campaign created in preview." });
      return;
    }

    await createAdCampaign(input);
    await refreshData();
    setToast({ message: "Campaign created." });
  }

  async function handleSaveExercise(
    input: Omit<ExerciseContent, "id"> & { id?: string },
    videoFile?: File,
  ) {
    let exercise = input;
    if (videoFile) {
      const uploaded = await uploadExerciseVideo(videoFile, input.exercise_key);
      exercise = { ...input, video_url: uploaded.publicUrl, video_storage_path: uploaded.path };
    }
    if (demoMode) {
      setData((current) => ({
        ...current,
        exercises: [
          { ...exercise, id: input.id ?? `exercise-${crypto.randomUUID()}` } as ExerciseContent,
          ...current.exercises.filter((item) => item.exercise_key !== input.exercise_key),
        ],
      }));
      setToast({ message: "Preview only — sign in as admin to publish this change." });
      return;
    }
    const savedExercise = await saveExerciseContent(exercise);
    setData((current) => ({
      ...current,
      exercises: [
        savedExercise,
        ...current.exercises.filter((item) => item.exercise_key !== savedExercise.exercise_key),
      ],
    }));
    setToast({ message: "Exercise content published." });
  }

  async function handleSaveProgram(input: Omit<ProgramContent, "id"> & { id?: string }) {
    if (demoMode) {
      setData((current) => ({
        ...current,
        programs: [
          { ...input, id: input.id ?? `program-${crypto.randomUUID()}` } as ProgramContent,
          ...current.programs.filter((item) => item.program_key !== input.program_key),
        ],
      }));
      setToast({ message: "Program saved in preview." });
      return;
    }
    await saveProgramContent(input);
    await refreshData();
    setToast({ message: "Program published." });
  }

  async function handleSendCoachMessage(conversationId: string, body: string) {
    if (!session?.user.id) return;
    if (demoMode) {
      setData((current) => ({ ...current, messages: [...current.messages, {
        id: `message-${crypto.randomUUID()}`, conversation_id: conversationId,
        sender_user_id: session?.user.id ?? "preview-coach", sender_kind: "coach",
        body, read_at: null, created_at: new Date().toISOString(),
      }] }));
      return;
    }
    await sendCoachMessage({ conversationId, senderUserId: session.user.id, senderKind: staffKind === "coach" ? "coach" : "admin", body });
    await refreshData();
  }

  async function handleSignOut() {
    await supabase?.auth.signOut();
    setAdminRole(null);
  }

  if (checkingSession) {
    return <LoadingState />;
  }

  if (!demoMode && !session) {
    return (
      <AuthView
        onSignedIn={() => setToast({ message: "Signed in." })}
        onSignedUp={(message) => setToast({ message })}
      />
    );
  }

  if (!demoMode && accessDenied) {
    return (
      <div className="auth-shell">
        <div className="auth-card access-card">
          <div className="auth-mark">
            <ShieldAlert size={28} />
          </div>
          <h1>Dashboard access pending</h1>
          <p>
            This account is valid, but it has no dashboard role. Admin access is only for
            the allowlisted owner; coach access requires the admin to add this exact email
            in Coaches before signup.
          </p>
          <div className="info-list">
            <div>
              <strong>What to do</strong>
              <span>Use the owner email, or ask the admin to add this email as a coach first.</span>
            </div>
            <div>
              <strong>Why this exists</strong>
              <span>Only owner accounts can open billing, members, and coach tools.</span>
            </div>
          </div>
          <button className="button button-primary" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (!demoMode && staffKind === "coach") {
    return loadingData ? <LoadingState /> : <CoachPortal data={data} onSendMessage={handleSendCoachMessage} onSignOut={handleSignOut} />;
  }

  const waitingCoachRequests = members.filter(
    (member) => member.plan === "pro" && member.subscriptionStatus === "active" && !member.coachName,
  );

  return (
    <>
      <AppShell
        activeNav={activeNav}
        mobileNavOpen={mobileNavOpen}
        onCloseMobileNav={() => setMobileNavOpen(false)}
        onOpenMobileNav={() => setMobileNavOpen(true)}
        onSelectNav={(nav) => startTransition(() => setActiveNav(nav))}
        onSignOut={handleSignOut}
        role={adminRole ?? "Owner"}
        waitingCoachCount={waitingCoachRequests.length}
      >
        {loadingData ? (
          <LoadingState />
        ) : (
          <PageRouter
            activeNav={activeNav}
            data={data}
            members={members}
            onCreateCampaign={handleCreateCampaign}
            onCreateCoach={handleCreateCoach}
            onManageMember={(member) => setSelectedMember(member)}
            onManagePlans={() => setPlanDrawerOpen(true)}
            onSaveExercise={handleSaveExercise}
            onSaveProgram={handleSaveProgram}
          />
        )}
      </AppShell>

      <PlanDrawer
        onClose={() => setPlanDrawerOpen(false)}
        onSave={handlePlanSave}
        plans={data.plans}
        visible={planDrawerOpen}
      />

      <MemberDrawer
        coaches={data.coaches}
        data={data}
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        onSave={handleMemberSave}
        visible={Boolean(selectedMember)}
      />

      {waitingCoachRequests.length > 0 && !coachAlertDismissed ? (
        <div className="request-alert-layer" role="dialog" aria-modal="true" aria-label="Coach waiting list reminder">
          <div className="request-alert-card">
            <div className="request-alert-icon"><BellRing size={26} /></div>
            <span className="eyebrow">Coach assignment required</span>
            <h2>{waitingCoachRequests.length} Pro {waitingCoachRequests.length === 1 ? "member is" : "members are"} waiting</h2>
            <p>They have an active Pro plan but no coach yet. Review their information and assign the right coach.</p>
            <div className="request-alert-members">{waitingCoachRequests.slice(0, 3).map((member) => <span key={member.user_id}>{member.name}</span>)}</div>
            <div className="request-alert-actions">
              <button className="button button-secondary" onClick={() => setCoachAlertDismissed(true)}>Later</button>
              <button className="button button-primary" onClick={() => { setActiveNav("coach_requests"); setCoachAlertDismissed(true); }}>Open requests</button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? <Toast error={toast.error} message={toast.message} /> : null}
    </>
  );
}

function PageRouter({
  activeNav,
  data,
  members,
  onCreateCampaign,
  onCreateCoach,
  onManageMember,
  onManagePlans,
  onSaveExercise,
  onSaveProgram,
}: {
  activeNav: NavKey;
  data: DashboardData;
  members: MemberRow[];
  onCreateCampaign: (input: {
    name: string;
    placement: "home_feed" | "exercise_list" | "workout_complete";
    headline: string;
  }) => Promise<void>;
  onCreateCoach: (input: {
    full_name: string;
    email: string;
    max_clients: number;
    specialties: string[];
  }) => Promise<void>;
  onManageMember: (member: MemberRow) => void;
  onManagePlans: () => void;
  onSaveExercise: (input: Omit<ExerciseContent, "id"> & { id?: string }, videoFile?: File) => Promise<void>;
  onSaveProgram: (input: Omit<ProgramContent, "id"> & { id?: string }) => Promise<void>;
}) {
  switch (activeNav) {
    case "members":
      return <MembersPage members={members} onManageMember={onManageMember} />;
    case "subscriptions":
      return (
        <SubscriptionsPage
          data={data}
          members={members}
          onManagePlans={onManagePlans}
        />
      );
    case "coach_requests":
      return <CoachRequestsPage members={members} onManageMember={onManageMember} />;
    case "coaches":
      return <CoachesPage data={data} members={members} onCreateCoach={onCreateCoach} onManageMember={onManageMember} />;
    case "messages":
      return <MessagesPage data={data} members={members} />;
    case "exercises":
      return <CatalogExercisesPage exercises={data.exercises} onSaveExercise={onSaveExercise} plans={data.plans} />;
    case "programs":
      return <CatalogProgramsPage data={data} members={members} onSaveProgram={onSaveProgram} />;
    case "ads":
      return <AdsPage ads={data.ads} onCreateCampaign={onCreateCampaign} plans={data.plans} />;
    case "payments":
      return <PaymentsPage data={data} />;
    case "settings":
      return <SettingsPage />;
    case "overview":
    default:
      return (
        <OverviewPage
          data={data}
          members={members}
          onManageMember={onManageMember}
          onManagePlans={onManagePlans}
        />
      );
  }
}

function buildMemberRows(data: DashboardData): MemberRow[] {
  const subscriptionByUser = new Map(data.subscriptions.map((subscription) => [subscription.user_id, subscription]));
  const coachById = new Map(data.coaches.map((coach) => [coach.id, coach]));
  const assignmentByUser = new Map(
    data.assignments
      .filter((assignment) => assignment.status === "active")
      .map((assignment) => [assignment.member_user_id, assignment]),
  );

  return data.profiles.map((profile) => {
    const subscription = subscriptionByUser.get(profile.user_id);
    const assignment = assignmentByUser.get(profile.user_id);
    const coach = assignment ? coachById.get(assignment.coach_id) : null;

    return {
      ...profile,
      coachName: coach?.full_name ?? null,
      plan: subscription?.plan_code ?? "free",
      provider: subscription?.provider ?? "manual",
      subscriptionStatus: subscription?.status ?? "active",
    };
  });
}

function syncAssignmentPreview(
  current: DashboardData,
  userId: string,
  coachId: string | null,
  coachName: string | null,
): DashboardData["assignments"] {
  const remaining = current.assignments.filter((assignment) => assignment.member_user_id !== userId);
  if (!coachId || !coachName) return remaining;

  return [
    ...remaining,
    {
      id: `assignment-${userId}`,
      member_user_id: userId,
      coach_id: coachId,
      status: "active" as const,
    },
  ];
}
