import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { Coach, DashboardData, MemberRow, Plan, PlanCode } from "../types";
import { StatusBadge } from "./Ui";

export function PlanDrawer({
  plans,
  visible,
  onClose,
  onSave,
}: {
  plans: Plan[];
  visible: boolean;
  onClose: () => void;
  onSave: (plan: Plan) => Promise<void>;
}) {
  const [drafts, setDrafts] = useState(plans);
  const [savingCode, setSavingCode] = useState<PlanCode | null>(null);

  useEffect(() => setDrafts(plans), [plans]);
  if (!visible) return null;

  function patchPlan(code: PlanCode, patch: Partial<Plan>) {
    setDrafts((current) =>
      current.map((plan) => (plan.code === code ? { ...plan, ...patch } : plan)),
    );
  }

  return (
    <div className="drawer-layer">
      <button className="drawer-scrim" onClick={onClose} aria-label="Close plan manager" />
      <aside className="drawer drawer-wide">
        <div className="drawer-header">
          <div>
            <h2>Manage plans</h2>
            <p>Pricing and feature entitlements used by the app.</p>
          </div>
          <button className="icon-button" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="plan-editor-list">
          {drafts.map((plan) => (
            <section className="plan-editor" key={plan.code}>
              <div className="plan-editor-title">
                <div>
                  <StatusBadge value={plan.code} />
                  <h3>{plan.name}</h3>
                  <p>{plan.description}</p>
                </div>
                <label className="switch-row">
                  <input
                    checked={plan.active}
                    onChange={(event) => patchPlan(plan.code, { active: event.target.checked })}
                    type="checkbox"
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className="form-grid">
                <label>
                  Monthly price
                  <div className="input-suffix">
                    <input
                      min="0"
                      onChange={(event) =>
                        patchPlan(plan.code, { monthly_price: Number(event.target.value) })
                      }
                      type="number"
                      value={plan.monthly_price}
                    />
                    <span>{plan.currency}</span>
                  </div>
                </label>
                <label>
                  Yearly price
                  <div className="input-suffix">
                    <input
                      min="0"
                      onChange={(event) =>
                        patchPlan(plan.code, { yearly_price: Number(event.target.value) })
                      }
                      type="number"
                      value={plan.yearly_price}
                    />
                    <span>{plan.currency}</span>
                  </div>
                </label>
                <label className="span-2">
                  Description
                  <input
                    onChange={(event) => patchPlan(plan.code, { description: event.target.value })}
                    value={plan.description}
                  />
                </label>
              </div>

              <div className="entitlement-grid">
                <Entitlement
                  checked={plan.entitlements.video_access}
                  label="Exercise videos"
                  onChange={(checked) =>
                    patchPlan(plan.code, {
                      entitlements: { ...plan.entitlements, video_access: checked },
                    })
                  }
                />
                <Entitlement
                  checked={plan.entitlements.all_exercises}
                  label="All exercises"
                  onChange={(checked) =>
                    patchPlan(plan.code, {
                      entitlements: {
                        ...plan.entitlements,
                        all_exercises: checked,
                        exercise_limit: checked ? null : (plan.entitlements.exercise_limit ?? 24),
                      },
                    })
                  }
                />
                <Entitlement
                  checked={!plan.entitlements.show_ads}
                  label="No ads"
                  onChange={(checked) =>
                    patchPlan(plan.code, {
                      entitlements: { ...plan.entitlements, show_ads: !checked },
                    })
                  }
                />
                <Entitlement
                  checked={plan.entitlements.coach_chat}
                  label="Coach chat"
                  onChange={(checked) =>
                    patchPlan(plan.code, {
                      entitlements: { ...plan.entitlements, coach_chat: checked },
                    })
                  }
                />
                <Entitlement
                  checked={plan.entitlements.priority_support}
                  label="Priority support"
                  onChange={(checked) =>
                    patchPlan(plan.code, {
                      entitlements: { ...plan.entitlements, priority_support: checked },
                    })
                  }
                />
              </div>

              {!plan.entitlements.all_exercises ? (
                <label className="exercise-limit">
                  Exercise limit
                  <input
                    min="1"
                    onChange={(event) =>
                      patchPlan(plan.code, {
                        entitlements: {
                          ...plan.entitlements,
                          exercise_limit: Number(event.target.value),
                        },
                      })
                    }
                    type="number"
                    value={plan.entitlements.exercise_limit ?? 24}
                  />
                </label>
              ) : null}

              <button
                className="button button-primary"
                disabled={savingCode === plan.code}
                onClick={async () => {
                  setSavingCode(plan.code);
                  try {
                    await onSave(plan);
                  } finally {
                    setSavingCode(null);
                  }
                }}
              >
                {savingCode === plan.code ? "Saving..." : "Save plan"}
              </button>
            </section>
          ))}
        </div>
      </aside>
    </div>
  );
}

function Entitlement({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={checked ? "entitlement entitlement-on" : "entitlement"}>
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      <span className="entitlement-check">{checked ? <Check size={14} /> : null}</span>
      <span>{label}</span>
    </label>
  );
}

