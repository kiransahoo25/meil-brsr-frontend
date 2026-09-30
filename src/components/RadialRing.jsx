export default function RadialRing({
  value = 0,
  max = 100,
  size = 140,
  thickness = 12,
  color = "#10B981",
  label = "",
  sublabel = "",
}) {
  const pct = Math.max(0, Math.min(1, value / max));
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={thickness}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset .6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-xl font-bold tabular-nums text-slate-800">
              {Math.round(pct * 100)}
              <span className="text-xs font-medium text-slate-500">%</span>
            </div>
            {sublabel && (
              <div className="text-[10.5px] text-slate-500">{sublabel}</div>
            )}
          </div>
        </div>
      </div>
      {label && (
        <div className="text-xs font-semibold text-slate-600">{label}</div>
      )}
    </div>
  );
}
