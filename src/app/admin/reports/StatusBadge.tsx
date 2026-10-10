export default function StatusBadge({ status, sentAt }: { status: string; sentAt: string | null }) {
  const [label, bg, color] =
    status === "draft"
      ? ["Draf", "#F1F5F9", "#475569"]
      : sentAt
        ? ["Terkirim", "#DCFCE7", "#166534"]
        : ["Terbit", "#DBEAFE", "#1E40AF"];
  return (
    <span className="badge" style={{ backgroundColor: bg, color }}>
      {label}
    </span>
  );
}
