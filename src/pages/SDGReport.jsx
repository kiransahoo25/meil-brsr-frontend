import { useEffect, useMemo, useState } from "react";
import { PolarArea, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { BRSR_PRINCIPLES, SDG_DEFINITIONS } from "../data/brsr";
import { MOCK_ENTITIES, aggregateByPrinciple } from "../data/mockReports";
import { exportSDGPDF } from "../lib/exporters";
import RadialRing from "../components/RadialRing";
import api from "../lib/api";

ChartJS.register(
  RadialLinearScale,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
);

const GRID = "rgba(148, 163, 184, .18)";

const PRINCIPLE_SDGS = {
  P1: [16],
  P2: [12],
  P3: [3, 8],
  P4: [17],
  P5: [5, 8, 10],
  P6: [6, 7, 12, 13, 14, 15],
  P7: [16, 17],
  P8: [1, 8, 10, 11],
  P9: [3, 12],
};

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

function computePrincipleScores(agg) {
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

function computeSdgFromPrinciples(principleScores) {
  const map = {};
  Object.entries(principleScores).forEach(([pid, score]) => {
    const sdgs = PRINCIPLE_SDGS[pid] || [];
    sdgs.forEach((sid) => {
      map[sid] = Math.max(map[sid] || 0, score);
    });
  });
  return map;
}

export default function SDGReport() {
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/sdg/report")
      .then(({ data }) => {
        if (cancelled) return;
        const scores = data?.sdgScores || {};
        const hasReal = Object.values(scores).some((v) => Number(v) > 0);
        if (hasReal) {
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

  const agg = useMemo(() => aggregateByPrinciple(MOCK_ENTITIES), []);

  const principleScores = useMemo(() => {
    if (liveData?.principleScores) return liveData.principleScores;
    return computePrincipleScores(agg);
  }, [liveData, agg]);

  const sdgScores = useMemo(() => {
    if (liveData?.sdgScores) return liveData.sdgScores;
    return computeSdgFromPrinciples(principleScores);
  }, [liveData, principleScores]);

  const activeSdgs = SDG_DEFINITIONS.filter(
    (s) => sdgScores[s.id] !== undefined,
  ).map((s) => ({
    ...s,
    principles: BRSR_PRINCIPLES.filter((p) => p.sdgs.includes(s.id))
      .map((p) => p.id)
      .join(", "),
  }));

  const avgScore = activeSdgs.length
    ? Math.round(
        activeSdgs.reduce((s, x) => s + sdgScores[x.id], 0) / activeSdgs.length,
      )
    : 0;

  const polarData = {
    labels: activeSdgs.map((s) => `SDG ${s.id}`),
    datasets: [
      {
        data: activeSdgs.map((s) => sdgScores[s.id]),
        backgroundColor: activeSdgs.map((s) => s.color + "cc"),
        borderColor: "transparent",
      },
    ],
  };

  const barData = {
    labels: activeSdgs.map((s) => `SDG ${s.id}`),
    datasets: [
      {
        label: "Alignment score",
        data: activeSdgs.map((s) => sdgScores[s.id]),
        backgroundColor: activeSdgs.map((s) => s.color),
        borderRadius: 5,
      },
    ],
  };

  const handlePDF = () => {
    exportSDGPDF({ sdgScores, activeSdgs, avgScore });
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-slate-500">
        Loading SDG report…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            SDG Alignment Report — FY 2025–26
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            UN Sustainable Development Goals mapped from BRSR principle
            performance.
          </p>
        </div>
        <button
          onClick={handlePDF}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-sky-500 text-[#04231a] font-bold text-[13px] hover:opacity-90 transition"
        >
          ⬇ Download PDF
        </button>
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
            value={avgScore}
            max={100}
            size={90}
            thickness={9}
            color="#0EA5E9"
          />
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Avg Alignment
            </div>
            <div className="text-2xl font-bold text-slate-800 tabular-nums mt-1">
              {avgScore}
              <span className="text-xs font-medium text-slate-500">/100</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Across all mapped goals
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            SDGs Addressed
          </div>
          <div className="text-2xl font-bold text-slate-800 tabular-nums mt-2">
            {activeSdgs.length}
            <span className="text-xs font-medium text-slate-500">/ 17</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-3">
            Mapped from 9 NGRBC principles
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Primary Goal
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">SDG 13</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Climate Action
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${sdgScores[13] || 0}%`,
                background: "#3f7e44",
              }}
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Strongest Goal
          </div>
          {(() => {
            const top = [...activeSdgs].sort(
              (a, b) => sdgScores[b.id] - sdgScores[a.id],
            )[0];
            return top ? (
              <>
                <div className="text-2xl font-bold text-slate-800 mt-2">
                  SDG {top.id}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {top.name} · {sdgScores[top.id]}/100
                </div>
              </>
            ) : null;
          })()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-bold text-slate-800">
            SDG Alignment Overview
          </h3>
          <p className="text-[11.5px] text-slate-500 mt-1 mb-4">
            Polar view of contribution to each mapped SDG
          </p>
          <div className="relative h-[400px]">
            <PolarArea
              data={polarData}
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
          <h3 className="text-sm font-bold text-slate-800">Score by Goal</h3>
          <p className="text-[11.5px] text-slate-500 mt-1 mb-4">
            NGRBC principles → SDG mapping
          </p>
          <div className="relative h-[400px]">
            <Bar
              data={barData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false }, ticks: { color: "#475569" } },
                  y: {
                    grid: { color: GRID },
                    beginAtZero: true,
                    max: 100,
                    ticks: { color: "#475569" },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {activeSdgs.map((sdg) => (
          <div
            key={sdg.id}
            className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div
                className="grid h-10 w-10 place-items-center rounded-lg text-sm font-bold text-white"
                style={{ background: sdg.color }}
              >
                {sdg.id}
              </div>
              <span className="text-sm font-bold text-slate-800 tabular-nums">
                {sdgScores[sdg.id]}
              </span>
            </div>
            <h4 className="mt-3 text-[13px] font-semibold text-slate-800">
              {sdg.name}
            </h4>
            <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${sdgScores[sdg.id]}%`,
                  background: sdg.color,
                }}
              />
            </div>
            <div className="mt-2 text-[10.5px] text-slate-500">
              Mapped via {sdg.principles}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
