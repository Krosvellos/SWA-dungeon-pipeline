"use client";
import React, { useEffect, useState } from "react";
import { Pipeline, Dataset, JobRun, JobRunStep, AlertEvent, AlertRule } from "@/types/dashboard";
import { fetchJobRunSteps } from "@/services/dungeonService";

interface Props {
  pipeline: Pipeline;
  datasets: Dataset[];
  jobRuns: JobRun[];
  alerts: AlertEvent[];
  alertRules: AlertRule[];
  onClose: () => void;
  onRun: (id: number) => void;
  running: boolean;
}

const STEP_COLORS: Record<string, string> = {
  PENDING: "text-gray-400",
  RUNNING: "text-yellow-400",
  SUCCESS: "text-green-400",
  FAILED:  "text-red-400",
};

const ModalStepRows: React.FC<{ runId: number }> = ({ runId }) => {
  const [steps, setSteps] = useState<JobRunStep[] | null>(null);

  useEffect(() => {
    fetchJobRunSteps(runId).then(setSteps).catch(() => setSteps([]));
  }, [runId]);

  if (!steps) return (
    <tr><td colSpan={6} className="py-1 pl-8 text-[10px] text-[#555555] animate-pulse">Načítám…</td></tr>
  );
  if (steps.length === 0) return (
    <tr><td colSpan={6} className="py-1 pl-8 text-[10px] text-[#555555] italic">Žádné kroky.</td></tr>
  );
  return (
    <>
      {steps.map(step => {
        const dur = step.startedAt && step.finishedAt
          ? Math.round((new Date(step.finishedAt).getTime() - new Date(step.startedAt).getTime()) / 1000)
          : null;
        return (
          <tr key={step.id} className="bg-[#080808]">
            <td className="py-1 pl-8 text-[#444444] text-[10px]">↳</td>
            <td className={`py-1 pr-4 text-[10px] font-bold ${STEP_COLORS[step.status] ?? ""}`}>{step.status}</td>
            <td className="py-1 pr-4 text-[10px] text-[#999999] font-mono">{step.stepName}</td>
            <td className="py-1 pr-4 text-[10px] text-[#777777]">{dur != null ? `${dur}s` : "—"}</td>
            <td className="py-1 pr-4 text-[10px] text-[#777777]">{step.recordsProcessed ?? "—"}</td>
            <td className="py-1 text-[10px] text-red-400 truncate max-w-[12rem]">{step.errorMessage ?? "—"}</td>
          </tr>
        );
      })}
    </>
  );
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-gray-400",
  RUNNING: "text-yellow-400",
  SUCCESS: "text-green-400",
  FAILED:  "text-red-400",
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "text-red-400",
  WARNING:  "text-orange-400",
  INFO:     "text-blue-400",
};

const ALERT_MODE_LABELS: Record<string, string> = {
  CONSECUTIVE_FAIL_EMAIL:   "Email při 2 selháních",
  NO_ALERTS:                "Žádné alerty",
  EXCLUDE_TIMEOUT_FAILURES: "Bez timeoutových alertů",
};

