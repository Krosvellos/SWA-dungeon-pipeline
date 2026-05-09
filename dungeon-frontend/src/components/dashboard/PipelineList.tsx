"use client";
import React, { useState, useEffect } from "react";
import { Pipeline, Dataset, JobRun, AlertEvent, AlertRule, AlertMode } from "@/types/dashboard";
import { createPipeline, updatePipeline, deletePipeline, runPipeline, setPipelineActive, upsertAlertRule } from "@/services/dungeonService";
import PipelineDetailModal from "./PipelineDetailModal";

const ALERT_MODE_LABELS: Record<AlertMode, string> = {
  CONSECUTIVE_FAIL_EMAIL: "Email při 2 selháních",
  NO_ALERTS: "Žádné alerty",
  EXCLUDE_TIMEOUT_FAILURES: "Bez timeoutových alertů",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "text-gray-400",
  RUNNING: "text-yellow-400",
  SUCCESS: "text-green-400",
  FAILED:  "text-red-400",
};

interface Props {
  pipelines: Pipeline[];
  datasets: Dataset[];
  jobRuns: JobRun[];
  alerts: AlertEvent[];
  alertRules: AlertRule[];
  onRefresh: () => void;
  onRunStarted: () => void;
}

const PipelineList: React.FC<Props> = ({ pipelines, datasets, jobRuns, alerts, alertRules, onRefresh, onRunStarted }) => {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [datasetId, setDatasetId] = useState<number | "">("");
  const [schedule, setSchedule] = useState("0 0 2 * * *");
  const [timeoutMinutes, setTimeoutMinutes] = useState(10);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDatasetId, setEditDatasetId] = useState<number | "">("");
  const [editSchedule, setEditSchedule] = useState("");
  const [editTimeoutMinutes, setEditTimeoutMinutes] = useState(10);
  const [editSaving, setEditSaving] = useState(false);

  const lastRunForPipeline = (pipelineId: number): JobRun | null =>
    jobRuns.find(r => r.pipelineId === pipelineId) ?? null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!datasetId) return;
    setSaving(true);
    setError(null);
    try {
      await createPipeline({ name, description, datasetId: Number(datasetId), schedule, active, timeoutMinutes });
      setName(""); setDescription(""); setDatasetId(""); setSchedule("0 0 2 * * *"); setTimeoutMinutes(10); setActive(true);
      setShowForm(false);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create pipeline");
    } finally {
      setSaving(false);
    }
  };

  const handleRun = async (id: number) => {
    setRunning(id);
    setError(null);
    try {
      await runPipeline(id);
      onRunStarted();
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run pipeline");
      setRunning(null);
    }
  };

  const isAnyRunning = jobRuns.some(r => r.status === "RUNNING" || r.status === "PENDING");

  useEffect(() => {
    if (isAnyRunning && running !== null) setRunning(null);
  }, [isAnyRunning, running]);

  const handleToggleActive = async (p: Pipeline) => {
    try {
      await setPipelineActive(p.id, !p.active);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update pipeline");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Smazat pipeline?")) return;
    try {
      await deletePipeline(id);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete pipeline");
    }
  };

  const startEdit = (p: Pipeline) => {
    setEditingPipeline(p);
    setEditName(p.name);
    setEditDescription(p.description ?? "");
    setEditDatasetId(p.datasetId);
    setEditSchedule(p.schedule ?? "");
    setEditTimeoutMinutes(p.timeoutMinutes);
    setError(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPipeline || !editDatasetId) return;
    setEditSaving(true);
    setError(null);
    try {
      await updatePipeline(editingPipeline.id, {
        name: editName, description: editDescription, datasetId: Number(editDatasetId),
        schedule: editSchedule, active: editingPipeline.active, timeoutMinutes: editTimeoutMinutes,
      });
      setEditingPipeline(null);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update pipeline");
    } finally {
      setEditSaving(false);
    }
  };

  const handleAlertModeChange = async (pipelineId: number, mode: AlertMode) => {
    try {
      await upsertAlertRule(pipelineId, mode);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update alert rule");
    }
  };

  const datasetName = (id: number) => datasets.find(d => d.id === id)?.name ?? `#${id}`;
  const alertModeForPipeline = (pipelineId: number): AlertMode =>
    alertRules.find(r => r.pipelineId === pipelineId)?.alertMode ?? "CONSECUTIVE_FAIL_EMAIL";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold uppercase tracking-widest text-[#ffd100]">Pipeline</h2>
        <button onClick={() => setShowForm(v => !v)}
          className="px-4 py-2 text-sm font-bold uppercase border border-[#ffd100] text-[#ffd100] bg-[#ffd100]/10 hover:bg-[#ffd100]/20 transition-colors">
          {showForm ? "✕ Zrušit" : "+ Nová pipeline"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#111111] border border-[#332211] p-5 rounded-md flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#888888] uppercase tracking-wider">Název *</label>
              <input value={name} onChange={e => setName(e.target.value)} required
                className="w-full mt-1 bg-black border border-[#554433] text-[#f0e0d0] px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#ffd100]" />
            </div>
            <div>
              <label className="text-xs text-[#888888] uppercase tracking-wider">Dataset *</label>
              <select value={datasetId} onChange={e => setDatasetId(Number(e.target.value))} required
                className="w-full mt-1 bg-black border border-[#554433] text-[#f0e0d0] px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#ffd100]">
                <option value="">— vyberte dataset —</option>
                {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#888888] uppercase tracking-wider">Popis</label>
              <input value={description} onChange={e => setDescription(e.target.value)}
                className="w-full mt-1 bg-black border border-[#554433] text-[#f0e0d0] px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#ffd100]" />
            </div>
            <div>
              <label className="text-xs text-[#888888] uppercase tracking-wider">Schedule (cron)</label>
              <input value={schedule} onChange={e => setSchedule(e.target.value)}
                className="w-full mt-1 bg-black border border-[#554433] text-[#f0e0d0] px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#ffd100]" />
            </div>
            <div>
              <label className="text-xs text-[#888888] uppercase tracking-wider">Timeout (minuty)</label>
              <input type="number" min={1} max={480} value={timeoutMinutes} onChange={e => setTimeoutMinutes(Number(e.target.value))}
                className="w-full mt-1 bg-black border border-[#554433] text-[#f0e0d0] px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#ffd100]" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-[#cccccc] cursor-pointer">
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="accent-yellow-400" />
            Aktivní
          </label>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={saving}
            className="self-start px-5 py-2 text-sm font-bold uppercase border border-[#ffd100] text-[#ffd100] bg-[#ffd100]/10 hover:bg-[#ffd100]/20 disabled:opacity-40 transition-colors">
            {saving ? "Ukládám…" : "Vytvořit"}
          </button>
        </form>
      )}

      {error && !showForm && <p className="text-red-400 text-sm">{error}</p>}

      {pipelines.length === 0 ? (
        <p className="text-[#888888] italic">Žádné pipeline.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {pipelines.map(p => {
            const last = lastRunForPipeline(p.id);
            const lastStatus = last?.status;
            return (
              <div
                key={p.id}
                className="bg-[#111111] border border-[#332211] rounded-md p-5 cursor-pointer hover:border-[#554433] transition-colors"
                onClick={() => setSelectedPipeline(p)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-0.5 border rounded ${p.active ? "border-green-700 text-green-400" : "border-[#554433] text-[#888888]"}`}>
                      {p.active ? "AKTIVNÍ" : "NEAKTIVNÍ"}
                    </span>
                    <h3 className="text-lg font-bold text-[#ffd100]">{p.name}</h3>
                    <span className="text-xs text-[#555555] hidden sm:inline">— klikněte pro detail</span>
                  </div>
                  <div className="flex gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleRun(p.id)} disabled={!p.active || isAnyRunning || running === p.id}
                      className="px-4 py-1.5 text-xs font-bold uppercase border border-[#ffd100] text-[#ffd100] bg-[#ffd100]/10 hover:bg-[#ffd100]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      {running === p.id ? "Spouštím…" : "▶ Spustit"}
                    </button>
                    <button onClick={() => handleToggleActive(p)}
                      className="px-4 py-1.5 text-xs font-bold uppercase border border-[#443322] text-[#888888] hover:border-[#ffd100]/50 hover:text-[#cccccc] transition-colors">
                      {p.active ? "Deaktivovat" : "Aktivovat"}
                    </button>
                    <button onClick={() => startEdit(p)}
                      className="px-4 py-1.5 text-xs font-bold uppercase border border-[#443322] text-[#888888] hover:border-[#ffd100]/50 hover:text-[#cccccc] transition-colors">
                      Upravit
                    </button>
                    <button onClick={() => handleDelete(p.id)}
                      className="px-4 py-1.5 text-xs font-bold uppercase border border-red-900 text-red-500 hover:text-red-300 transition-colors">
                      Smazat
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[#888888]">
                  <div><span className="uppercase tracking-wider block">Dataset</span><span className="text-[#cccccc]">{datasetName(p.datasetId)}</span></div>
                  <div><span className="uppercase tracking-wider block">Schedule</span><span className="text-[#cccccc]">{p.schedule ?? "—"}</span></div>
                  <div><span className="uppercase tracking-wider block">Poslední run</span><span className="text-[#cccccc]">{last ? new Date(last.startedAt).toLocaleString("cs-CZ") : "—"}</span></div>
                  <div><span className="uppercase tracking-wider block">Poslední status</span><span className={`font-bold ${STATUS_COLOR[lastStatus ?? ""] ?? "text-[#888888]"}`}>{lastStatus ?? "—"}</span></div>
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs text-[#888888]" onClick={e => e.stopPropagation()}>
                  <span className="uppercase tracking-wider shrink-0">Alert pravidlo</span>
                  <select
                    value={alertModeForPipeline(p.id)}
                    onChange={e => handleAlertModeChange(p.id, e.target.value as AlertMode)}
                    className="bg-black border border-[#443322] text-[#cccccc] px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#ffd100]"
                  >
                    {(Object.keys(ALERT_MODE_LABELS) as AlertMode[]).map(mode => (
                      <option key={mode} value={mode}>{ALERT_MODE_LABELS[mode]}</option>
                    ))}
                  </select>
                </div>
                {p.description && <p className="mt-2 text-xs text-[#666666] italic">{p.description}</p>}

                {editingPipeline?.id === p.id && (
                  <form onSubmit={handleUpdate} onClick={e => e.stopPropagation()}
                    className="mt-4 border-t border-[#332211] pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[#888888] uppercase tracking-wider">Název *</label>
                      <input value={editName} onChange={e => setEditName(e.target.value)} required
                        className="w-full mt-1 bg-black border border-[#554433] text-[#f0e0d0] px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#ffd100]" />
                    </div>
                    <div>
                      <label className="text-xs text-[#888888] uppercase tracking-wider">Dataset *</label>
                      <select value={editDatasetId} onChange={e => setEditDatasetId(Number(e.target.value))} required
                        className="w-full mt-1 bg-black border border-[#554433] text-[#f0e0d0] px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#ffd100]">
                        {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-[#888888] uppercase tracking-wider">Popis</label>
                      <input value={editDescription} onChange={e => setEditDescription(e.target.value)}
                        className="w-full mt-1 bg-black border border-[#554433] text-[#f0e0d0] px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#ffd100]" />
                    </div>
                    <div>
                      <label className="text-xs text-[#888888] uppercase tracking-wider">Schedule (cron)</label>
                      <input value={editSchedule} onChange={e => setEditSchedule(e.target.value)}
                        className="w-full mt-1 bg-black border border-[#554433] text-[#f0e0d0] px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#ffd100]" />
                    </div>
                    <div>
                      <label className="text-xs text-[#888888] uppercase tracking-wider">Timeout (minuty)</label>
                      <input type="number" min={1} max={480} value={editTimeoutMinutes} onChange={e => setEditTimeoutMinutes(Number(e.target.value))}
                        className="w-full mt-1 bg-black border border-[#554433] text-[#f0e0d0] px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#ffd100]" />
                    </div>
                    <div className="sm:col-span-2 flex gap-3">
                      <button type="submit" disabled={editSaving}
                        className="px-5 py-2 text-xs font-bold uppercase border border-[#ffd100] text-[#ffd100] bg-[#ffd100]/10 hover:bg-[#ffd100]/20 disabled:opacity-40 transition-colors">
                        {editSaving ? "Ukládám…" : "Uložit"}
                      </button>
                      <button type="button" onClick={() => setEditingPipeline(null)}
                        className="px-5 py-2 text-xs font-bold uppercase border border-[#443322] text-[#888888] hover:text-[#cccccc] transition-colors">
                        Zrušit
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedPipeline && (
        <PipelineDetailModal
          pipeline={selectedPipeline}
          datasets={datasets}
          jobRuns={jobRuns}
          alerts={alerts}
          alertRules={alertRules}
          onClose={() => setSelectedPipeline(null)}
          onRun={handleRun}
          running={running === selectedPipeline.id}
        />
      )}
    </div>
  );
};

export default PipelineList;
