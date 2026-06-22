import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import {
  BadgeDollarSign,
  BellRing,
  CalendarClock,
  CircleAlert,
  Crown,
  Dumbbell,
  Filter,
  Megaphone,
  MessageSquareText,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  WalletCards,
} from "lucide-react";

import { EmptyState, PageIntro, StatusBadge, TableAction } from "../components/Ui";
import type { AdCampaign, DashboardData, ExerciseContent, FitnessLevel, MemberRow, Plan, ProgramContent } from "../types";

function formatMoney(value: number, currency = "MAD") {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function MembersPage({
  members,
  onManageMember,
}: {
  members: MemberRow[];
  onManageMember: (member: MemberRow) => void;
}) {
  const [query, setQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | "free" | "plus" | "pro">("all");
  const deferredQuery = useDeferredValue(query);

  const filteredMembers = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();

    return members.filter((member) => {
      const matchesPlan = planFilter === "all" || member.plan === planFilter;
      const matchesQuery =
        !normalized ||
        member.name.toLowerCase().includes(normalized) ||
        (member.email ?? "").toLowerCase().includes(normalized) ||
        member.goal.toLowerCase().includes(normalized);

      return matchesPlan && matchesQuery;
    });
  }, [deferredQuery, members, planFilter]);

  return (
    <div className="page-stack">
      <PageIntro
        description="Search the entire member base, open a profile, and update plan access or coach assignment."
        title="Members"
      />

      <section className="toolbar">
        <label className="toolbar-search">
          <Search size={18} />
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email, goal..."
            value={query}
          />
        </label>
        <label className="toolbar-filter">
          <Filter size={16} />
          <select onChange={(event) => setPlanFilter(event.target.value as typeof planFilter)} value={planFilter}>
            <option value="all">All plans</option>
            <option value="free">Free</option>
            <option value="plus">Plus</option>
            <option value="pro">Pro</option>
          </select>
        </label>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Member directory</h3>
            <p>{filteredMembers.length} visible accounts</p>
          </div>
        </div>

        {filteredMembers.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Plan</th>
                  <th>Goal</th>
                  <th>Coach</th>
                  <th>Account</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                  <tr key={member.user_id}>
                    <td>
                      <div className="member-cell">
                        <div className="avatar">{member.name.slice(0, 1).toUpperCase()}</div>
                        <div>
                          <strong>{member.name}</strong>
                          <span>{member.email ?? "No email"}</span>
                        </div>
                      </div>
                    </td>
                    <td><StatusBadge value={member.plan} /></td>
                    <td>{member.goal}</td>
                    <td>{member.coachName ?? "Unassigned"}</td>
                    <td><StatusBadge value={member.account_status} /></td>
                    <td><TableAction label="Manage" onClick={() => onManageMember(member)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState body="Try another search or change the plan filter." title="No members match" />
        )}
      </section>
    </div>
  );
}

