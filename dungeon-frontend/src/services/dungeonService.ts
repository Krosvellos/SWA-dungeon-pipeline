import { DungeonDashboardResponse, DungeonRawStats, JobRun, JobRunStep, Dataset, Pipeline, AlertEvent, AlertRule, AlertMode } from "@/types/dashboard";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function fetchDashboard(date: string): Promise<DungeonDashboardResponse> {
  const response = await fetch(`${BASE_URL}/api/dungeon/dashboard?date=${date}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchAllStats(): Promise<DungeonRawStats[]> {
  const response = await fetch(`${BASE_URL}/api/dungeon/stats`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error(`Failed to fetch stats: ${response.statusText}`);
  return response.json();
}

export async function fetchJobRuns(): Promise<JobRun[]> {
  const response = await fetch(`${BASE_URL}/api/dungeon/job-runs`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error(`Failed to fetch job runs: ${response.statusText}`);
  return response.json();
}

export async function triggerAggregation(): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/dungeon/aggregate`, { method: "POST" });
  if (!response.ok) throw new Error(`Failed to trigger aggregation: ${response.statusText}`);
}

export async function triggerTestFail(): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/dungeon/aggregate/test-fail`, { method: "POST" });
  if (!response.ok) throw new Error(`Failed to trigger test failure: ${response.statusText}`);
}

// Datasets
export async function fetchDatasets(): Promise<Dataset[]> {
  const r = await fetch(`${BASE_URL}/api/datasets`);
  if (!r.ok) throw new Error(`Failed to fetch datasets: ${r.statusText}`);
  return r.json();
}

export async function createDataset(body: { name: string; description?: string; owner: string; schemaVersion?: string }): Promise<Dataset> {
  const r = await fetch(`${BASE_URL}/api/datasets`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`Failed to create dataset: ${r.statusText}`);
  return r.json();
}

export async function deleteDataset(id: number): Promise<void> {
  const r = await fetch(`${BASE_URL}/api/datasets/${id}`, { method: "DELETE" });
  if (!r.ok) throw new Error(`Failed to delete dataset: ${r.statusText}`);
}

// Pipelines
export async function fetchPipelines(): Promise<Pipeline[]> {
  const r = await fetch(`${BASE_URL}/api/pipelines`);
  if (!r.ok) throw new Error(`Failed to fetch pipelines: ${r.statusText}`);
  return r.json();
}

export async function createPipeline(body: { name: string; description?: string; datasetId: number; schedule?: string; active?: boolean; timeoutMinutes?: number }): Promise<Pipeline> {
  const r = await fetch(`${BASE_URL}/api/pipelines`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`Failed to create pipeline: ${r.statusText}`);
  return r.json();
}

export async function updatePipeline(id: number, body: { name: string; description?: string; datasetId: number; schedule?: string; active?: boolean; timeoutMinutes?: number }): Promise<Pipeline> {
  const r = await fetch(`${BASE_URL}/api/pipelines/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`Failed to update pipeline: ${r.statusText}`);
  return r.json();
}

export async function runPipeline(id: number): Promise<void> {
  const r = await fetch(`${BASE_URL}/api/pipelines/${id}/run`, { method: "POST" });
  if (!r.ok) throw new Error(`Failed to run pipeline: ${r.statusText}`);
}

export async function setPipelineActive(id: number, active: boolean): Promise<Pipeline> {
  const r = await fetch(`${BASE_URL}/api/pipelines/${id}/active`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active }) });
  if (!r.ok) throw new Error(`Failed to update pipeline: ${r.statusText}`);
  return r.json();
}

export async function deletePipeline(id: number): Promise<void> {
  const r = await fetch(`${BASE_URL}/api/pipelines/${id}`, { method: "DELETE" });
  if (!r.ok) throw new Error(`Failed to delete pipeline: ${r.statusText}`);
}

// Alerts
export async function fetchAlerts(): Promise<AlertEvent[]> {
  const r = await fetch(`${BASE_URL}/api/alerts`);
  if (!r.ok) throw new Error(`Failed to fetch alerts: ${r.statusText}`);
  return r.json();
}

export async function resolveAlert(id: number): Promise<AlertEvent> {
  const r = await fetch(`${BASE_URL}/api/alerts/${id}/resolve`, { method: "PATCH" });
  if (!r.ok) throw new Error(`Failed to resolve alert: ${r.statusText}`);
  return r.json();
}

// Alert Rules
export async function fetchAlertRules(): Promise<AlertRule[]> {
  const r = await fetch(`${BASE_URL}/api/alert-rules`);
  if (!r.ok) throw new Error(`Failed to fetch alert rules: ${r.statusText}`);
  return r.json();
}

export async function upsertAlertRule(pipelineId: number, alertMode: AlertMode): Promise<AlertRule> {
  const r = await fetch(`${BASE_URL}/api/alert-rules/pipeline/${pipelineId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ alertMode }),
  });
  if (!r.ok) throw new Error(`Failed to save alert rule: ${r.statusText}`);
  return r.json();
}

// JobRun endpoints
export async function fetchJobRunById(id: number): Promise<JobRun> {
  const r = await fetch(`${BASE_URL}/api/runs/${id}`);
  if (!r.ok) throw new Error(`Failed to fetch job run: ${r.statusText}`);
  return r.json();
}

export async function fetchJobRunSteps(id: number): Promise<JobRunStep[]> {
  const r = await fetch(`${BASE_URL}/api/runs/${id}/steps`);
  if (!r.ok) throw new Error(`Failed to fetch job run steps: ${r.statusText}`);
  return r.json();
}

export async function patchJobRun(id: number, status: "FAILED" | "SUCCESS"): Promise<JobRun> {
  const r = await fetch(`${BASE_URL}/api/runs/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!r.ok) throw new Error(`Failed to update job run: ${r.statusText}`);
  return r.json();
}
