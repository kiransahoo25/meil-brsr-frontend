import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
  PolarAngleAxis,
} from "recharts";

const PILLARS = {
  E: {
    label: "Environmental",
    color: "#10B981",
    icon: "🌱",
    sections: ["C2", "C6", "CORE"],
    desc: "Sustainable products, emissions, energy, water, waste",
  },
  S: {
    label: "Social",
    color: "#3B82F6",
    icon: "👥",
    sections: ["C3", "C5", "C8", "C9"],
    desc: "Employees, safety, human rights, community, customers",
  },
  G: {
    label: "Governance",
    color: "#8B5CF6",
    icon: "⚖️",
    sections: ["A", "B", "C1", "C4", "C7"],
    desc: "Ethics, board, stakeholders, public policy",
  },
};

function colorFor(p) {
  if (p >= 85) return "#10B981";
  if (p >= 65) return "#3B82F6";
  if (p >= 45) return "#F59E0B";
  return "#EF4444";
}

// Custom tooltip for the radial chart
function PillarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-[12px]">
      <div className="font-bold text-slate-800">{d.name}</div>
      <div className="font-mono font-bold mt-0.5" style={{ color: d.fill }}>
        {d.value}%
      </div>
    </div>
  );
}

function SectionTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-[12px] max-w-[240px]">
      <div className="font-bold text-slate-800">{d.fullName}</div>
      <div className="text-slate-500 text-[11px] mt-0.5">{d.sub}</div>
      <div className="font-mono font-bold text-slate-700 mt-1">
        {d.progress}%
      </div>
    </div>
  );
}

