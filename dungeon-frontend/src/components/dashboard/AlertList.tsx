"use client";
import React from "react";
import { AlertEvent, Pipeline } from "@/types/dashboard";
import { resolveAlert } from "@/services/dungeonService";

interface Props {
  alerts: AlertEvent[];
  pipelines: Pipeline[];
  onRefresh: () => void;
}

const SEVERITY_STYLE: Record<string, string> = {
  CRITICAL: "text-red-400 border-red-700",
  WARNING: "text-orange-400 border-orange-700",
  INFO: "text-blue-400 border-blue-700",
};

const STATUS_STYLE: Record<string, string> = {
  OPEN: "text-yellow-400",
  RESOLVED: "text-[#555555]",
};

const AlertList: React.FC<Props> = ({ alerts, pipelines, onRefresh }) => {
  const pipelineName = (id: number | null) =>
    id != null ? (pipelines.find(p => p.id === id)?.name ?? `#${id}`) : "—";

  const handleResolve = async (id: number) => {
    try {
      await resolveAlert(id);
      onRefresh();
    } catch { /* ignore */ }
  };

  const openAlerts = alerts.filter(a => a.status === "OPEN");
  const resolvedAlerts = alerts.filter(a => a.status === "RESOLVED");

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold uppercase tracking-widest text-[#ffd100]">
        Alerty
        {openAlerts.length > 0 && (
          <span className="ml-3 text-sm font-normal text-orange-400 border border-orange-700 px-2 py-0.5 rounded">
            {openAlerts.length} otevřených
          </span>
        )}
      </h2>

      {alerts.length === 0 ? (
        <p className="text-[#888888] italic">Žádné alerty.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-[#332211] text-[#888888] uppercase text-xs tracking-wider">
                <th className="pb-2 pr-4">ID</th>
                <th className="pb-2 pr-4">Závažnost</th>
                <th className="pb-2 pr-4">Pipeline</th>
                <th className="pb-2 pr-4">Run</th>
                <th className="pb-2 pr-4">Zpráva</th>
                <th className="pb-2 pr-4">Vytvořeno</th>
                <th className="pb-2 pr-4">Stav</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {alerts.map(a => (
                <tr key={a.id} className={`border-b border-[#1e1e1e] hover:bg-[#1a1a1a] ${a.status === "RESOLVED" ? "opacity-40" : ""}`}>
                  <td className="py-2 pr-4 text-[#888888]">#{a.id}</td>
                  <td className="py-2 pr-4">
                    <span className={`text-xs font-bold px-2 py-0.5 border rounded ${SEVERITY_STYLE[a.severity] ?? ""}`}>
                      {a.severity}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-[#cccccc]">{pipelineName(a.pipelineId)}</td>
                  <td className="py-2 pr-4 text-[#888888]">{a.jobRunId != null ? `#${a.jobRunId}` : "—"}</td>
                  <td className="py-2 pr-4 text-[#cccccc] max-w-xs">{a.message}</td>
                  <td className="py-2 pr-4 text-[#888888]">{new Date(a.createdAt).toLocaleString("cs-CZ")}</td>
                  <td className={`py-2 pr-4 font-bold text-xs uppercase ${STATUS_STYLE[a.status] ?? ""}`}>{a.status}</td>
                  <td className="py-2">
                    {a.status === "OPEN" && (
                      <button onClick={() => handleResolve(a.id)}
                        className="text-xs text-green-500 hover:text-green-300 uppercase tracking-wider">
                        Vyřešit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AlertList;