export function SubscriptionsPage({
  data,
  members,
  onManagePlans,
}: {
  data: DashboardData;
  members: MemberRow[];
  onManagePlans: () => void;
}) {
  const activeSubscriptions = data.subscriptions.filter((item) => ["active", "trialing"].includes(item.status));

  return (
    <div className="page-stack">
      <PageIntro
        action={
          <button className="button button-primary" onClick={onManagePlans}>
            Manage plans
          </button>
        }
        description="Control plan pricing, entitlement limits, and follow which plan members are actually using."
        title="Subscriptions"
      />

      <section className="plan-card-grid">
        {data.plans.map((plan) => {
          const count = activeSubscriptions.filter((item) => item.plan_code === plan.code).length;
          return (
            <article className={`plan-card plan-card-${plan.code}`} key={plan.code}>
              <div className="plan-card-top">
                <StatusBadge value={plan.code} />
                <span>{count} members</span>
              </div>
              <strong>{plan.name}</strong>
              <p>{plan.description}</p>
              <div className="plan-card-price">
                <span>{formatMoney(plan.monthly_price)}</span>
                <small>/ month</small>
              </div>
              <ul className="mini-list">
                <li>{plan.entitlements.all_exercises ? "All exercises unlocked" : `${plan.entitlements.exercise_limit ?? 0} exercises visible`}</li>
                <li>{plan.entitlements.show_ads ? "Ads shown to members" : "No ad placements"}</li>
                <li>{plan.entitlements.coach_chat ? "Coach chat included" : "No coach chat"}</li>
              </ul>
            </article>
          );
        })}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Latest subscription activity</h3>
            <p>Who is on what plan, via which billing source, and when the current period ends.</p>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Provider</th>
                <th>Renews</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const subscription = data.subscriptions.find((item) => item.user_id === member.user_id);
                return (
                  <tr key={member.user_id}>
                    <td>{member.name}</td>
                    <td><StatusBadge value={member.plan} /></td>
                    <td><StatusBadge value={member.subscriptionStatus} /></td>
                    <td>{member.provider.replaceAll("_", " ")}</td>
                    <td>{formatDate(subscription?.current_period_end ?? null)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function CoachRequestsPage({
  members,
  onManageMember,
}: {
  members: MemberRow[];
  onManageMember: (member: MemberRow) => void;
}) {
  const waiting = members.filter(
    (member) => member.plan === "pro" && member.subscriptionStatus === "active" && !member.coachName,
  );

  return (
    <div className="page-stack">
      <PageIntro
        description="Every paid Pro member stays here until you review their profile and assign a coach."
        title="Coach Requests"
      />
      <section className={waiting.length ? "request-hero request-hero-alert" : "request-hero"}>
        <div className="request-hero-icon"><BellRing size={24} /></div>
        <div><span>Waiting list</span><strong>{waiting.length} {waiting.length === 1 ? "member" : "members"}</strong><p>Active Pro subscriptions without a coach.</p></div>
      </section>
      <section className="panel">
        <div className="panel-heading"><div><h3>Pending coach assignments</h3><p>Open a member dossier before choosing the best coach.</p></div><span className="assignment-count">{waiting.length} waiting</span></div>
        {waiting.length ? <div className="assignment-list">{waiting.map((member) => (
          <article className="assignment-row" key={member.user_id}>
            <div className="member-cell"><div className="avatar">{member.name.slice(0, 1)}</div><div><strong>{member.name}</strong><span>{member.email}</span></div></div>
            <div><span className="queue-label">Goal</span><strong>{member.goal}</strong></div>
            <div><span className="queue-label">Payment</span><StatusBadge value={member.subscriptionStatus} /></div>
            <div><span className="queue-label">Joined</span><strong>{formatDate(member.created_at)}</strong></div>
            <button className="button button-primary" onClick={() => onManageMember(member)}>Review & assign</button>
          </article>
        ))}</div> : <div className="assignment-empty"><UserRoundCheck size={22} /><div><strong>Waiting list is clear</strong><span>New paid Pro members will appear here automatically.</span></div></div>}
      </section>
    </div>
  );
}

export function CoachesPage({
  data,
  members,
  onCreateCoach,
  onManageMember,
}: {
  data: DashboardData;
  members: MemberRow[];
  onCreateCoach: (input: {
    full_name: string;
    email: string;
    max_clients: number;
    specialties: string[];
  }) => Promise<void>;
  onManageMember: (member: MemberRow) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [specialties, setSpecialties] = useState("Strength, Mobility");
  const [capacity, setCapacity] = useState(25);
  const [saving, setSaving] = useState(false);
  const pendingProMembers = members.filter(
    (member) => member.plan === "pro" && member.subscriptionStatus === "active" && !member.coachName,
  );

  async function submitCoach() {
    setSaving(true);
    try {
      await onCreateCoach({
        email,
        full_name: name,
        max_clients: capacity,
        specialties: specialties
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      setName("");
      setEmail("");
      setSpecialties("Strength, Mobility");
      setCapacity(25);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-stack">
      <PageIntro
        description="Set Pro plan delivery capacity and track how many members each coach can still support."
        title="Coaches"
      />

      <section className={pendingProMembers.length ? "panel assignment-queue assignment-queue-alert" : "panel assignment-queue"}>
        <div className="panel-heading">
          <div>
            <h3>Pro payments waiting for a coach</h3>
            <p>Every active Pro payment without an assignment appears here automatically.</p>
          </div>
          <span className="assignment-count">{pendingProMembers.length} waiting</span>
        </div>
        {pendingProMembers.length ? (
          <div className="assignment-list">
            {pendingProMembers.map((member) => (
              <article className="assignment-row" key={member.user_id}>
                <div className="member-cell">
                  <div className="avatar">{member.name.slice(0, 1).toUpperCase()}</div>
                  <div><strong>{member.name}</strong><span>{member.email}</span></div>
                </div>
                <div><span className="queue-label">Payment</span><StatusBadge value={member.subscriptionStatus} /></div>
                <div><span className="queue-label">Provider</span><strong>{member.provider.replaceAll("_", " ")}</strong></div>
                <button className="button button-primary" onClick={() => onManageMember(member)}>Choose coach</button>
              </article>
            ))}
          </div>
        ) : (
          <div className="assignment-empty"><UserRoundCheck size={22} /><div><strong>No Pro member is waiting</strong><span>New successful Pro payments will land here until you assign a coach.</span></div></div>
        )}
      </section>

      <section className="split-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Coach roster</h3>
              <p>Capacity, specialties, SLA, and live assignments.</p>
            </div>
          </div>

          {data.coaches.length ? (
            <div className="coach-list">
              {data.coaches.map((coach) => {
                const activeCount = members.filter((member) => member.coachName === coach.full_name).length;
                const percent = Math.min(100, Math.round((activeCount / coach.max_clients) * 100));

                return (
                  <article className="coach-card" key={coach.id}>
                    <div className="coach-header">
                      <div className="avatar">{coach.full_name.slice(0, 1)}</div>
                      <div>
                        <strong>{coach.full_name}</strong>
                        <span>{coach.email}</span>
                      </div>
                      <StatusBadge value={coach.status} />
                    </div>
                    <div className="coach-meta">
                      <span>{coach.specialties.join(" / ")}</span>
                      <span>{coach.response_sla_minutes / 60}h SLA</span>
                    </div>
                    <div className="progress-track">
                      <span style={{ width: `${percent}%` }} />
                    </div>
                    <small>{activeCount} / {coach.max_clients} Pro members assigned</small>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState body="Add at least one coach before selling Pro." title="No coaches yet" />
          )}
        </div>

        <div className="panel form-panel">
          <div className="panel-heading">
            <div>
              <h3>Add coach</h3>
              <p>Create a profile for future Pro assignments.</p>
            </div>
          </div>

          <div className="form-grid">
            <label>
              Full name
              <input onChange={(event) => setName(event.target.value)} value={name} />
            </label>
            <label>
              Email
              <input onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
            </label>
            <label>
              Max clients
              <input min="1" onChange={(event) => setCapacity(Number(event.target.value))} type="number" value={capacity} />
            </label>
            <label className="span-2">
              Specialties
              <input
                onChange={(event) => setSpecialties(event.target.value)}
                placeholder="Strength, Mobility, Fat loss"
                value={specialties}
              />
            </label>
          </div>

          <button
            className="button button-primary"
            disabled={!name || !email || saving}
            onClick={submitCoach}
          >
            {saving ? "Adding..." : "Create coach"}
          </button>
        </div>
      </section>
    </div>
  );
}

export function MessagesPage({
  data,
  members,
}: {
  data: DashboardData;
  members: MemberRow[];
}) {
  const proMembers = members.filter((member) => member.plan === "pro");
  const assignedMembers = proMembers.filter((member) => member.coachName);

  return (
    <div className="page-stack">
      <PageIntro
        description="Coach chat becomes a premium promise on Pro, so this page tracks whether the support side is actually ready."
        title="Messages"
      />

      <section className="feature-grid">
        <article className="feature-card">
          <MessageSquareText size={18} />
          <strong>{proMembers.length}</strong>
          <span>Pro members with chat entitlement</span>
        </article>
        <article className="feature-card">
          <UserRoundCheck size={18} />
          <strong>{assignedMembers.length}</strong>
          <span>Pro members already assigned to a coach</span>
        </article>
        <article className="feature-card">
          <BellRing size={18} />
          <strong>{data.coaches.length}</strong>
          <span>Coaches who can receive message load</span>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Rollout notes</h3>
            <p>Recommended sequence before chat goes live.</p>
          </div>
        </div>
        <ul className="check-list check-list-detailed">
          <li className={data.coaches.length ? "done" : ""}>Coach team created inside the dashboard</li>
          <li className={assignedMembers.length ? "done" : ""}>At least one Pro member assigned to a coach</li>
          <li>Realtime chat channel connected from the mobile app</li>
          <li>Coach response SLA and escalation rules approved</li>
        </ul>
      </section>
    </div>
  );
}

export function ExercisesPage({ exercises, onSaveExercise, plans }: {
  exercises: ExerciseContent[];
  onSaveExercise: (input: Omit<ExerciseContent, "id"> & { id?: string }, videoFile?: File) => Promise<void>;
  plans: Plan[];
}) {
  const [name, setName] = useState("");
  const [exerciseKey, setExerciseKey] = useState("");
  const [targetMuscle, setTargetMuscle] = useState("chest");
  const [equipment, setEquipment] = useState("Barbell");
  const [gifUrl, setGifUrl] = useState("");
  const [coachCue, setCoachCue] = useState("");
  const [videoFile, setVideoFile] = useState<File>();
  const [saving, setSaving] = useState(false);
  const plusPlan = plans.find((plan) => plan.code === "plus");

  async function submitExercise() {
    setSaving(true);
    try {
      await onSaveExercise({ exercise_key: exerciseKey.trim(), name: name.trim(), target_muscle: targetMuscle,
        secondary_muscles: [], difficulty_levels: ["beginner", "intermediate", "advanced", "athlete"],
        sets: 3, reps: "8-12", weight: "Auto load", rest_seconds: 75, tempo: "2-1-2", intensity: "hypertrophy",
        equipment: equipment.trim(), gif_url: gifUrl.trim(), video_url: null, video_storage_path: null,
        coach_cue: coachCue.trim(), instructions: [], published: true, sort_order: exercises.length + 1 }, videoFile);
      setName(""); setExerciseKey(""); setGifUrl(""); setCoachCue(""); setVideoFile(undefined);
    } finally { setSaving(false); }
  }

  return (
    <div className="page-stack">
      <PageIntro
        description="Upload the videos recorded by the app owner and publish them to Plus and Pro members. Free members keep the full library with GIF demonstrations and ads."
        title="Exercises"
      />

      <section className="split-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Published exercise content</h3>
              <p>{exercises.filter((item) => item.video_url).length} videos ready for paid members.</p>
            </div>
          </div>
          <div className="exercise-content-list">{exercises.map((exercise) => <article className="exercise-content-card" key={exercise.exercise_key}><img alt="" src={exercise.gif_url} /><div><strong>{exercise.name}</strong><p>{exercise.target_muscle} · {exercise.equipment}</p></div><span className={exercise.video_url ? "video-pill" : "video-pill missing"}>{exercise.video_url ? "Video ready" : "GIF only"}</span></article>)}{!exercises.length ? <EmptyState body="Upload the first owner-recorded exercise video." title="No custom exercise content" /> : null}</div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Upload exercise video</h3>
              <p>MP4, MOV or WebM. Files are stored in the protected admin upload bucket.</p>
            </div>
          </div>
          <div className="video-upload-grid"><label>Exercise name<input onChange={(event) => setName(event.target.value)} value={name} /></label><label>Exercise key<input onChange={(event) => setExerciseKey(event.target.value)} placeholder="ex-bench-press" value={exerciseKey} /></label><label>Target muscle<input onChange={(event) => setTargetMuscle(event.target.value)} value={targetMuscle} /></label><label>Equipment<input onChange={(event) => setEquipment(event.target.value)} value={equipment} /></label><label className="span-2">GIF URL<input onChange={(event) => setGifUrl(event.target.value)} placeholder="Free members see this GIF" type="url" value={gifUrl} /></label><label className="span-2">Coach cue<input onChange={(event) => setCoachCue(event.target.value)} value={coachCue} /></label><label className="span-2">Video file<input accept="video/mp4,video/quicktime,video/webm" onChange={(event) => setVideoFile(event.target.files?.[0])} type="file" /></label></div>
          <button className="button button-primary" disabled={!name || !exerciseKey || !gifUrl || !videoFile || saving} onClick={() => void submitExercise()}>{saving ? "Uploading..." : "Upload and publish"}</button>
          <p className="inline-note">Plus video access: {plusPlan?.entitlements.video_access ? "enabled" : "disabled"}. Free always keeps GIF access.</p>
        </div>
      </section>
    </div>
  );
}

export function ProgramsPage({
  data,
  members,
}: {
  data: DashboardData;
  members: MemberRow[];
}) {
  const byGoal = new Map<string, number>();
  for (const member of members) {
    byGoal.set(member.goal, (byGoal.get(member.goal) ?? 0) + 1);
  }

  return (
    <div className="page-stack">
      <PageIntro
        description="Programs are the bridge between onboarding goals and the actual workout system members get after signup."
        title="Programs"
      />

      <section className="feature-grid">
        <article className="feature-card">
          <Dumbbell size={18} />
          <strong>{data.workoutCount}</strong>
          <span>Total workout sessions recorded</span>
        </article>
        <article className="feature-card">
          <CalendarClock size={18} />
          <strong>{members.length}</strong>
          <span>Members currently mapped to a goal</span>
        </article>
        <article className="feature-card">
          <Sparkles size={18} />
          <strong>{byGoal.size}</strong>
          <span>Goal buckets driving plan suggestions</span>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Goal distribution</h3>
            <p>Useful when deciding which programs deserve the strongest upsell path.</p>
          </div>
        </div>
        <div className="goal-grid">
          {[...byGoal.entries()].map(([goal, count]) => (
            <article className="goal-card" key={goal}>
              <strong>{goal}</strong>
              <span>{count} members</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

const allFitnessLevels: FitnessLevel[] = ["beginner", "intermediate", "advanced", "athlete"];
const muscleOptions = ["arms", "back", "calves", "chest", "core", "glutes", "hamstrings", "quads", "shoulders"] as const;
const equipmentOptions = ["Band", "Barbell", "Bodyweight", "Cable", "Dumbbell", "Dumbbells", "Exercise Ball", "Kettlebell", "Machine", "Smith Machine"] as const;
const setOptions = Array.from({ length: 12 }, (_, index) => index + 1);
const repOptions = Array.from({ length: 50 }, (_, index) => index + 1);
const loadOptions = Array.from({ length: 61 }, (_, index) => index * 5);
const recoveryOptions = Array.from({ length: 20 }, (_, index) => (index + 1) * 15);

function createExerciseDraft(sortOrder: number): ExerciseContent {
  return {
    id: "",
    exercise_key: "",
    name: "",
    target_muscle: "chest",
    secondary_muscles: [],
    equipment: "Bodyweight",
    difficulty_levels: ["beginner", "intermediate"],
    sets: 3,
    reps: "10",
    weight: "0 kg",
    rest_seconds: 75,
    tempo: "2-1-2",
    intensity: "hypertrophy",
    gif_url: "",
    video_url: null,
    video_storage_path: null,
    coach_cue: "",
    instructions: [],
    published: true,
    sort_order: sortOrder,
  };
}

function normalizeExerciseDraft(exercise: ExerciseContent): ExerciseContent {
  const reps = Math.min(50, Math.max(1, Number.parseInt(exercise.reps, 10) || 10));
  const load = Math.min(300, Math.max(0, Number.parseInt(exercise.weight, 10) || 0));
  const recovery = recoveryOptions.reduce((closest, option) =>
    Math.abs(option - exercise.rest_seconds) < Math.abs(closest - exercise.rest_seconds) ? option : closest,
  recoveryOptions[0]);
  return {
    ...exercise,
    difficulty_levels: exercise.difficulty_levels?.length ? exercise.difficulty_levels : allFitnessLevels,
    secondary_muscles: exercise.secondary_muscles ?? [],
    sets: Math.min(12, Math.max(1, exercise.sets)),
    reps: String(reps),
    weight: `${Math.round(load / 5) * 5} kg`,
    rest_seconds: recovery,
  };
}

export function CatalogExercisesPage({ exercises, onSaveExercise, plans }: {
  exercises: ExerciseContent[];
  onSaveExercise: (input: Omit<ExerciseContent, "id"> & { id?: string }, videoFile?: File) => Promise<void>;
  plans: Plan[];
}) {
  const [draft, setDraft] = useState<ExerciseContent | null>(null);
  const [query, setQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("all");
  const [equipmentFilter, setEquipmentFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState<"all" | FitnessLevel>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [videoFile, setVideoFile] = useState<File>();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return exercises.filter((item) => {
      const levels = item.difficulty_levels?.length ? item.difficulty_levels : allFitnessLevels;
      const matchesSearch = !search || `${item.name} ${item.target_muscle} ${item.equipment}`.toLowerCase().includes(search);
      const matchesMuscle = muscleFilter === "all" || item.target_muscle === muscleFilter;
      const matchesEquipment = equipmentFilter === "all" || item.equipment === equipmentFilter;
      const matchesLevel = levelFilter === "all" || levels.includes(levelFilter);
      const matchesStatus = statusFilter === "all" || (statusFilter === "published" ? item.published : !item.published);
      return matchesSearch && matchesMuscle && matchesEquipment && matchesLevel && matchesStatus;
    });
  }, [equipmentFilter, exercises, levelFilter, muscleFilter, query, statusFilter]);

  async function save() {
    if (!draft || !draft.name.trim() || !draft.exercise_key.trim() || !draft.gif_url.trim() || !(draft.difficulty_levels ?? []).length) return;
    setSaving(true);
    setSaveError("");
    try {
      await onSaveExercise({ ...draft, exercise_key: draft.exercise_key.trim(), name: draft.name.trim() }, videoFile);
      setDraft(null);
      setVideoFile(undefined);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "The exercise could not be saved.");
    } finally { setSaving(false); }
  }

  return <div className="page-stack">
    <PageIntro action={<button className="button button-primary" onClick={() => setDraft(createExerciseDraft(exercises.length + 1))}><Plus size={16} />New exercise</button>} description="One catalog shared with the app. Edit the movement, verified GIF, coaching prescription, publication status, and exactly which athlete levels can see it." title="Exercises" />
    <section className="catalog-summary-grid">
      <article><strong>{exercises.length}</strong><span>App exercises</span></article>
      <article><strong>{exercises.filter((item) => item.video_url).length}</strong><span>Paid videos ready</span></article>
      <article><strong>{exercises.filter((item) => (item.difficulty_levels ?? allFitnessLevels).includes("beginner")).length}</strong><span>Beginner-safe options</span></article>
      <article><strong>{plans.find((plan) => plan.code === "plus")?.entitlements.video_access ? "On" : "Off"}</strong><span>Plus video access</span></article>
    </section>
    <section className="toolbar catalog-toolbar"><label className="toolbar-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search exercise, muscle, equipment..." /></label><div className="catalog-filter-bar"><label>Muscle<select value={muscleFilter} onChange={(event) => setMuscleFilter(event.target.value)}><option value="all">All muscles</option>{muscleOptions.map((muscle) => <option key={muscle} value={muscle}>{humanizeLabel(muscle)}</option>)}</select></label><label>Equipment<select value={equipmentFilter} onChange={(event) => setEquipmentFilter(event.target.value)}><option value="all">All equipment</option>{equipmentOptions.map((equipment) => <option key={equipment} value={equipment}>{equipment}</option>)}</select></label><label>Level<select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value as "all" | FitnessLevel)}><option value="all">All levels</option>{allFitnessLevels.map((level) => <option key={level} value={level}>{humanizeLabel(level)}</option>)}</select></label><label>Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}><option value="all">All status</option><option value="published">Published</option><option value="draft">Draft</option></select></label></div><span className="catalog-count">{filtered.length} results</span></section>
    <section className="panel"><div className="exercise-catalog-grid">{filtered.map((exercise) => <article className="exercise-admin-card" key={exercise.exercise_key}>
      <img alt={`${exercise.name} movement`} src={exercise.gif_url} />
      <div className="exercise-admin-copy"><div><StatusBadge value={exercise.published ? "published" : "draft"} /><span className={exercise.video_url ? "video-pill" : "video-pill missing"}>{exercise.video_url ? "Video ready" : "GIF"}</span></div><h3>{exercise.name}</h3><p>{exercise.target_muscle} · {exercise.equipment} · {exercise.sets} × {exercise.reps}</p><div className="level-chip-row">{(exercise.difficulty_levels ?? allFitnessLevels).map((level) => <span key={level}>{level}</span>)}</div></div>
      <button className="button button-secondary" onClick={() => { setDraft(normalizeExerciseDraft(exercise)); setSaveError(""); setVideoFile(undefined); }}><Pencil size={15} />Edit</button>
    </article>)}</div></section>
    {draft ? <CatalogEditor headerAction={<>{saveError ? <span className="catalog-save-error">{saveError}</span> : null}<button className="button button-primary" disabled={saving || !(draft.difficulty_levels ?? []).length || !draft.gif_url || !draft.name} onClick={() => void save()}>{saving ? "Saving..." : "Save exercise"}</button></>} title={draft.id ? `Edit ${draft.name}` : "Create exercise"} onClose={() => setDraft(null)}>
      <div className="catalog-editor-layout"><div className="catalog-form-grid">
        <label>Exercise name<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
        <label>Stable key<input disabled={Boolean(draft.id)} value={draft.exercise_key} onChange={(event) => setDraft({ ...draft, exercise_key: event.target.value.toLowerCase().replace(/\s+/g, "-") })} placeholder="ex-new-movement" /></label>
        <label>Target muscle<select value={draft.target_muscle} onChange={(event) => setDraft({ ...draft, target_muscle: event.target.value })}>{muscleOptions.map((muscle) => <option key={muscle} value={muscle}>{humanizeLabel(muscle)}</option>)}</select></label>
        <label>Equipment<select value={draft.equipment} onChange={(event) => setDraft({ ...draft, equipment: event.target.value })}>{equipmentOptions.map((equipment) => <option key={equipment} value={equipment}>{equipment}</option>)}</select></label>
        <div className="span-2"><MusclePicker muscles={draft.secondary_muscles ?? []} onChange={(secondary_muscles) => setDraft({ ...draft, secondary_muscles })} /></div>
        <label>Training style<select value={draft.intensity} onChange={(event) => setDraft({ ...draft, intensity: event.target.value as ExerciseContent["intensity"] })}><option value="strength">Strength</option><option value="hypertrophy">Hypertrophy</option><option value="conditioning">Conditioning</option></select></label>
        <label>Sets<select value={draft.sets} onChange={(event) => setDraft({ ...draft, sets: Number(event.target.value) })}>{setOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <label>Reps<select value={draft.reps} onChange={(event) => setDraft({ ...draft, reps: event.target.value })}>{repOptions.map((value) => <option key={value} value={String(value)}>{value}</option>)}</select></label>
        <label>Default load<select value={draft.weight} onChange={(event) => setDraft({ ...draft, weight: event.target.value })}>{loadOptions.map((value) => <option key={value} value={`${value} kg`}>{value} kg</option>)}</select></label>
        <label>Recovery<select value={draft.rest_seconds} onChange={(event) => setDraft({ ...draft, rest_seconds: Number(event.target.value) })}>{recoveryOptions.map((value) => <option key={value} value={value}>{value}s</option>)}</select></label>
        <label>Tempo<input value={draft.tempo} onChange={(event) => setDraft({ ...draft, tempo: event.target.value })} /></label>
        <label className="span-2">Verified GIF URL<input type="url" value={draft.gif_url} onChange={(event) => setDraft({ ...draft, gif_url: event.target.value })} /></label>
        <label className="span-2">Coach cue<textarea value={draft.coach_cue} onChange={(event) => setDraft({ ...draft, coach_cue: event.target.value })} /></label>
        <label className="span-2">Instructions — one step per line<textarea value={draft.instructions.join("\n")} onChange={(event) => setDraft({ ...draft, instructions: lines(event.target.value) })} /></label>
        <label className="span-2">Plus / Pro video (optional)<input accept="video/mp4,video/quicktime,video/webm" type="file" onChange={(event) => setVideoFile(event.target.files?.[0])} /></label>
      </div><aside className="catalog-preview"><img alt="GIF preview" src={draft.gif_url || "https://placehold.co/520x360/f4f4f5/71717a?text=GIF+preview"} /><h3>{draft.name || "Exercise preview"}</h3><p>The name and GIF are reviewed together here before publishing.</p><LevelPicker levels={draft.difficulty_levels ?? allFitnessLevels} onChange={(difficulty_levels) => setDraft({ ...draft, difficulty_levels })} /><label className="publish-toggle"><input checked={draft.published} type="checkbox" onChange={(event) => setDraft({ ...draft, published: event.target.checked })} />Published in app</label></aside></div>
      <div className="catalog-editor-actions">{saveError ? <span className="catalog-save-error">{saveError}</span> : null}<button className="button button-secondary" onClick={() => setDraft(null)}>Cancel</button><button className="button button-primary" disabled={saving || !(draft.difficulty_levels ?? []).length || !draft.gif_url || !draft.name} onClick={() => void save()}>{saving ? "Saving..." : "Save exercise"}</button></div>
    </CatalogEditor> : null}
  </div>;
}

function createProgramDraft(sortOrder: number): ProgramContent {
  return { id: "", program_key: "", title: "", subtitle: "", environment: "Gym", difficulty_levels: ["beginner"], duration_weeks: 6, sessions_per_week: 3, target: "General fitness", image_url: "", exercise_keys: [], schedule: [], featured: false, published: true, sort_order: sortOrder };
}

export function CatalogProgramsPage({ data, members, onSaveProgram }: { data: DashboardData; members: MemberRow[]; onSaveProgram: (input: Omit<ProgramContent, "id"> & { id?: string }) => Promise<void> }) {
  const [draft, setDraft] = useState<ProgramContent | null>(null);
  const [saving, setSaving] = useState(false);
  const byLevel = new Map<string, number>();
  for (const member of members) byLevel.set(member.fitness_level.toLowerCase(), (byLevel.get(member.fitness_level.toLowerCase()) ?? 0) + 1);
  async function save() {
    if (!draft || !draft.title || !draft.program_key || !draft.image_url || !draft.difficulty_levels.length || !draft.exercise_keys.length) return;
    const weekdays = [2, 4, 6, 3, 5].slice(0, draft.sessions_per_week);
    const schedule = weekdays.map((weekday, index) => ({ weekday, label: `Session ${index + 1}`, exercise_keys: draft.exercise_keys.slice(index % Math.max(1, draft.exercise_keys.length)).concat(draft.exercise_keys.slice(0, index % Math.max(1, draft.exercise_keys.length))).slice(0, Math.min(6, draft.exercise_keys.length)) }));
    setSaving(true);
    try { await onSaveProgram({ ...draft, schedule }); setDraft(null); }
    finally { setSaving(false); }
  }
  return <div className="page-stack">
    <PageIntro action={<button className="button button-primary" onClick={() => setDraft(createProgramDraft(data.programs.length + 1))}><Plus size={16} />New program</button>} description="Build level-targeted programs from the same exercises members see in the app. Each program keeps its audience, schedule, goal, and exercise composition together." title="Programs" />
    <section className="catalog-summary-grid"><article><strong>{data.programs.length}</strong><span>Programs in app</span></article>{allFitnessLevels.slice(0, 3).map((level) => <article key={level}><strong>{data.programs.filter((item) => (item.difficulty_levels ?? allFitnessLevels).includes(level)).length}</strong><span>{level} programs · {byLevel.get(level) ?? 0} members</span></article>)}</section>
    <section className="program-admin-grid">{data.programs.map((program) => <article className="program-admin-card" key={program.program_key}><img alt="" src={program.image_url} /><div><div className="level-chip-row">{(program.difficulty_levels ?? allFitnessLevels).map((level) => <span key={level}>{level}</span>)}</div><h3>{program.title}</h3><p>{program.target} · {program.sessions_per_week} days/week · {program.duration_weeks} weeks</p><small>{program.exercise_keys.length} exercises</small></div><button className="button button-secondary" onClick={() => setDraft({ ...program, difficulty_levels: program.difficulty_levels?.length ? program.difficulty_levels : allFitnessLevels })}><Pencil size={15} />Edit</button></article>)}</section>
    {draft ? <CatalogEditor headerAction={<button className="button button-primary" disabled={saving || !draft.title || !draft.image_url || !draft.exercise_keys.length || !draft.difficulty_levels.length} onClick={() => void save()}>{saving ? "Saving..." : "Save program"}</button>} title={draft.id ? `Edit ${draft.title}` : "Create program"} onClose={() => setDraft(null)}><div className="catalog-editor-layout"><div className="catalog-form-grid">
      <label>Program title<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label><label>Stable key<input disabled={Boolean(draft.id)} value={draft.program_key} onChange={(event) => setDraft({ ...draft, program_key: event.target.value.toLowerCase().replace(/\s+/g, "-") })} /></label>
      <label className="span-2">Professional description<textarea value={draft.subtitle} onChange={(event) => setDraft({ ...draft, subtitle: event.target.value })} /></label><label>Environment<select value={draft.environment} onChange={(event) => setDraft({ ...draft, environment: event.target.value as ProgramContent["environment"] })}><option>Gym</option><option>Home</option><option>Mobility</option></select></label><label>Goal / target<input value={draft.target} onChange={(event) => setDraft({ ...draft, target: event.target.value })} /></label>
      <label>Duration (weeks)<input type="number" min="1" value={draft.duration_weeks} onChange={(event) => setDraft({ ...draft, duration_weeks: Number(event.target.value) })} /></label><label>Sessions / week<input type="number" min="1" max="5" value={draft.sessions_per_week} onChange={(event) => setDraft({ ...draft, sessions_per_week: Number(event.target.value) })} /></label><label className="span-2">Cover image URL<input type="url" value={draft.image_url} onChange={(event) => setDraft({ ...draft, image_url: event.target.value })} /></label>
      <div className="span-2"><span className="field-label">Program exercises</span><div className="program-exercise-picker">{data.exercises.filter((item) => item.published).map((exercise) => { const selected = draft.exercise_keys.includes(exercise.exercise_key); return <label className={selected ? "exercise-pick selected" : "exercise-pick"} key={exercise.exercise_key}><input type="checkbox" checked={selected} onChange={() => setDraft({ ...draft, exercise_keys: selected ? draft.exercise_keys.filter((key) => key !== exercise.exercise_key) : [...draft.exercise_keys, exercise.exercise_key] })} /><img alt="" src={exercise.gif_url} /><span><strong>{exercise.name}</strong><small>{exercise.target_muscle}</small></span></label>; })}</div></div>
    </div><aside className="catalog-preview"><img alt="Program preview" src={draft.image_url || "https://placehold.co/520x360/f4f4f5/71717a?text=Program+cover"} /><h3>{draft.title || "Program preview"}</h3><p>{draft.exercise_keys.length} exercises selected. Schedule is generated into {draft.sessions_per_week} balanced sessions.</p><LevelPicker levels={draft.difficulty_levels} onChange={(difficulty_levels) => setDraft({ ...draft, difficulty_levels })} /><label className="publish-toggle"><input checked={draft.featured} type="checkbox" onChange={(event) => setDraft({ ...draft, featured: event.target.checked })} />Featured program</label><label className="publish-toggle"><input checked={draft.published} type="checkbox" onChange={(event) => setDraft({ ...draft, published: event.target.checked })} />Published in app</label></aside></div><div className="catalog-editor-actions"><button className="button button-secondary" onClick={() => setDraft(null)}>Cancel</button><button className="button button-primary" disabled={saving || !draft.title || !draft.image_url || !draft.exercise_keys.length || !draft.difficulty_levels.length} onClick={() => void save()}>{saving ? "Saving..." : "Save program"}</button></div></CatalogEditor> : null}
  </div>;
}

function CatalogEditor({ children, headerAction, onClose, title }: { children: ReactNode; headerAction?: ReactNode; onClose: () => void; title: string }) {
  return <div className="catalog-editor-layer" role="dialog" aria-modal="true" aria-label={title}><div className="catalog-editor-header"><div><span>Content studio</span><h2>{title}</h2></div><div className="catalog-editor-header-actions">{headerAction}<button className="icon-button" onClick={onClose} aria-label="Close editor">×</button></div></div><div className="catalog-editor-body">{children}</div></div>;
}

function LevelPicker({ levels, onChange }: { levels: FitnessLevel[]; onChange: (levels: FitnessLevel[]) => void }) {
  return <fieldset className="level-picker"><legend>Visible to athlete levels</legend>{allFitnessLevels.map((level) => { const checked = levels.includes(level); return <label className={checked ? "selected" : ""} key={level}><input checked={checked} type="checkbox" onChange={() => onChange(checked ? levels.filter((item) => item !== level) : [...levels, level])} /><span>{level}</span></label>; })}</fieldset>;
}

function MusclePicker({ muscles, onChange }: { muscles: string[]; onChange: (muscles: string[]) => void }) {
  return <fieldset className="level-picker muscle-picker"><legend>Secondary muscles</legend>{muscleOptions.map((muscle) => { const checked = muscles.includes(muscle); return <label className={checked ? "selected" : ""} key={muscle}><input checked={checked} type="checkbox" onChange={() => onChange(checked ? muscles.filter((item) => item !== muscle) : [...muscles, muscle])} /><span>{humanizeLabel(muscle)}</span></label>; })}</fieldset>;
}

function humanizeLabel(value: string) { return value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase()); }

function csv(value: string) { return value.split(",").map((item) => item.trim()).filter(Boolean); }
function lines(value: string) { return value.split("\n").map((item) => item.trim()).filter(Boolean); }

export function AdsPage({
  ads,
  onCreateCampaign,
  plans,
}: {
  ads: AdCampaign[];
  onCreateCampaign: (input: {
    name: string;
    placement: "home_feed" | "exercise_list" | "workout_complete";
    headline: string;
  }) => Promise<void>;
  plans: Plan[];
}) {
  const [name, setName] = useState("");
  const [placement, setPlacement] = useState<AdCampaign["placement"]>("exercise_list");
  const [headline, setHeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const freePlan = plans.find((plan) => plan.code === "free");

  async function submitCampaign() {
    setSaving(true);
    try {
      await onCreateCampaign({ headline, name, placement });
      setName("");
      setHeadline("");
      setPlacement("exercise_list");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-stack">
      <PageIntro
        description="Free monetization lives here. Campaigns on this page should only appear for members whose plan still shows ads."
        title="Ads"
      />

      <section className="split-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Live campaign list</h3>
              <p>Free plan ads are enabled: {freePlan?.entitlements.show_ads ? "Yes" : "No"}</p>
            </div>
          </div>
          {ads.length ? (
            <div className="campaign-list">
              {ads.map((campaign) => (
                <article className="campaign-card" key={campaign.id}>
                  <div className="campaign-top">
                    <StatusBadge value={campaign.status} />
                    <span>{campaign.placement.replaceAll("_", " ")}</span>
                  </div>
                  <strong>{campaign.name}</strong>
                  <p>{campaign.headline}</p>
                  <div className="campaign-stats">
                    <span>{campaign.impressions.toLocaleString("en")} impressions</span>
                    <span>{campaign.clicks.toLocaleString("en")} clicks</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState body="Create your first free-plan campaign." title="No campaigns" />
          )}
        </div>

        <div className="panel form-panel">
          <div className="panel-heading">
            <div>
              <h3>Create campaign</h3>
              <p>Draft the creative unit shown to Free members.</p>
            </div>
          </div>
          <div className="form-grid">
            <label>
              Campaign name
              <input onChange={(event) => setName(event.target.value)} value={name} />
            </label>
            <label>
              Placement
              <select onChange={(event) => setPlacement(event.target.value as AdCampaign["placement"])} value={placement}>
                <option value="home_feed">Home feed</option>
                <option value="exercise_list">Exercise list</option>
                <option value="workout_complete">Workout complete</option>
              </select>
            </label>
            <label className="span-2">
              Headline
              <input onChange={(event) => setHeadline(event.target.value)} value={headline} />
            </label>
          </div>
          <button
            className="button button-primary"
            disabled={!name || !headline || saving}
            onClick={submitCampaign}
          >
            {saving ? "Creating..." : "Create draft"}
          </button>
        </div>
      </section>
    </div>
  );
}

export function PaymentsPage({ data }: { data: DashboardData }) {
  const processedCount = data.billingEvents.filter((event) => event.processing_status === "processed").length;

  return (
    <div className="page-stack">
      <PageIntro
        description="This area is where subscriptions become real money. The UI is ready now, while Google Play and RevenueCat keys can be connected later."
        title="Payments"
      />

      <section className="feature-grid">
        <article className="feature-card">
          <BadgeDollarSign size={18} />
          <strong>{processedCount}</strong>
          <span>Processed billing events</span>
        </article>
        <article className="feature-card">
          <WalletCards size={18} />
          <strong>RevenueCat</strong>
          <span>Recommended subscription source for Android</span>
        </article>
        <article className="feature-card">
          <Crown size={18} />
          <strong>3 tiers</strong>
          <span>Free, Plus, and Pro entitlement ladder</span>
        </article>
      </section>

      <section className="split-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Provider rollout</h3>
              <p>The clean path for public launch.</p>
            </div>
          </div>
          <ul className="check-list check-list-detailed">
            <li className="done">Supabase plans and subscriptions schema ready</li>
            <li>Google Play subscriptions created for Plus and Pro</li>
            <li>RevenueCat products mapped to those Play items</li>
            <li>Webhook sync writes renewals and cancellations back to Supabase</li>
            <li>Mobile app reads entitlements and hides locked content</li>
          </ul>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Recent billing events</h3>
              <p>What the backend has already recorded.</p>
            </div>
          </div>
          {data.billingEvents.length ? (
            <div className="event-list">
              {data.billingEvents.map((event) => (
                <article className="event-row" key={event.id}>
                  <div>
                    <strong>{event.event_type}</strong>
                    <span>{event.provider}</span>
                  </div>
                  <div className="event-side">
                    <StatusBadge value={event.processing_status} />
                    <small>{formatDate(event.created_at)}</small>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState body="Billing events appear after the payment provider is connected." title="No billing events yet" />
          )}
        </div>
      </section>
    </div>
  );
}

export function SettingsPage() {
  return (
    <div className="page-stack">
      <PageIntro
        description="Operational settings for security, readiness, and launch policy."
        title="Settings"
      />

      <section className="split-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Admin security</h3>
              <p>What should stay locked before public launch.</p>
            </div>
          </div>
          <div className="settings-list">
            <article>
              <ShieldCheck size={18} />
              <div>
                <strong>Allowlisted owner email</strong>
                <span>`oulbachir2019@gmail.com` is the allowlisted owner account.</span>
              </div>
            </article>
            <article>
              <CircleAlert size={18} />
              <div>
                <strong>Google sign-in later</strong>
                <span>Owner dashboard works with email/password first, OAuth can come after.</span>
              </div>
            </article>
            <article>
              <Megaphone size={18} />
              <div>
                <strong>Free ads only</strong>
                <span>Keep ads disabled for Plus and Pro by entitlement, not only by UI.</span>
              </div>
            </article>
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Launch checklist</h3>
              <p>Short version for going public.</p>
            </div>
          </div>
          <ul className="check-list check-list-detailed">
            <li className="done">Admin dashboard built for operations</li>
            <li className="done">Supabase schema ready for plans, subscriptions, coaches, ads</li>
            <li>Android store products and screenshots prepared</li>
            <li>RevenueCat connected for Plus and Pro entitlements</li>
            <li>Coach chat workflow tested on a real device</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
