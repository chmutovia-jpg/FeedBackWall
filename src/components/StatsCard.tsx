export function StatsCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="fw-card fw-stat-card">
      <div className="fw-stat-value">{value}</div>
      <div className="fw-stat-label">{label}</div>
    </div>
  )
}
