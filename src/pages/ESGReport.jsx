import { useEffect, useMemo, useState } from "react";
import { Radar, Doughnut, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { BRSR_PRINCIPLES } from "../data/brsr";
import { MOCK_ENTITIES, aggregateByPrinciple } from "../data/mockReports";
import { YOY_YEARS, YOY_METRICS } from "../data/yearOverYear";
import { exportESGPDF, exportCSV } from "../lib/exporters";
import RadialRing from "../components/RadialRing";
import api from "../lib/api";

ChartJS.register(
  RadialLinearScale,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

const GRID = "rgba(148, 163, 184, .18)";

const MAXES = {
  P1: { ethicsTraining: 100, antiCorruptionCases: 20, policyCoverage: 100 },
  P2: {
    recycledInput: 100,
    productSafetyIncidents: 20,
    lifecycleAssessments: 30,
  },
  P3: {
    ltifr: 2,
    trainingHours: 80,
    womenWorkforce: 100,
    safetyIncidents: 100,
  },
  P4: {
    grievancesReceived: 500,
    grievancesResolved: 500,
    communityMeetings: 100,
  },
  P5: { hrTraining: 100, hrComplaints: 20, minimumWage: 100 },
  P6: {
    scope1: 500000,
    scope2: 200000,
    energyConsumption: 10000,
    waterWithdrawal: 50,
    wasteRecycled: 100,
  },
  P7: { policyPositions: 20, tradeAssociations: 30 },
  P8: { csrSpend: 500, localEmployment: 100, scstEmployment: 100 },
  P9: { productSafety: 100, customerComplaints: 500, complaintsResolved: 100 },
};

function computeScoresFromAgg(agg) {
  const scores = {};
  BRSR_PRINCIPLES.forEach((p) => {
    const keys = p.indicators.map((i) => i.key);
    const total = keys.reduce((s, k) => {
      const max = MAXES[p.id]?.[k] || 100;
      return s + Math.min(100, ((agg[p.id]?.[k] || 0) / max) * 100);
    }, 0);
    scores[p.id] = Math.round(total / keys.length);
  });
  return scores;
}

function isAllZero(agg) {
  return Object.values(agg).every((principle) =>
    Object.values(principle).every((v) => Number(v) === 0),
  );
}

export default function ESGReport() {
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/esg/report")
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.principles && !isAllZero(data.principles)) {
          setLiveData(data);
          setUsingMock(false);
        } else {
          setUsingMock(true);
        }
      })
      .catch(() => {
        if (!cancelled) setUsingMock(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const agg = useMemo(() => {
    if (liveData?.principles) return liveData.principles;
    return aggregateByPrinciple(MOCK_ENTITIES);
  }, [liveData]);

  const entityList = useMemo(() => {
    if (liveData?.entities?.length) return liveData.entities;
    return MOCK_ENTITIES;
  }, [liveData]);

  const env = {
    scope1: agg.P6.scope1,
    scope2: agg.P6.scope2,
    water: agg.P6.waterWithdrawal,
    energy: agg.P6.energyConsumption,
    waste: agg.P6.wasteRecycled,
  };

  const esgSplit = {
    labels: ["Environment", "Social", "Governance"],
    datasets: [
      {
        data: [
          env.scope1 + env.scope2,
          agg.P3.safetyIncidents +
            agg.P4.grievancesReceived +
            agg.P5.hrComplaints,
          agg.P1.antiCorruptionCases + agg.P7.policyPositions,
        ],
        backgroundColor: ["#10B981", "#0EA5E9", "#F59E0B"],
        borderWidth: 0,
      },
    ],
  };

  const principleScores = useMemo(() => computeScoresFromAgg(agg), [agg]);

  const radarData = {
    labels: BRSR_PRINCIPLES.map((p) => p.id),
    datasets: [
      {
        label: "Performance",
        data: Object.values(principleScores),
        backgroundColor: "rgba(16,185,129,.18)",
        borderColor: "#10B981",
        borderWidth: 2,
        pointBackgroundColor: "#10B981",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
      },
    ],
  };

  const entityBarData = {
    labels: entityList.map((e) => e.name),
    datasets: [
      {
        label: "Scope 1+2 (tCO2e)",
        data: entityList.map((e) => (e.scope1 || 0) + (e.scope2 || 0)),
        backgroundColor: "#10B981",
        borderRadius: 4,
      },
    ],
  };

  const yoyData = {
    labels: YOY_YEARS,
    datasets: [
      {
        label: YOY_METRICS.scope1.label,
        data: YOY_METRICS.scope1.data,
        borderColor: YOY_METRICS.scope1.color,
        backgroundColor: YOY_METRICS.scope1.color + "22",
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: YOY_METRICS.scope1.color,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        yAxisID: "y",
      },
      {
        label: YOY_METRICS.scope2.label,
        data: YOY_METRICS.scope2.data,
        borderColor: YOY_METRICS.scope2.color,
        backgroundColor: YOY_METRICS.scope2.color + "22",
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: YOY_METRICS.scope2.color,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        yAxisID: "y",
      },
      {
        label: YOY_METRICS.water.label,
        data: YOY_METRICS.water.data,
        borderColor: YOY_METRICS.water.color,
        backgroundColor: "transparent",
        fill: false,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: YOY_METRICS.water.color,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        yAxisID: "y1",
      },
    ],
  };

  const yoyOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 10, padding: 14 } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#475569" } },
      y: {
        type: "linear",
        display: true,
        position: "left",
        grid: { color: GRID },
        beginAtZero: true,
        ticks: {
          color: "#475569",
          callback: (v) => (v >= 1000 ? v / 1000 + "k" : v),
        },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        grid: { drawOnChartArea: false },
        beginAtZero: true,
        ticks: { color: "#475569" },
      },
    },
  };

  const avgPrincipleScore = Math.round(
    Object.values(principleScores).reduce((a, b) => a + b, 0) /
      Object.keys(principleScores).length,
  );

  const handlePDF = () => {
    exportESGPDF({
      agg,
      entities: entityList,
      principleScores: Object.values(principleScores),
      principles: BRSR_PRINCIPLES,
    });
  };

  const handleCSV = () => {
    const headers = ["Principle", "Indicator", "Unit", "Value", "Max"];
    const rows = [];
    BRSR_PRINCIPLES.forEach((p) => {
      p.indicators.forEach((ind) => {
        rows.push([
          p.id,
          ind.label,
          ind.unit,
          agg[p.id][ind.key] || 0,
          ind.max,
        ]);
      });
    });
    exportCSV("MEIL_ESG_Data_FY2025-26.csv", headers, rows);
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-slate-500">
        Loading ESG report…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            ESG Report — FY 2025–26
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Consolidated BRSR report across {entityList.length} entities.
            Aligned to SEBI BRSR and the nine NGRBC principles.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleCSV}
            className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-[13px] hover:bg-slate-50 transition"
          >
            ⬇ CSV
          </button>
          <button
            onClick={handlePDF}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-sky-500 text-[#04231a] font-bold text-[13px] hover:opacity-90 transition"
          >
            ⬇ Download PDF
          </button>
        </div>
      </div>

      {usingMock && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-lg text-[12.5px]">
          <b>Demo mode</b> — showing sample data. Enter real BRSR values via{" "}
          <b>BRSR Data Collection</b> and this page will update automatically.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4">
          <RadialRing
            value={avgPrincipleScore}
            max={100}
            size={90}
            thickness={9}
            color="#10B981"
          />
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Overall BRSR Score
            </div>
            <div className="text-2xl font-bold text-slate-800 tabular-nums mt-1">
              {avgPrincipleScore}
              <span className="text-xs font-medium text-slate-500">/100</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              9 principles averaged
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4">
          <RadialRing
            value={env.waste}
            max={100}
            size={90}
            thickness={9}
            color="#0EA5E9"
          />
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Waste Recycled
            </div>
            <div className="text-2xl font-bold text-slate-800 tabular-nums mt-1">
              {Number(env.waste).toFixed(1)}
              <span className="text-xs font-medium text-slate-500">%</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Of total waste generated
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Total Emissions
          </div>
          <div className="text-2xl font-bold text-slate-800 tabular-nums mt-2">
            {(env.scope1 + env.scope2).toLocaleString()}
            <span className="text-xs font-medium text-slate-500 ml-1">
              tCO2e
            </span>
          </div>
          <div className="mt-3 flex gap-3 text-[11px] text-slate-500">
            <span>
              <b className="text-slate-700">S1</b> {env.scope1.toLocaleString()}
            </span>
            <span>
              <b className="text-slate-700">S2</b> {env.scope2.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Water Withdrawal
          </div>
          <div className="text-2xl font-bold text-slate-800 tabular-nums mt-2">
            {Number(env.water).toFixed(1)}
            <span className="text-xs font-medium text-slate-500 ml-1">ML</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-3">
            Across {entityList.length} entities
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-bold text-slate-800">
            BRSR Principle Performance
          </h3>
          <p className="text-[11.5px] text-slate-500 mt-1 mb-4">
            Normalized 0–100 across the 9 NGRBC principles
          </p>
          <div className="relative h-[340px]">
            <Radar
              data={radarData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  r: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: GRID },
                    angleLines: { color: GRID },
                    pointLabels: {
                      color: "#475569",
                      font: { size: 11, weight: "600" },
                    },
                    ticks: {
                      color: "#94A3B8",
                      backdropColor: "transparent",
                      stepSize: 25,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-bold text-slate-800">
            E · S · G Contribution
          </h3>
          <p className="text-[11.5px] text-slate-500 mt-1 mb-4">
            Relative weight of each pillar
          </p>
          <div className="relative h-[340px]">
            <Doughnut
              data={esgSplit}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom" } },
                cutout: "65%",
              }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-800">
          Year-over-Year Trend
        </h3>
        <p className="text-[11.5px] text-slate-500 mt-1 mb-4">
          Emissions and water withdrawal · FY23 → FY26
        </p>
        <div className="relative h-[360px]">
          <Line data={yoyData} options={yoyOptions} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-5">
          {Object.entries(YOY_METRICS).map(([key, m]) => (
            <div
              key={key}
              className="rounded-lg border border-slate-200 px-4 py-3"
            >
              <div className="text-[10.5px] font-bold uppercase tracking-wide text-slate-500">
                {m.label}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-lg font-bold text-slate-800 tabular-nums">
                  {m.data[m.data.length - 1].toLocaleString()}
                </span>
                <span
                  className={`text-[11.5px] font-bold px-1.5 py-0.5 rounded ${
                    m.trend === "down"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {m.delta > 0 ? "▲" : "▼"} {Math.abs(m.delta)}%
                </span>
              </div>
              <div className="text-[10.5px] text-slate-500 mt-0.5">
                {m.unit} · vs FY25
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-800">
          Emissions by Entity
        </h3>
        <p className="text-[11.5px] text-slate-500 mt-1 mb-4">
          Scope 1 + Scope 2 (tCO2e) per entity
        </p>
        <div className="relative h-[360px]">
          <Bar
            data={entityBarData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: { maxRotation: 45, minRotation: 45, color: "#475569" },
                },
                y: {
                  grid: { color: GRID },
                  beginAtZero: true,
                  ticks: {
                    color: "#475569",
                    callback: (v) => (v >= 1000 ? v / 1000 + "k" : v),
                  },
                },
              },
            }}
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Principle-wise Indicator Register
            </h3>
            <p className="text-[11.5px] text-slate-500 mt-0.5">
              Consolidated values across all entities
            </p>
          </div>
          <button
            onClick={handleCSV}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11.5px] font-semibold text-slate-700 transition"
          >
            ⬇ Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-5 py-3 text-[10.5px] font-bold uppercase tracking-wide text-slate-500 border-b border-slate-200">
                  Principle
                </th>
                <th className="text-left px-5 py-3 text-[10.5px] font-bold uppercase tracking-wide text-slate-500 border-b border-slate-200">
                  Indicator
                </th>
                <th className="text-left px-5 py-3 text-[10.5px] font-bold uppercase tracking-wide text-slate-500 border-b border-slate-200">
                  Unit
                </th>
                <th className="text-right px-5 py-3 text-[10.5px] font-bold uppercase tracking-wide text-slate-500 border-b border-slate-200">
                  Consolidated
                </th>
                <th className="text-left px-5 py-3 text-[10.5px] font-bold uppercase tracking-wide text-slate-500 border-b border-slate-200">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {BRSR_PRINCIPLES.flatMap((p) =>
                p.indicators.map((ind, idx) => (
                  <tr
                    key={p.id + ind.key}
                    className="border-b border-slate-100 hover:bg-slate-50 last:border-b-0"
                  >
                    <td className="px-5 py-3">
                      {idx === 0 && (
                        <span
                          className="inline-block px-2 py-0.5 rounded-md text-[10.5px] font-bold text-white"
                          style={{ background: p.color }}
                        >
                          {p.id}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-700">{ind.label}</td>
                    <td className="px-5 py-3 text-slate-500">{ind.unit}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-800 tabular-nums">
                      {(agg[p.id][ind.key] || 0).toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                        Verified
                      </span>
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
