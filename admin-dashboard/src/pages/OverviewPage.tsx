import { BadgeDollarSign, Clock3, Dumbbell, MessageSquare, Users } from "lucide-react";

import { EmptyState, Stat, StatusBadge, TableAction } from "../components/Ui";
import type { DashboardData, MemberRow, Plan } from "../types";

function formatMoney(value: number, currency = "MAD") {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function lastSeen(value: string | null) {
  if (!value) return "Never";
  const hours = Math.floor((Date.now() - new Date(value).getTime()) / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function OverviewPage({
  data,
  members,
  onManageMember,
  onManagePlans,
}: {
  data: DashboardData;
  members: MemberRow[];
  onManageMember: (member: MemberRow) => void;
  onManagePlans: () => void;
}) {
  const planByCode = new Map(data.plans.map((plan) => [plan.code, plan]));
  const activeSubscriptions = data.subscriptions.filter((subscription) =>
    ["active", "trialing"].includes(subscription.status),
  );
  const mrr = activeSubscriptions.reduce((total, subscription) => {
    return total + Number(planByCode.get(subscription.plan_code)?.monthly_price ?? 0);
  }, 0);
  const plusMembers = activeSubscriptions.filter((item) => item.plan_code === "plus").length;
  const proMembers = activeSubscriptions.filter((item) => item.plan_code === "pro").length;
  const openCoachSlots = data.coaches.reduce((total, coach) => {
    const assigned = data.assignments.filter(
      (assignment) => assignment.coach_id === coach.id && assignment.status === "active",
    ).length;
    return total + Math.max(0, coach.max_clients - assigned);
  }, 0);
  const spotlight = members[0] ?? null;

  return (
    <div className="overview-board">
      <div className="overview-main">
        <section className="stats-strip">
          <Stat
            hint="Registered accounts"
            icon={<Users size={19} />}
            label="Members"
            value={String(data.profiles.length)}
          />
          <Stat
            hint="Current monthly value"
            icon={<BadgeDollarSign size={19} />}
            label="MRR"
            value={formatMoney(mrr)}
          />
          <Stat
            hint="No ads, exercise videos"
            icon={<Dumbbell size={19} />}
            label="Plus members"
            value={String(plusMembers)}
          />
          <Stat
            hint="Coach chat enabled"
            icon={<MessageSquare size={19} />}
            label="Pro members"
            value={String(proMembers)}
          />
          <Stat
            hint="Across active coaches"
            icon={<Clock3 size={19} />}
            label="Coach capacity"
            value={String(openCoachSlots)}
          />
        </section>

        <section className="overview-grid">
          <div className="panel revenue-panel">
            <div className="panel-heading">
              <div>
                <h3>Revenue</h3>
                <p>Recurring subscription value by plan.</p>
              </div>
            </div>
            <RevenueChart mrr={mrr} />
          </div>

          <div className="panel">
            <div className="panel-heading">
              <div>
                <h3>Subscription mix</h3>
                <p>Current active membership distribution.</p>
              </div>
            </div>
            <PlanMix plans={data.plans} subscriptions={activeSubscriptions} />
          </div>
        </section>

        <section className="panel members-panel">
          <div className="panel-heading">
            <div>
              <h3>Recent members</h3>
              <p>Plan, account health, coach, and activity.</p>
            </div>
            <span className="muted-count">{members.length} total</span>
          </div>
          {members.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Coach</th>
                    <th>Last active</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {members.slice(0, 8).map((member) => (
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
                      <td><StatusBadge value={member.subscriptionStatus} /></td>
                      <td>{member.coachName ?? "Unassigned"}</td>
                      <td>{lastSeen(member.last_active_at)}</td>
                      <td><TableAction label="Open" onClick={() => onManageMember(member)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              body="New accounts will appear here after signup."
              title="No members yet"
            />
          )}
        </section>
      </div>

      <aside className="overview-rail">
        <div className="panel rail-panel">
          <div className="panel-heading">
            <div>
              <h3>Manage plans</h3>
              <p>Pricing and live access rules.</p>
            </div>
            <button className="icon-button" onClick={onManagePlans} title="Open plan manager">
              <MessageSquare size={16} />
            </button>
          </div>
          <div className="rail-plan-list">
            {data.plans.map((plan) => (
              <article className="rail-plan-row" key={plan.code}>
                <div>
                  <strong>{plan.name}</strong>
                  <span>{plan.description}</span>
                </div>
                <div className="rail-plan-side">
                  <small>{formatMoney(plan.monthly_price)}</small>
                  <StatusBadge value={plan.active ? "active" : "paused"} />
                </div>
              </article>
            ))}
          </div>
          <button className="button button-secondary button-wide" onClick={onManagePlans}>
            Open full plan editor
          </button>
        </div>

        <div className="panel rail-panel">
          <div className="panel-heading">
            <div>
              <h3>Member spotlight</h3>
              <p>Quick access to the latest account.</p>
            </div>
          </div>
          {spotlight ? (
            <div className="spotlight-card">
              <div className="member-cell">
                <div className="avatar avatar-large">{spotlight.name.slice(0, 1).toUpperCase()}</div>
                <div>
                  <strong>{spotlight.name}</strong>
                  <span>{spotlight.email ?? "No email"}</span>
                </div>
              </div>
              <div className="spotlight-grid">
                <div>
                  <span>Plan</span>
                  <StatusBadge value={spotlight.plan} />
                </div>
                <div>
                  <span>Status</span>
                  <StatusBadge value={spotlight.subscriptionStatus} />
                </div>
                <div>
                  <span>Coach</span>
                  <strong>{spotlight.coachName ?? "Unassigned"}</strong>
                </div>
                <div>
                  <span>Last active</span>
                  <strong>{lastSeen(spotlight.last_active_at)}</strong>
                </div>
              </div>
              <button className="button button-primary button-wide" onClick={() => onManageMember(spotlight)}>
                Open member details
              </button>
            </div>
          ) : (
            <EmptyState body="A signed-up member will appear here." title="No member yet" />
          )}
        </div>

        <div className="panel readiness-panel">
          <h3>Launch readiness</h3>
          <ul className="check-list">
            <li className={data.plans.length === 3 ? "done" : ""}>Three plans configured</li>
            <li className={data.coaches.length ? "done" : ""}>Coach capacity added</li>
            <li className={data.ads.length ? "done" : ""}>Free-plan ad campaign ready</li>
            <li>Google Play products connected</li>
            <li>RevenueCat webhook verified</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

function RevenueChart({ mrr }: { mrr: number }) {
  const points = [0.45, 0.52, 0.5, 0.66, 0.61, 0.74, 0.7, 0.82, 0.78, 0.9, 0.86, 1];
  const peak = Math.max(mrr, 1);
  return (
    <div className="chart-wrap">
      <div className="chart-y">
        <span>{formatMoney(peak)}</span>
        <span>{formatMoney(peak / 2)}</span>
        <span>{formatMoney(0)}</span>
      </div>
      <div className="chart">
        <div className="chart-grid" />
        <svg viewBox="0 0 600 220" role="img" aria-label="Revenue trend chart">
          <polyline
            fill="none"
            points={points.map((point, index) => `${index * 54},${210 - point * 170}`).join(" ")}
            stroke="#e11d48"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
        </svg>
        <div className="chart-axis">
          <span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Today</span>
        </div>
      </div>
    </div>
  );
}

function PlanMix({
  plans,
  subscriptions,
}: {
  plans: Plan[];
  subscriptions: DashboardData["subscriptions"];
}) {
  const total = Math.max(1, subscriptions.length);
  return (
    <div className="plan-mix plan-mix-donut">
      <div className="mix-ring">
        <div className="mix-ring-center">
          <strong>{subscriptions.length}</strong>
          <span>active</span>
        </div>
      </div>
      {plans.map((plan) => {
        const count = subscriptions.filter((item) => item.plan_code === plan.code).length;
        const percent = Math.round((count / total) * 100);
        return (
          <div className="plan-mix-row" key={plan.code}>
            <div>
              <span className={`plan-dot plan-dot-${plan.code}`} />
              <strong>{plan.name}</strong>
            </div>
            <div className="plan-mix-value">
              <span>{count}</span>
              <small>{percent}%</small>
            </div>
            <div className="plan-bar"><span className={`plan-fill-${plan.code}`} style={{ width: `${percent}%` }} /></div>
          </div>
        );
      })}
    </div>
  );
}