export function MemberDrawer({
  coaches,
  data,
  member,
  visible,
  onClose,
  onSave,
}: {
  coaches: Coach[];
  data: DashboardData;
  member: MemberRow | null;
  visible: boolean;
  onClose: () => void;
  onSave: (input: {
    userId: string;
    plan: PlanCode;
    accountStatus: MemberRow["account_status"];
    coachId: string | null;
  }) => Promise<void>;
}) {
  const [plan, setPlan] = useState<PlanCode>("free");
  const [accountStatus, setAccountStatus] = useState<MemberRow["account_status"]>("active");
  const [coachId, setCoachId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!member) return;
    setPlan(member.plan);
    setAccountStatus(member.account_status);
    setCoachId(coaches.find((coach) => coach.full_name === member.coachName)?.id ?? "");
  }, [coaches, member]);

  if (!visible || !member) return null;

  const settings = data.userSettings.find((item) => item.user_id === member.user_id);
  const intake = data.memberIntakes.find((item) => item.user_id === member.user_id);
  const workouts = data.workouts.filter((item) => item.user_id === member.user_id);
  const bmi = member.height > 0 ? member.weight / ((member.height / 100) ** 2) : null;
  const answers = Object.entries(intake?.answers ?? {});

  return (
    <div className="member-profile-layer" role="dialog" aria-modal="true" aria-label={`${member.name} profile`}>
      <header className="member-profile-header">
        <button className="button button-secondary" onClick={onClose}>
          <X size={17} /> Back to members
        </button>
        <div className="member-profile-identity">
          <div className="member-cell">
            <div className="avatar avatar-large">{member.name.slice(0, 1).toUpperCase()}</div>
            <div>
              <h2>{member.name}</h2>
              <p>{member.email}</p>
            </div>
          </div>
          <div className="member-profile-statuses">
            <StatusBadge value={member.plan} />
            <StatusBadge value={member.account_status} />
          </div>
          <button className="icon-button" onClick={onClose} title="Close member profile" aria-label="Close member profile">
            <X size={18} />
          </button>
        </div>
      </header>

      <div className="member-profile-layout">
        <main className="member-profile-main">
          <section className="profile-metric-grid">
            <ProfileMetric label="Weight" value={`${member.weight} kg`} />
            <ProfileMetric label="Height" value={`${member.height} cm`} />
            <ProfileMetric label="BMI" value={bmi ? bmi.toFixed(1) : "—"} />
            <ProfileMetric label="Training" value={`${member.training_days_per_week} days / week`} />
            <ProfileMetric label="Fitness level" value={humanize(member.fitness_level)} />
            <ProfileMetric label="Intensity" value={humanize(member.preferred_intensity)} />
          </section>

          <section className="profile-section">
            <div className="panel-heading"><div><h3>Goals & preferences</h3><p>The member's current training setup.</p></div></div>
            <div className="answer-grid">
              <AnswerCard label="Primary goal" value={member.goal} />
              <AnswerCard label="Available equipment" value={settings?.equipment ?? "Not answered"} />
              <AnswerCard label="Health notes" value={settings?.health?.length ? settings.health : "None reported"} />
              <AnswerCard label="Joined" value={new Date(member.created_at).toLocaleDateString()} />
            </div>
          </section>

          <section className="profile-section">
            <div className="panel-heading"><div><h3>Onboarding answers</h3><p>Everything the member answered when creating their plan.</p></div><span>{answers.length} answers</span></div>
            {answers.length ? (
              <div className="answer-grid">
                {answers.map(([key, value]) => <AnswerCard key={key} label={humanize(key)} value={value} />)}
              </div>
            ) : <p className="profile-empty">No onboarding answers synced yet. They will appear after the member opens the app.</p>}
          </section>

          <section className="profile-section">
            <div className="panel-heading"><div><h3>Workout history</h3><p>Latest completed sessions and training volume.</p></div></div>
            {workouts.length ? <div className="workout-history">{workouts.map((workout) => (
              <article key={workout.id}><div><strong>{workout.title}</strong><span>{new Date(workout.completed_at).toLocaleString()}</span></div><span>{workout.exercise_count} exercises</span><span>{workout.total_sets} sets</span></article>
            ))}</div> : <p className="profile-empty">No completed workouts yet.</p>}
          </section>
        </main>

        <aside className="member-profile-sidebar">
          <section className="profile-section sticky-access-card">
            <div className="panel-heading"><div><h3>Access & coach</h3><p>Billing and coaching controls.</p></div></div>
            <div className="member-summary">
              <div><span>Billing status</span><StatusBadge value={member.subscriptionStatus} /></div>
              <div><span>Provider</span><StatusBadge value={member.provider} /></div>
            </div>
            <label>Plan<select value={plan} onChange={(event) => setPlan(event.target.value as PlanCode)}><option value="free">Free</option><option value="plus">Plus</option><option value="pro">Pro</option></select></label>
            <label>Account status<select value={accountStatus} onChange={(event) => setAccountStatus(event.target.value as MemberRow["account_status"])}><option value="active">Active</option><option value="suspended">Suspended</option><option value="deleted">Deleted</option></select></label>
            <label>Coach<select value={coachId} onChange={(event) => setCoachId(event.target.value)}><option value="">Unassigned</option>{coaches.map((coach) => <option key={coach.id} value={coach.id}>{coach.full_name}</option>)}</select></label>
            {plan !== "pro" ? <p className="inline-note">Coach access is available only for Pro members.</p> : null}
            <button className="button button-primary profile-save" disabled={saving} onClick={async () => {
              setSaving(true);
              try {
                await onSave({ accountStatus, coachId: plan === "pro" && coachId ? coachId : null, plan, userId: member.user_id });
                onClose();
              } finally { setSaving(false); }
            }}>{saving ? "Saving..." : "Save changes"}</button>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return <article><span>{label}</span><strong>{value}</strong></article>;
}

function AnswerCard({ label, value }: { label: string; value: unknown }) {
  return <article className="answer-card"><span>{label}</span><strong>{formatValue(value)}</strong></article>;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Not answered";
  if (Array.isArray(value)) return value.length ? value.map((item) => humanize(String(item))).join(", ") : "None";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return Object.entries(value as Record<string, unknown>).map(([key, item]) => `${humanize(key)}: ${formatValue(item)}`).join(" · ");
  return humanize(String(value));
}

function humanize(value: string): string {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}
