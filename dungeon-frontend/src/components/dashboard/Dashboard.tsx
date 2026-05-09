"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import {
  fetchDashboard, fetchAllStats, fetchJobRuns, triggerAggregation, triggerTestFail,
  fetchDatasets, fetchPipelines, fetchAlerts, fetchAlertRules, fetchJobRunSteps,
} from "@/services/dungeonService";
import {
  DungeonDashboardResponse, DungeonPeriodStats, DungeonRawStats,
  JobRun, JobRunStep, CLASS_COLORS, CLASS_ICONS, Dataset, Pipeline, AlertEvent, AlertRule,
} from "@/types/dashboard";
import PerformanceGraph from "./PerformanceGraph";
import OverviewDashboard from "./OverviewDashboard";
import DatasetList from "./DatasetList";
import PipelineList from "./PipelineList";
import AlertList from "./AlertList";

type Tab = "overview" | "pipelines" | "datasets" | "alerts" | "runs" | "stats";

const TAB_LABELS: Record<Tab, string> = {
  overview: "Přehled",
  pipelines: "Pipeline",
  datasets: "Datasety",
  alerts: "Alerty",
  runs: "Běhy",
  stats: "Statistiky",
};

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Dungeon stats state
  const [data, setData] = useState<DungeonDashboardResponse | null>(null);
  const [allStats, setAllStats] = useState<DungeonRawStats[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedDungeon, setSelectedDungeon] = useState<string>("");

  // Pipeline monitor state
  const [jobRuns, setJobRuns] = useState<JobRun[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [aggregating, setAggregating] = useState<boolean>(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current !== null) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const [runs, newAlerts] = await Promise.all([fetchJobRuns(), fetchAlerts()]);
        setJobRuns(runs);
        setAlerts(newAlerts);
        if (!runs.some((r: JobRun) => r.status === "RUNNING")) stopPolling();
      } catch { stopPolling(); }
    }, 3000);
    setTimeout(stopPolling, 180_000);
  }, [stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  // Load all monitor data; returns the fresh job runs so callers can act on them
  const loadMonitorData = useCallback(async (): Promise<JobRun[]> => {
    try {
      const [runs, ds, pl, al, ar] = await Promise.all([
        fetchJobRuns(), fetchDatasets(), fetchPipelines(), fetchAlerts(), fetchAlertRules(),
      ]);
      setJobRuns(runs);
      setDatasets(ds);
      setPipelines(pl);
      setAlerts(al);
      setAlertRules(ar);
      return runs;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
      return [];
    }
  }, []);

  // Load dungeon stats
  useEffect(() => {
    if (activeTab !== "stats") return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [dashResult, statsResult] = await Promise.all([fetchDashboard(selectedDate), fetchAllStats()]);
        setData(dashResult);
        setAllStats(statsResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedDate, activeTab]);

  // Initial load
  useEffect(() => { loadMonitorData(); }, [loadMonitorData]);

  // Re-fetch monitor data on every tab switch to a monitor-related tab,
  // and resume polling if a run is still in progress.
  useEffect(() => {
    const monitorTabs: Tab[] = ["overview", "pipelines", "datasets", "alerts", "runs"];
    if (!monitorTabs.includes(activeTab)) return;
    loadMonitorData().then(runs => {
      if (runs.some(r => r.status === "RUNNING" || r.status === "PENDING")) {
        startPolling();
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleRunPipeline = async () => {
    setAggregating(true);
    try {
      await triggerAggregation();
      setJobRuns(await fetchJobRuns());
      startPolling();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Aggregation failed");
    } finally { setAggregating(false); }
  };

  const handleTestFail = async () => {
    setAggregating(true);
    try {
      await triggerTestFail();
      setJobRuns(await fetchJobRuns());
      startPolling();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test run failed to start");
    } finally { setAggregating(false); }
  };

  const handleContainerClick = () => {
    try {
      const input = document.getElementById("date") as HTMLInputElement;
      if (input && typeof (input as any).showPicker === "function") (input as any).showPicker();
      else input?.focus();
    } catch { /* ignore */ }
  };

  const openAlertCount = alerts.filter(a => a.status === "OPEN").length;
  const isRunning = aggregating || jobRuns.some(r => r.status === "RUNNING" || r.status === "PENDING");

  return (
    <div className="flex flex-col gap-0 w-full max-w-6xl mx-auto bg-[#0a0a0a] text-[#ffd100] font-serif border-4 border-[#332211] shadow-2xl">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 border-b-2 border-[#332211] p-4 md:p-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-[#ffd100] drop-shadow-lg" style={{ textShadow: "2px 2px 4px #000" }}>
            Dungeon Dashboard
          </h1>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wow-logo.svg" alt="WoW" className="w-10 h-10 opacity-90" />
        </div>
        {activeTab === "stats" && (
          <div className="flex items-center gap-3 bg-[#1a1a1a] p-3 border border-[#443322] rounded-md cursor-pointer hover:bg-[#222222] transition-colors"
            onClick={handleContainerClick}>
            <label htmlFor="date" className="text-sm font-bold text-[#f0e0d0] uppercase tracking-wider cursor-pointer">Target Date:</label>
            <input type="date" id="date" value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              onClick={e => e.stopPropagation()}
              className="bg-black border border-[#554433] text-[#f0e0d0] px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#ffd100] rounded-sm cursor-pointer appearance-none" />
          </div>
        )}
      </header>

      {/* Tab bar */}
      <div className="flex gap-0 border-b-2 border-[#332211] overflow-x-auto">
        {(Object.keys(TAB_LABELS) as Tab[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`relative px-5 py-3 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 -mb-[2px] ${
              activeTab === tab ? "border-[#ffd100] text-[#ffd100]" : "border-transparent text-[#666666] hover:text-[#aaaaaa]"
            }`}>
            {TAB_LABELS[tab]}
            {tab === "alerts" && openAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {openAlertCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4 md:p-8">
        {error && <div className="mb-4 p-3 text-red-400 border border-red-900 bg-red-900/10 rounded text-sm">{error}</div>}

        {activeTab === "overview" && (
          <OverviewDashboard datasets={datasets} pipelines={pipelines} jobRuns={jobRuns} alerts={alerts} />
        )}

        {activeTab === "pipelines" && (
          <div className="flex flex-col gap-8">
            <PipelineList
              pipelines={pipelines}
              datasets={datasets}
              jobRuns={jobRuns}
              alerts={alerts}
              alertRules={alertRules}
              onRefresh={loadMonitorData}
              onRunStarted={startPolling}
            />
            <div className="border-t border-[#332211] pt-6">
              <PipelineStatusSection runs={jobRuns} onRun={handleRunPipeline} onTestFail={handleTestFail} running={isRunning} />
            </div>
          </div>
        )}

        {activeTab === "datasets" && (
          <DatasetList datasets={datasets} onRefresh={loadMonitorData} />
        )}

        {activeTab === "alerts" && (
          <AlertList alerts={alerts} pipelines={pipelines} onRefresh={loadMonitorData} />
        )}

        {activeTab === "runs" && (
          <RunsSection runs={jobRuns} pipelines={pipelines} />
        )}

        {activeTab === "stats" && (
          <>
            {loading && <div className="p-8 text-center text-yellow-600 animate-pulse">Loading data for {selectedDate}…</div>}
            {!loading && !error && data && (() => {
              const dungeonNames =
                Object.keys(data.weekly).length > 0 ? Object.keys(data.weekly) :
                Object.keys(data.monthly).length > 0 ? Object.keys(data.monthly) :
                Object.keys(data.yearly);
              const activeDungeon = selectedDungeon && dungeonNames.includes(selectedDungeon)
                ? selectedDungeon : dungeonNames[0] ?? "";
              return (
                <>
                  <div className="flex flex-wrap gap-2 border-b border-[#332211] pb-4 mb-6">
                    {dungeonNames.map(name => (
                      <button key={name} onClick={() => setSelectedDungeon(name)}
                        className={`px-4 py-1.5 text-sm font-bold uppercase tracking-wider border transition-colors ${
                          name === activeDungeon
                            ? "border-[#ffd100] bg-[#ffd100]/10 text-[#ffd100]"
                            : "border-[#443322] text-[#888888] hover:border-[#ffd100]/50 hover:text-[#cccccc]"
                        }`}>
                        {name}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <StatsSection title="Weekly Summary" stats={data.weekly[activeDungeon]} />
                    <StatsSection title="Monthly Summary" stats={data.monthly[activeDungeon]} />
                    <StatsSection title="Yearly Summary" stats={data.yearly[activeDungeon]} />
                  </div>
                  <ClassBreakdownSection data={data} dungeon={activeDungeon} />
                  <PerformanceGraph stats={allStats} />
                </>
              );
            })()}
            {!loading && !error && !data && (
              <p className="p-8 text-center text-[#888888] italic">No data available for the selected date.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─── Runs tab ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { text: string; label: string }> = {
  PENDING: { text: "text-gray-400",   label: "PENDING" },
  RUNNING: { text: "text-yellow-400", label: "RUNNING" },
  SUCCESS: { text: "text-green-400",  label: "SUCCESS" },
  FAILED:  { text: "text-red-400",    label: "FAILED"  },
};

const INPUT_CLS = "bg-black border border-[#443322] text-[#cccccc] px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#ffd100]";

const STEP_COLORS: Record<string, string> = {
  PENDING: "text-gray-400",
  RUNNING: "text-yellow-400",
  SUCCESS: "text-green-400",
  FAILED:  "text-red-400",
};

const StepRows: React.FC<{ runId: number }> = ({ runId }) => {
  const [steps, setSteps] = useState<JobRunStep[] | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    fetchJobRunSteps(runId)
      .then(setSteps)
      .catch(() => setErr(true));
  }, [runId]);

  if (err) return (
    <tr><td colSpan={8} className="py-2 pl-10 text-xs text-red-400 italic">Nepodařilo se načíst kroky.</td></tr>
  );
  if (!steps) return (
    <tr><td colSpan={8} className="py-2 pl-10 text-xs text-[#555555] animate-pulse">Načítám kroky…</td></tr>
  );
  if (steps.length === 0) return (
    <tr><td colSpan={8} className="py-2 pl-10 text-xs text-[#555555] italic">Žádné kroky (běh byl příliš krátký nebo nebyl zaznamenán).</td></tr>
  );

  return (
    <>
      {steps.map(step => {
        const dur = step.startedAt && step.finishedAt
          ? Math.round((new Date(step.finishedAt).getTime() - new Date(step.startedAt).getTime()) / 1000)
          : null;
        return (
          <tr key={step.id} className="bg-[#0d0d0d] border-b border-[#1a1a1a]">
            <td className="py-1 pl-10 pr-2 text-[#555555] text-xs">↳</td>
            <td colSpan={2} className="py-1 pr-4 text-xs">
              <span className="font-mono text-[#aaaaaa] tracking-wider">{step.stepName}</span>
            </td>
            <td className={`py-1 pr-4 text-xs font-bold ${STEP_COLORS[step.status] ?? ""}`}>{step.status}</td>
            <td className="py-1 pr-4 text-xs text-[#888888]">{new Date(step.startedAt).toLocaleTimeString("cs-CZ")}</td>
            <td className="py-1 pr-4 text-xs text-[#888888]">{dur != null ? `${dur}s` : "—"}</td>
            <td className="py-1 pr-4 text-xs text-[#888888]">{step.recordsProcessed ?? "—"}</td>
            <td className="py-1 text-xs text-red-400 truncate max-w-xs">{step.errorMessage ?? "—"}</td>
          </tr>
        );
      })}
    </>
  );
};

const RunsSection: React.FC<{ runs: JobRun[]; pipelines: Pipeline[] }> = ({ runs, pipelines }) => {
  const [filterPipeline, setFilterPipeline] = useState<number | "">("");
  const [filterStatus, setFilterStatus]     = useState<string>("");
  const [filterFrom, setFilterFrom]         = useState<string>("");
  const [filterTo, setFilterTo]             = useState<string>("");
  const [expandedRunId, setExpandedRunId]   = useState<number | null>(null);

  const pipelineName = (id: number | null) =>
    id != null ? (pipelines.find(p => p.id === id)?.name ?? `#${id}`) : "—";

  const filtered = runs.filter(r => {
    if (filterPipeline !== "" && r.pipelineId !== filterPipeline) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterFrom && r.startedAt.slice(0, 10) < filterFrom) return false;
    if (filterTo   && r.startedAt.slice(0, 10) > filterTo)   return false;
    return true;
  });

  const hasFilters = filterPipeline !== "" || filterStatus || filterFrom || filterTo;

  const toggleExpand = (id: number) =>
    setExpandedRunId(prev => prev === id ? null : id);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold uppercase tracking-widest text-[#ffd100]">Všechny běhy</h2>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-[#666666] uppercase tracking-wider">Pipeline</label>
          <select value={filterPipeline} onChange={e => setFilterPipeline(e.target.value ? Number(e.target.value) : "")} className={INPUT_CLS}>
            <option value="">Všechny</option>
            {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-[#666666] uppercase tracking-wider">Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={INPUT_CLS}>
            <option value="">Všechny</option>
            <option value="PENDING">PENDING</option>
            <option value="RUNNING">RUNNING</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-[#666666] uppercase tracking-wider">Od</label>
          <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className={INPUT_CLS} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-[#666666] uppercase tracking-wider">Do</label>
          <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className={INPUT_CLS} />
        </div>
        {hasFilters && (
          <button onClick={() => { setFilterPipeline(""); setFilterStatus(""); setFilterFrom(""); setFilterTo(""); }}
            className="text-xs text-[#888888] hover:text-[#ffd100] border border-[#443322] px-3 py-1.5 transition-colors self-end">
            ✕ Vymazat
          </button>
        )}
        <span className="text-xs text-[#555555] self-end ml-auto">
          {filtered.length} / {runs.length} běhů
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-[#888888] italic">{runs.length === 0 ? "Žádné běhy zatím neproběhly." : "Žádné běhy odpovídají filtrům."}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-[#332211] text-[#888888] uppercase text-xs tracking-wider">
                <th className="pb-2 pr-2 w-6"></th>
                <th className="pb-2 pr-4">ID</th>
                <th className="pb-2 pr-4">Pipeline</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Spuštění</th>
                <th className="pb-2 pr-4">Trvání</th>
                <th className="pb-2 pr-4">Záznamy</th>
                <th className="pb-2">Chyba</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(run => {
                const s = STATUS_STYLES[run.status] ?? STATUS_STYLES.RUNNING;
                const isExpanded = expandedRunId === run.id;
                return (
                  <React.Fragment key={run.id}>
                    <tr
                      className="border-b border-[#1e1e1e] hover:bg-[#1a1a1a] cursor-pointer select-none"
                      onClick={() => toggleExpand(run.id)}
                    >
                      <td className="py-2 pr-2 text-[#555555] text-xs">{isExpanded ? "▼" : "▶"}</td>
                      <td className="py-2 pr-4 text-[#888888]">#{run.id}</td>
                      <td className="py-2 pr-4 text-[#cccccc]">{pipelineName(run.pipelineId)}</td>
                      <td className={`py-2 pr-4 font-bold ${s.text}`}>{s.label}</td>
                      <td className="py-2 pr-4 text-[#cccccc]">{new Date(run.startedAt).toLocaleString("cs-CZ")}</td>
                      <td className="py-2 pr-4 text-[#cccccc]">{run.durationSeconds != null ? `${run.durationSeconds}s` : "—"}</td>
                      <td className="py-2 pr-4 text-[#cccccc]">{run.recordsProcessed ?? "—"}</td>
                      <td className="py-2 text-red-400 truncate max-w-xs">{run.errorMessage ?? "—"}</td>
                    </tr>
                    {isExpanded && <StepRows runId={run.id} />}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Pipeline status (manual trigger section) ────────────────────────────────

const PipelineStatusSection: React.FC<{ runs: JobRun[]; onRun: () => void; onTestFail: () => void; running: boolean }> = ({ runs, onRun, onTestFail, running }) => {
  const lastRun = runs[0] ?? null;
  const consecutiveFail = runs.length >= 2 && runs[0].status === "FAILED" && runs[1].status === "FAILED";
  const style = lastRun ? (STATUS_STYLES[lastRun.status] ?? STATUS_STYLES.RUNNING) : null;

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h3 className="text-lg font-bold uppercase tracking-widest text-[#ffd100]">Ruční spuštění</h3>
        <div className="flex gap-3 flex-wrap">
          <button onClick={onRun} disabled={running}
            className="px-5 py-2 text-sm font-bold uppercase tracking-wider border border-[#ffd100] text-[#ffd100] bg-[#ffd100]/10 hover:bg-[#ffd100]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {running ? "Probíhá…" : "▶ Spustit agregaci"}
          </button>
          <button onClick={onTestFail} disabled={running}
            className="px-5 py-2 text-sm font-bold uppercase tracking-wider border border-orange-600 text-orange-400 bg-orange-900/10 hover:bg-orange-900/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            ⚠ Test selhání
          </button>
        </div>
      </div>
      {consecutiveFail && (
        <div className="mb-4 p-3 border border-red-700 bg-red-900/20 text-red-400 text-sm font-bold uppercase tracking-wider">
          ⚠ Pipeline selhala dvakrát za sebou — upozornění bylo odesláno e-mailem
        </div>
      )}
      {lastRun && style && (
        <div className={`p-3 border rounded flex flex-wrap gap-6 text-sm ${lastRun.status === "SUCCESS" ? "bg-green-900/20 border-green-700" : lastRun.status === "FAILED" ? "bg-red-900/20 border-red-700" : "bg-yellow-900/20 border-yellow-700"}`}>
          <span className={`font-bold uppercase ${style.text}`}>{style.label}</span>
          <span className="text-[#cccccc]">Start: {new Date(lastRun.startedAt).toLocaleString("cs-CZ")}</span>
          {lastRun.finishedAt && <span className="text-[#cccccc]">Konec: {new Date(lastRun.finishedAt).toLocaleString("cs-CZ")}</span>}
          {lastRun.durationSeconds != null && <span className="text-[#cccccc]">Trvání: {lastRun.durationSeconds}s</span>}
          {lastRun.recordsProcessed != null && <span className="text-[#cccccc]">Zpracováno: {lastRun.recordsProcessed} záznamů</span>}
          {lastRun.errorMessage && <span className="text-red-400">Chyba: {lastRun.errorMessage}</span>}
        </div>
      )}
    </section>
  );
};

// ─── Stats tab sub-components ────────────────────────────────────────────────

const StatsSection: React.FC<{ title: string; stats?: DungeonPeriodStats }> = ({ title, stats }) => {
  if (!stats) return (
    <div className="p-6 rounded-md border-2 border-[#332211] bg-[#1a1a1a] shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-[#ffd100] border-b border-[#332211] pb-2 uppercase tracking-widest">{title}</h2>
      <p className="text-[#888888] italic">No data available</p>
    </div>
  );
  return (
    <div className="p-6 rounded-md border-2 border-[#332211] bg-[#1a1a1a] shadow-lg relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1 h-full bg-[#ffd100] opacity-30 group-hover:opacity-100 transition-opacity"></div>
      <h2 className="text-xl font-bold mb-4 text-[#ffd100] border-b border-[#332211] pb-2 uppercase tracking-widest drop-shadow">{title}</h2>
      <div className="space-y-4">
        <StatRow label="Total Runs" value={stats.totalRuns} />
        <StatRow label="Win Rate" value={`${stats.overall.successRate.toFixed(1)}%`} />
        <StatRow label="Avg Deaths" value={stats.overall.averageDeaths.toFixed(2)} color="#ff4444" />
        <StatRow label="Avg Time" value={`${stats.overall.averageTime.toFixed(1)} min`} />
        <StatRow label="Avg Item Lvl" value={stats.overall.averageItemLevel.toFixed(1)} color="#a335ee" />
      </div>
    </div>
  );
};

const StatRow: React.FC<{ label: string; value: string | number; color?: string }> = ({ label, value, color }) => (
  <div className="flex justify-between items-center text-sm border-b border-[#2a2a2a] pb-1">
    <span className="text-[#cccccc] font-medium uppercase text-xs tracking-tighter">{label}</span>
    <span className="font-bold text-base" style={{ color: color || "#f0e0d0" }}>{value}</span>
  </div>
);

const ClassBreakdownSection: React.FC<{ data: DungeonDashboardResponse; dungeon: string }> = ({ data, dungeon }) => {
  const weeklyStats = data.weekly[dungeon];
  if (!weeklyStats || !weeklyStats.byClass || Object.keys(weeklyStats.byClass).length === 0) return null;
  return (
    <section className="mt-8 border-t-2 border-[#332211] pt-8">
      <h2 className="text-3xl font-bold mb-8 text-[#ffd100] uppercase tracking-widest text-center" style={{ textShadow: "1px 1px 2px #000" }}>Class Performance</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(weeklyStats.byClass).map(([className, stats]) => (
          <div key={className} className="p-5 rounded border-2 border-[#332211] bg-[#111111] hover:bg-[#1a1a1a] transition-colors shadow-md">
            <div className="flex items-center gap-4 mb-4 border-b border-[#222222] pb-3">
              <div className="relative w-12 h-12 border border-[#443322] shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={CLASS_ICONS[className] || "/icons/default.png"} alt={className}
                  className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all" />
              </div>
              <h3 className="text-xl font-bold tracking-wide" style={{ color: CLASS_COLORS[className] || "#ffffff", textShadow: "1px 1px 1px #000" }}>
                {className}
              </h3>
            </div>
            <div className="space-y-3">
              <StatRow label="Runs" value={stats.runCount} />
              <StatRow label="Win Rate" value={`${stats.successRate.toFixed(1)}%`} color={stats.successRate > 90 ? "#1eff00" : stats.successRate > 75 ? "#f0e0d0" : "#ff4444"} />
              <StatRow label="Avg Time" value={`${stats.averageTime.toFixed(1)}m`} />
              <StatRow label="Avg Deaths" value={stats.averageDeaths.toFixed(1)} color="#ff4444" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Dashboard;
