import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

const PILLARS = {
  E: {
    label: "Environmental",
    color: "#10B981",
    icon: "🌱",
    sections: ["C6", "CORE"],
    desc: "Emissions, energy, water, waste, circularity",
  },
  S: {
    label: "Social",
    color: "#3B82F6",
    icon: "👥",
    sections: ["C3", "C8"],
    desc: "Employees, safety, community, inclusion",
  },
  G: {
    label: "Governance",
    color: "#8B5CF6",
    icon: "⚖️",
    sections: ["A", "B", "C1"],
    desc: "Ethics, board, transparency, compliance",
  },
};

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
      const token = localStorage.getItem("token");
      const url = selectedUnit
        ? `http://localhost:8000/api/reports/brsr-pdf?entity_slug=${selectedUnit}`
        : "http://localhost:8000/api/reports/brsr-pdf";
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

  function colorFor(p) {
    if (p >= 85) return "#10B981";
    if (p >= 65) return "#3B82F6";
    if (p >= 45) return "#F59E0B";
    return "#EF4444";
  }

  return (
    <div>
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

      <div className="bg-gradient-to-br from-slate-900 to-[#0b1f33] text-white rounded-2xl p-7 mb-5">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400">
              Overall ESG Score
            </div>
            <div className="text-5xl font-extrabold mt-2 tracking-tight">
              {overallESG}
              <span className="text-2xl text-slate-500">%</span>
            </div>
            <div className="text-[12.5px] text-slate-400 mt-2 max-w-md">
              Weighted average across Environmental, Social and Governance
              pillars.
            </div>
          </div>

          <div className="flex gap-4 flex-wrap">
            {Object.entries(PILLARS).map(([key, pillar]) => (
              <div key={key} className="text-center">
                <div
                  className="w-20 h-20 rounded-2xl grid place-items-center mb-2 relative"
                  style={{
                    background: `conic-gradient(${pillar.color} ${pillarScores[key]}%, rgba(255,255,255,0.08) ${pillarScores[key]}%)`,
                  }}
                >
                  <div className="absolute inset-1.5 bg-[#0b1f33] rounded-2xl grid place-items-center">
                    <div>
                      <div className="text-lg font-extrabold">
                        {pillarScores[key]}
                        <span className="text-[10px] text-slate-500">%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-[10.5px] uppercase tracking-wider font-bold text-slate-400">
                  {key}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {Object.entries(PILLARS).map(([key, pillar]) => {
        const sections = sectionsFor(key);
        if (sections.length === 0) return null;
        return (
          <div
            key={key}
            className="bg-white border border-slate-200 rounded-2xl p-6 mb-4"
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

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
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
