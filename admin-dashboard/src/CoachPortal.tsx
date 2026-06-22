import { useMemo, useState } from "react";
import { Dumbbell, LogOut, MessageCircle, Send, Users } from "lucide-react";

import type { DashboardData } from "./types";

export function CoachPortal({ data, onSendMessage, onSignOut }: {
  data: DashboardData;
  onSendMessage: (conversationId: string, body: string) => Promise<void>;
  onSignOut: () => Promise<void>;
}) {
  const coach = data.coaches[0];
  const [selectedId, setSelectedId] = useState(data.conversations[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const profilesById = useMemo(() => new Map(data.profiles.map((profile) => [profile.user_id, profile])), [data.profiles]);
  const selected = data.conversations.find((item) => item.id === selectedId) ?? data.conversations[0];
  const member = selected ? profilesById.get(selected.member_user_id) : null;
  const settings = member ? data.userSettings.find((item) => item.user_id === member.user_id) : null;
  const intake = member ? data.memberIntakes.find((item) => item.user_id === member.user_id) : null;
  const workouts = member ? data.workouts.filter((item) => item.user_id === member.user_id) : [];
  const messages = selected ? data.messages.filter((message) => message.conversation_id === selected.id) : [];

  async function submit() {
    if (!selected || !draft.trim() || sending) return;
    setSending(true);
    try { await onSendMessage(selected.id, draft.trim()); setDraft(""); }
    finally { setSending(false); }
  }

  return <div className="coach-portal">
    <header className="coach-portal-header">
      <div className="brand-lockup"><div className="brand-icon"><Dumbbell size={22} /></div><div><strong>Apex Coach</strong><span>Private workspace</span></div></div>
      <div className="coach-identity"><div><strong>{coach?.full_name ?? "Coach"}</strong><span>{coach?.email}</span></div><button className="icon-button" onClick={() => void onSignOut()} title="Sign out"><LogOut size={18} /></button></div>
    </header>
    <main className="coach-workspace">
      <aside className="coach-client-list">
        <div className="panel-heading"><div><h3>Your Pro members</h3><p>{data.profiles.length} active assignments</p></div><Users size={19} /></div>
        {data.conversations.map((conversation) => {
          const client = profilesById.get(conversation.member_user_id);
          return <button className={conversation.id === selected?.id ? "coach-client active" : "coach-client"} key={conversation.id} onClick={() => setSelectedId(conversation.id)}><span className="avatar">{client?.name?.[0] ?? "M"}</span><span><strong>{client?.name ?? "Pro member"}</strong><small>{client?.goal ?? "Personal coaching"}</small></span></button>;
        })}
        {!data.conversations.length ? <div className="coach-empty"><MessageCircle size={24} /><strong>No assigned conversations yet</strong><span>The admin will assign Pro members here.</span></div> : null}
      </aside>
      <section className="coach-chat-panel">
        {selected && member ? <>
          <div className="coach-chat-title"><div><h2>{member.name}</h2><p>{humanize(member.fitness_level)} · {member.goal}</p></div><span className="status-badge status-active">Pro coaching</span></div>
          <section className="coach-client-profile">
            <div className="coach-client-metrics">
              <ClientFact label="Weight" value={`${member.weight} kg`} /><ClientFact label="Height" value={`${member.height} cm`} /><ClientFact label="Training" value={`${member.training_days_per_week} days / week`} /><ClientFact label="Intensity" value={humanize(member.preferred_intensity)} />
            </div>
            <div className="coach-client-details">
              <ClientFact label="Equipment" value={settings?.equipment ?? "Not answered"} />
              <ClientFact label="Health notes" value={settings?.health?.length ? settings.health.join(", ") : "None reported"} />
              {Object.entries(intake?.answers ?? {}).map(([key, value]) => <ClientFact key={key} label={humanize(key)} value={formatValue(value)} />)}
            </div>
            <div className="coach-workout-summary"><strong>Recent workouts</strong><span>{workouts.length ? workouts.map((item) => `${item.title} (${item.total_sets} sets)`).join(" · ") : "No completed workouts yet"}</span></div>
          </section>
          <div className="coach-message-feed">{messages.map((message) => <article className={message.sender_kind === "coach" ? "coach-message mine" : "coach-message"} key={message.id}><span>{message.body}</span><small>{new Date(message.created_at).toLocaleString()}</small></article>)}{!messages.length ? <div className="coach-empty"><MessageCircle size={28} /><strong>Start the coaching conversation</strong><span>Share a welcome note or the member's first action step.</span></div> : null}</div>
          <div className="coach-composer"><textarea aria-label="Message" onChange={(event) => setDraft(event.target.value)} placeholder="Write a message to your member..." value={draft} /><button className="button button-primary" disabled={!draft.trim() || sending} onClick={() => void submit()}><Send size={16} />{sending ? "Sending" : "Send"}</button></div>
        </> : <div className="coach-empty coach-empty-large"><Users size={34} /><strong>Your workspace is ready</strong><span>Once an admin assigns a Pro member, their conversation will appear here.</span></div>}
      </section>
    </main>
  </div>;
}

function ClientFact({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Not answered";
  if (Array.isArray(value)) return value.length ? value.map((item) => humanize(String(item))).join(", ") : "None";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).map(formatValue).join(" · ");
  return humanize(String(value));
}
function humanize(value: string): string { return value.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase()); }