export default function ESGReport() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [units, setUnits] = useState([]);

  const isGroupLevel =
    user.role === "esg-officer" || user.role === "group-admin";
  const selectedUnit = searchParams.get("unit") || "";

  useEffect(() => {
    if (isGroupLevel) {
      api.get("/entities").then(({ data }) => {
        const unitsList = data.filter(
          (e) => e.type === "Business Unit" || e.type === "Subsidiary",
        );
        setUnits(unitsList);
      });
    }
  }, [isGroupLevel]);

  useEffect(() => {
    setLoading(true);
    const url = selectedUnit
      ? `/dashboard/stats?entity_slug=${selectedUnit}`
      : "/dashboard/stats";
    api
      .get(url)
      .then(({ data }) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedUnit]);

  async function downloadPDF() {
    setDownloading(true);
    try {
      const token = sessionStorage.getItem("token");
      const apiBase =
        import.meta.env.VITE_API_URL || "http://localhost:8000/api";
      const url = selectedUnit
        ? `${apiBase}/reports/brsr-pdf?entity_slug=${selectedUnit}`
        : `${apiBase}/reports/brsr-pdf`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "MEIL_BRSR_Report_FY2526.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err) {
      alert("PDF generation failed: " + err.message);
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20 text-slate-500">
        Loading ESG report…
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20 text-slate-500">
        Could not load ESG data.
      </div>
    );
  }

  const sectionMap = Object.fromEntries(
    stats.sectionProgress.map((s) => [s.code, s.progress]),
  );

  const pillarScores = {};
  for (const [key, pillar] of Object.entries(PILLARS)) {
    const relevant = pillar.sections.map((c) => sectionMap[c] || 0);
    const avg = relevant.length
      ? Math.round(relevant.reduce((a, b) => a + b, 0) / relevant.length)
      : 0;
    pillarScores[key] = avg;
  }

  const overallESG = Math.round(
    (pillarScores.E + pillarScores.S + pillarScores.G) / 3,
  );

  function sectionsFor(pillarKey) {
    return PILLARS[pillarKey].sections
      .map((code) => stats.sectionProgress.find((s) => s.code === code))
      .filter(Boolean);
  }

  // ---- Chart data ----
  const radialData = [
    { name: "Governance", value: pillarScores.G, fill: PILLARS.G.color },
    { name: "Social", value: pillarScores.S, fill: PILLARS.S.color },
    { name: "Environmental", value: pillarScores.E, fill: PILLARS.E.color },
  ];

  const sectionBarData = stats.sectionProgress.map((s) => ({
    code: s.code,
    name: s.name,
    fullName: `${s.name} · ${s.sub}`,
    sub: s.sub,
    progress: s.progress,
    fill: colorFor(s.progress),
  }));

  const donutData = [
    { name: "Completed", value: overallESG, color: "#10B981" },
    { name: "Remaining", value: 100 - overallESG, color: "#e2e8f0" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-4 mb-5 flex-wrap">
        <div className="flex-1 min-w-[260px]">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            ESG Report
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            {selectedUnit
              ? units.find((u) => u.slug === selectedUnit)?.name
              : isGroupLevel
                ? "MEIL Group (All Units)"
                : user.entity}{" "}
            · FY 2025-26 · Environmental, Social &amp; Governance performance
          </p>
        </div>

        {isGroupLevel && units.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500">
              Unit
            </label>
            <select
              value={selectedUnit}
              onChange={(e) => {
                const v = e.target.value;
                if (v) setSearchParams({ unit: v });
                else setSearchParams({});
              }}
              className="px-3 py-2 border-2 border-slate-200 rounded-xl bg-white text-[13px] font-semibold focus:border-green-500 outline-none min-w-[200px]"
            >
              <option value="">🌐 All Units (Group)</option>
              {units.map((u) => (
                <option key={u.slug} value={u.slug}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={downloadPDF}
          disabled={downloading}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold text-[12.8px] hover:shadow-lg transition disabled:opacity-60"
        >
          {downloading ? "⏳ Generating…" : "⬇ Download BRSR PDF"}
        </button>
      </div>

      {/* ============ HERO: Overall Score + Radial Pillar Chart ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {/* Overall score donut */}
        <div className="bg-gradient-to-br from-slate-900 to-[#0b1f33] text-white rounded-2xl p-6">
          <div className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 mb-2">
            Overall ESG Score
          </div>
          <div className="flex items-center justify-center my-4">
            <div style={{ width: 180, height: 180, position: "relative" }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    innerRadius={62}
                    outerRadius={88}
                    startAngle={90}
                    endAngle={-270}
                    paddingAngle={0}
                    stroke="none"
                  >
                    <Cell fill="#10B981" />
                    <Cell fill="rgba(255,255,255,0.08)" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <div className="text-center">
                  <div className="text-4xl font-extrabold tracking-tight">
                    {overallESG}
                    <span className="text-xl text-slate-500">%</span>
                  </div>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-1">
                    ESG Score
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-[12.5px] text-slate-400 text-center mt-2">
            Weighted average across E, S and G pillars
          </div>
        </div>

        {/* Radial pillar chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 lg:p-6">
          <h3 className="text-[14px] font-bold text-slate-900 mb-1">
            ESG Pillar Scores
          </h3>
          <p className="text-[12px] text-slate-500 mb-2">
            How each pillar performs relative to a 100% target
          </p>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <RadialBarChart
                data={radialData}
                innerRadius="30%"
                outerRadius="100%"
                startAngle={90}
                endAngle={-270}
                barSize={28}
              >
                <PolarAngleAxis
                  type="number"
                  domain={[0, 100]}
                  angleAxisId={0}
                  tick={false}
                />
                <RadialBar
                  background={{ fill: "#f1f5f9" }}
                  dataKey="value"
                  cornerRadius={10}
                >
                  {radialData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </RadialBar>
                <Tooltip content={<PillarTooltip />} />
                <Legend
                  iconSize={10}
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  wrapperStyle={{ fontSize: 12, color: "#475569" }}
                  formatter={(value, entry) => {
                    const v = entry.payload.value;
                    return `${value} · ${v}%`;
                  }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ============ SECTION PROGRESS HORIZONTAL BARS ============ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 lg:p-6 mb-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-1">
          Section Completion
        </h3>
        <p className="text-[12px] text-slate-500 mb-4">
          Progress across every BRSR section — colored by status
        </p>
        <div
          style={{
            width: "100%",
            height: Math.max(280, sectionBarData.length * 42),
          }}
        >
          <ResponsiveContainer>
            <BarChart
              data={sectionBarData}
              layout="vertical"
              margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
                horizontal={false}
              />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "#475569", fontSize: 11, fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
                width={110}
              />
              <Tooltip
                content={<SectionTooltip />}
                cursor={{ fill: "rgba(0,0,0,0.03)" }}
              />
              <Bar dataKey="progress" radius={[0, 6, 6, 0]} barSize={18}>
                {sectionBarData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ============ PILLAR BREAKDOWN CARDS ============ */}
      {Object.entries(PILLARS).map(([key, pillar]) => {
        const sections = sectionsFor(key);
        if (sections.length === 0) return null;
        return (
          <div
            key={key}
            className="bg-white border border-slate-200 rounded-2xl p-5 lg:p-6 mb-4"
          >
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
              <div
                className="w-12 h-12 rounded-xl grid place-items-center text-2xl"
                style={{ background: pillar.color + "20", color: pillar.color }}
              >
                {pillar.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-[16px] font-extrabold text-slate-900">
                  {pillar.label}
                </h3>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  {pillar.desc}
                </p>
              </div>
              <div className="text-right">
                <div
                  className="text-3xl font-extrabold"
                  style={{ color: colorFor(pillarScores[key]) }}
                >
                  {pillarScores[key]}%
                </div>
                <div className="text-[10.5px] uppercase tracking-wider font-bold text-slate-400">
                  pillar score
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              {sections.map((s) => (
                <div key={s.code} className="flex items-center gap-3 py-2">
                  <div className="w-[180px] flex-shrink-0 text-[12.5px] font-semibold text-slate-700 truncate">
                    {s.name}
                  </div>
                  <div className="text-[11.5px] text-slate-500 w-[160px] flex-shrink-0 truncate hidden md:block">
                    {s.sub}
                  </div>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${s.progress}%`,
                        background: colorFor(s.progress),
                      }}
                    />
                  </div>
                  <div className="w-[48px] text-right font-bold text-[12px] tabular-nums text-slate-700">
                    {s.progress}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* ============ KEY INDICATORS TABLE ============ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 lg:p-6">
        <h3 className="text-[14px] font-bold mb-4">Key ESG Indicators</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.6px]">
            <thead>
              <tr className="text-left text-[10.3px] uppercase tracking-wide text-slate-500 font-extrabold border-b border-slate-200">
                <th className="py-2.5 pr-3">Pillar</th>
                <th className="py-2.5 pr-3">Indicator</th>
                <th className="py-2.5 pr-3">Value</th>
                <th className="py-2.5 pr-3">Unit</th>
                <th className="py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-2.5 pr-3">
                  <span className="inline-block px-2 py-0.5 rounded text-[10.5px] font-extrabold bg-green-100 text-green-700">
                    E
                  </span>
                </td>
                <td className="py-2.5 pr-3 font-semibold">Scope 1 emissions</td>
                <td className="py-2.5 pr-3 font-mono">218,450</td>
                <td className="py-2.5 pr-3 text-slate-500">tCO₂e</td>
                <td className="py-2.5">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10.8px] font-bold bg-green-100 text-green-800">
                    On track
                  </span>
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2.5 pr-3">
                  <span className="inline-block px-2 py-0.5 rounded text-[10.5px] font-extrabold bg-green-100 text-green-700">
                    E
                  </span>
                </td>
                <td className="py-2.5 pr-3 font-semibold">Scope 2 emissions</td>
                <td className="py-2.5 pr-3 font-mono">341,220</td>
                <td className="py-2.5 pr-3 text-slate-500">tCO₂e</td>
                <td className="py-2.5">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10.8px] font-bold bg-green-100 text-green-800">
                    On track
                  </span>
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2.5 pr-3">
                  <span className="inline-block px-2 py-0.5 rounded text-[10.5px] font-extrabold bg-green-100 text-green-700">
                    E
                  </span>
                </td>
                <td className="py-2.5 pr-3 font-semibold">Scope 3 emissions</td>
                <td className="py-2.5 pr-3 font-mono">1,204,660</td>
                <td className="py-2.5 pr-3 text-slate-500">tCO₂e</td>
                <td className="py-2.5">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10.8px] font-bold bg-amber-100 text-amber-800">
                    Boundary gap
                  </span>
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2.5 pr-3">
                  <span className="inline-block px-2 py-0.5 rounded text-[10.5px] font-extrabold bg-blue-100 text-blue-700">
                    S
                  </span>
                </td>
                <td className="py-2.5 pr-3 font-semibold">
                  Health insurance coverage
                </td>
                <td className="py-2.5 pr-3 font-mono">100</td>
                <td className="py-2.5 pr-3 text-slate-500">%</td>
                <td className="py-2.5">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10.8px] font-bold bg-green-100 text-green-800">
                    Complete
                  </span>
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2.5 pr-3">
                  <span className="inline-block px-2 py-0.5 rounded text-[10.5px] font-extrabold bg-blue-100 text-blue-700">
                    S
                  </span>
                </td>
                <td className="py-2.5 pr-3 font-semibold">LTIFR</td>
                <td className="py-2.5 pr-3 font-mono">0.41</td>
                <td className="py-2.5 pr-3 text-slate-500">per Mn hrs</td>
                <td className="py-2.5">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10.8px] font-bold bg-green-100 text-green-800">
                    On track
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-2.5 pr-3">
                  <span className="inline-block px-2 py-0.5 rounded text-[10.5px] font-extrabold bg-violet-100 text-violet-700">
                    G
                  </span>
                </td>
                <td className="py-2.5 pr-3 font-semibold">
                  Anti-corruption training coverage
                </td>
                <td className="py-2.5 pr-3 font-mono">96</td>
                <td className="py-2.5 pr-3 text-slate-500">%</td>
                <td className="py-2.5">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10.8px] font-bold bg-green-100 text-green-800">
                    On track
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl text-[12.4px]">
        ℹ️ ESG scores are computed from BRSR field completion in the relevant
        NGRBC principles. Complete all fields in each principle to reach 100%.
      </div>
    </div>
  );
}
