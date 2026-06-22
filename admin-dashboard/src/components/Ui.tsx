import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, ChevronRight, LoaderCircle } from "lucide-react";

export function Stat({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <div className="stat">
      <div className="stat-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{hint}</small>
      </div>
    </div>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const tone =
    normalized.includes("active") || normalized.includes("processed")
      ? "success"
      : normalized.includes("past") || normalized.includes("away") || normalized.includes("pending")
        ? "warning"
        : normalized.includes("free") || normalized.includes("manual")
          ? "neutral"
          : normalized.includes("pro")
            ? "pro"
            : "accent";

  return <span className={`status status-${tone}`}>{value.replaceAll("_", " ")}</span>;
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <AlertCircle size={22} />
      <strong>{title}</strong>
      <p>{body}</p>
      {action}
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="loading-state">
      <LoaderCircle className="spin" size={24} />
      <span>Loading admin data...</span>
    </div>
  );
}

export function Toast({
  message,
  error,
}: {
  message: string;
  error?: boolean;
}) {
  return (
    <div className={error ? "toast toast-error" : "toast"}>
      {error ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
      <span>{message}</span>
    </div>
  );
}

export function PageIntro({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-intro">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

export function TableAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="table-action" onClick={onClick}>
      {label}
      <ChevronRight size={15} />
    </button>
  );
}