const PipelineDetailModal: React.FC<Props> = ({
  pipeline, datasets, jobRuns, alerts, alertRules, onClose, onRun, running,
}) => {
  const [expandedRunId, setExpandedRunId] = useState<number | null>(null);
  const toggleRun = (id: number) => setExpandedRunId(prev => prev === id ? null : id);

  const pipelineRuns   = jobRuns.filter(r => r.pipelineId === pipeline.id);
  const pipelineAlerts = alerts.filter(a => a.pipelineId === pipeline.id);
  const alertRule      = alertRules.find(r => r.pipelineId === pipeline.id);
  const dataset        = datasets.find(d => d.id === pipeline.datasetId);
  const openAlerts     = pipelineAlerts.filter(a => a.status === "OPEN").length;

  const successCount = pipelineRuns.filter(r => r.status === "SUCCESS").length;
  const failedCount  = pipelineRuns.filter(r => r.status === "FAILED").length;
  const doneRuns     = pipelineRuns.filter(r => r.durationSeconds != null);
  const avgDuration  = doneRuns.length > 0
    ? Math.round(doneRuns.reduce((s, r) => s + (r.durationSeconds ?? 0), 0) / doneRuns.length)
    : null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-[#0d0d0d] border-2 border-[#443322] shadow-2xl my-8"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#332211]">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-2 py-0.5 border rounded ${
              pipeline.active ? "border-green-700 text-green-400" : "border-[#554433] text-[#888888]"
            }`}>
              {pipeline.active ? "AKTIVNÍ" : "NEAKTIVNÍ"}
            </span>
            <h2 className="text-2xl font-bold text-[#ffd100]">{pipeline.name}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onRun(pipeline.id)}
              disabled={!pipeline.active || running}
              className="px-4 py-1.5 text-xs font-bold uppercase border border-[#ffd100] text-[#ffd100] bg-[#ffd100]/10 hover:bg-[#ffd100]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {running ? "Spouštím…" : "▶ Spustit"}
            </button>
            <button onClick={onClose} className="text-[#666666] hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center">
              ✕
            </button>
          </div>
        </div>

        {/* ── Metadata grid ── */}
        <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-[#221a11] text-xs">
          <div>
            <span className="text-[#888888] uppercase tracking-wider block mb-0.5">Dataset</span>
            <span className="text-[#ffd100] font-bold">{dataset?.name ?? `#${pipeline.datasetId}`}</span>
          </div>
          <div>
            <span className="text-[#888888] uppercase tracking-wider block mb-0.5">Schedule</span>
            <span className="text-[#cccccc]">{pipeline.schedule ?? "—"}</span>
          </div>
          <div>
            <span className="text-[#888888] uppercase tracking-wider block mb-0.5">Alert pravidlo</span>
            <span className="text-[#cccccc]">
              {alertRule ? ALERT_MODE_LABELS[alertRule.alertMode] : "Výchozí (email při 2×)"}
            </span>
          </div>
          <div>
            <span className="text-[#888888] uppercase tracking-wider block mb-0.5">Timeout</span>
            <span className="text-[#cccccc]">{pipeline.timeoutMinutes} min</span>
          </div>
          <div>
            <span className="text-[#888888] uppercase tracking-wider block mb-0.5">Vytvořeno</span>
            <span className="text-[#cccccc]">{new Date(pipeline.createdAt).toLocaleDateString("cs-CZ")}</span>
          </div>
        </div>

        {/* ── Stats tiles ── */}
        <div className="px-6 py-4 grid grid-cols-3 gap-3 border-b border-[#221a11]">
          <div className="bg-[#111111] border border-[#1e1e1e] p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{successCount}</div>
            <div className="text-xs text-[#888888] uppercase tracking-wider mt-1">Úspěšné</div>
          </div>
          <div className="bg-[#111111] border border-[#1e1e1e] p-3 text-center">
            <div className="text-2xl font-bold text-red-400">{failedCount}</div>
            <div className="text-xs text-[#888888] uppercase tracking-wider mt-1">Selhání</div>
          </div>
          <div className="bg-[#111111] border border-[#1e1e1e] p-3 text-center">
            <div className="text-2xl font-bold text-[#ffd100]">{avgDuration != null ? `${avgDuration}s` : "—"}</div>
            <div className="text-xs text-[#888888] uppercase tracking-wider mt-1">Prům. trvání</div>
          </div>
        </div>

        {/* ── Runs ── */}
        <div className="px-6 py-4 border-b border-[#221a11]">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#ffd100] mb-3">
            Běhy ({pipelineRuns.length})
          </h3>
          {pipelineRuns.length === 0 ? (
            <p className="text-[#888888] italic text-sm">Žádné běhy.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#332211] text-[#888888] uppercase tracking-wider">
                    <th className="pb-1 pr-2 w-4"></th>
                    <th className="pb-1 pr-4">ID</th>
                    <th className="pb-1 pr-4">Status</th>
                    <th className="pb-1 pr-4">Spuštění</th>
                    <th className="pb-1 pr-4">Trvání</th>
                    <th className="pb-1">Záznamy</th>
                  </tr>
                </thead>
                <tbody>
                  {pipelineRuns.slice(0, 10).map(run => {
                    const isExpanded = expandedRunId === run.id;
                    return (
                      <React.Fragment key={run.id}>
                        <tr
                          className="border-b border-[#1a1a1a] hover:bg-[#161616] cursor-pointer select-none"
                          onClick={() => toggleRun(run.id)}
                        >
                          <td className="py-1.5 pr-2 text-[#444444]">{isExpanded ? "▼" : "▶"}</td>
                          <td className="py-1.5 pr-4 text-[#888888]">#{run.id}</td>
                          <td className={`py-1.5 pr-4 font-bold ${STATUS_COLORS[run.status] ?? ""}`}>{run.status}</td>
                          <td className="py-1.5 pr-4 text-[#cccccc]">{new Date(run.startedAt).toLocaleString("cs-CZ")}</td>
                          <td className="py-1.5 pr-4 text-[#cccccc]">{run.durationSeconds != null ? `${run.durationSeconds}s` : "—"}</td>
                          <td className="py-1.5 text-[#cccccc]">{run.recordsProcessed ?? "—"}</td>
                        </tr>
                        {isExpanded && <ModalStepRows runId={run.id} />}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
              {pipelineRuns.length > 10 && (
                <p className="mt-2 text-xs text-[#666666] italic">Zobrazeno posledních 10 z {pipelineRuns.length} běhů.</p>
              )}
            </div>
          )}
        </div>

        {/* ── Alerts ── */}
        <div className="px-6 py-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#ffd100] mb-3 flex items-center gap-2">
            Alerty ({pipelineAlerts.length})
            {openAlerts > 0 && (
              <span className="text-orange-400 border border-orange-700 px-1.5 py-0.5 rounded font-normal">
                {openAlerts} otevřených
              </span>
            )}
          </h3>
          {pipelineAlerts.length === 0 ? (
            <p className="text-[#888888] italic text-sm">Žádné alerty.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#332211] text-[#888888] uppercase tracking-wider">
                    <th className="pb-1 pr-4">Závažnost</th>
                    <th className="pb-1 pr-4">Run</th>
                    <th className="pb-1 pr-4">Zpráva</th>
                    <th className="pb-1 pr-4">Vytvořeno</th>
                    <th className="pb-1">Stav</th>
                  </tr>
                </thead>
                <tbody>
                  {pipelineAlerts.slice(0, 8).map(a => (
                    <tr key={a.id} className={`border-b border-[#1a1a1a] hover:bg-[#161616] ${a.status === "RESOLVED" ? "opacity-40" : ""}`}>
                      <td className={`py-1.5 pr-4 font-bold ${SEVERITY_COLORS[a.severity] ?? ""}`}>{a.severity}</td>
                      <td className="py-1.5 pr-4 text-[#888888]">{a.jobRunId != null ? `#${a.jobRunId}` : "—"}</td>
                      <td className="py-1.5 pr-4 text-[#cccccc] max-w-[18rem] truncate">{a.message}</td>
                      <td className="py-1.5 pr-4 text-[#888888]">{new Date(a.createdAt).toLocaleString("cs-CZ")}</td>
                      <td className={`py-1.5 font-bold ${a.status === "OPEN" ? "text-yellow-400" : "text-[#555555]"}`}>{a.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pipeline.description && (
          <div className="px-6 pb-4">
            <p className="text-xs text-[#555555] italic">{pipeline.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PipelineDetailModal;
