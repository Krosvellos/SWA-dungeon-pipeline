"use client";
import React from "react";
import { Dataset, Pipeline, JobRun, AlertEvent } from "@/types/dashboard";

interface Props {
  datasets: Dataset[];
  pipelines: Pipeline[];
  jobRuns: JobRun[];
  alerts: AlertEvent[];
}

const Tile: React.FC<{ label: string; value: number | string; color?: string }> = ({ label, value, color }) => (
  <div className="flex flex-col items-center justify-center p-6 bg-[#111111] border-2 border-[#332211] rounded-md shadow-lg gap-2">
    <span className="text-4xl font-bold" style={{ color: color || "#ffd100" }}>{value}</span>
    <span className="text-xs text-[#888888] uppercase tracking-widest text-center">{label}</span>
  </div>
);

const OverviewDashboard: React.FC<Props> = ({ datasets, pipelines, jobRuns, alerts }) => {
  const activePipelines = pipelines.filter(p => p.active).length;
  const recentRuns = jobRuns.filter(r => {
    const d = new Date(r.startedAt);
    return Date.now() - d.getTime() < 24 * 60 * 60 * 1000;
  }).length;
  const failedRuns = jobRuns.filter(r => r.status === "FAILED").length;
  const openAlerts = alerts.filter(a => a.status === "OPEN").length;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold uppercase tracking-widest text-[#ffd100]">Přehled systému</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Tile label="Datasety" value={datasets.length} />
        <Tile label="Pipeline" value={pipelines.length} />
        <Tile label="Aktivní pipeline" value={activePipelines} color="#1eff00" />
        <Tile label="Běhy (24h)" value={recentRuns} />
        <Tile label="Selhání" value={failedRuns} color={failedRuns > 0 ? "#ff4444" : "#888888"} />
        <Tile label="Otevřené alerty" value={openAlerts} color={openAlerts > 0 ? "#ff9900" : "#888888"} />
      </div>

      {jobRuns.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-bold uppercase tracking-widest text-[#ffd100] mb-3">Poslední běhy</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-[#332211] text-[#888888] uppercase text-xs tracking-wider">
                  <th className="pb-2 pr-4">ID</th>
                  <th className="pb-2 pr-4">Pipeline</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Spuštění</th>
                  <th className="pb-2 pr-4">Trvání</th>
                  <th className="pb-2">Záznamy</th>
                </tr>
              </thead>
              <tbody>
                {jobRuns.slice(0, 5).map(run => {
                  const color = run.status === "SUCCESS" ? "text-green-400" : run.status === "FAILED" ? "text-red-400" : "text-yellow-400";
                  return (
                    <tr key={run.id} className="border-b border-[#1e1e1e] hover:bg-[#1a1a1a]">
                      <td className="py-2 pr-4 text-[#888888]">#{run.id}</td>
                      <td className="py-2 pr-4 text-[#cccccc]">{(run as any).pipelineId ?? "—"}</td>
                      <td className={`py-2 pr-4 font-bold ${color}`}>{run.status}</td>
                      <td className="py-2 pr-4 text-[#cccccc]">{new Date(run.startedAt).toLocaleString("cs-CZ")}</td>
                      <td className="py-2 pr-4 text-[#cccccc]">{run.durationSeconds != null ? `${run.durationSeconds}s` : "—"}</td>
                      <td className="py-2 text-[#cccccc]">{run.recordsProcessed ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewDashboard;
