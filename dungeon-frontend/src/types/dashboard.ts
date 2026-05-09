export const CLASS_COLORS: Record<string, string> = {
  Warrior: "#C79C6E",
  Paladin: "#F58CBA",
  Hunter: "#ABD473",
  Rogue: "#FFF569",
  Priest: "#FFFFFF",
  DeathKnight: "#C41F3B",
  Shaman: "#0070DE",
  Mage: "#69CCF0",
  Warlock: "#9482C9",
  Monk: "#00FF96",
  Druid: "#FF7D0A",
  DemonHunter: "#A330C9",
  Evoker: "#33937F",
};

export const CLASS_ICONS: Record<string, string> = {
  Warrior: "https://render.worldofwarcraft.com/us/icons/56/classicon_warrior.jpg",
  Paladin: "https://render.worldofwarcraft.com/us/icons/56/classicon_paladin.jpg",
  Hunter: "https://render.worldofwarcraft.com/us/icons/56/classicon_hunter.jpg",
  Rogue: "https://render.worldofwarcraft.com/us/icons/56/classicon_rogue.jpg",
  Priest: "https://render.worldofwarcraft.com/us/icons/56/classicon_priest.jpg",
  DeathKnight: "https://render.worldofwarcraft.com/us/icons/56/classicon_deathknight.jpg",
  Shaman: "https://render.worldofwarcraft.com/us/icons/56/classicon_shaman.jpg",
  Mage: "https://render.worldofwarcraft.com/us/icons/56/classicon_mage.jpg",
  Warlock: "https://render.worldofwarcraft.com/us/icons/56/classicon_warlock.jpg",
  Monk: "https://render.worldofwarcraft.com/us/icons/56/classicon_monk.jpg",
  Druid: "https://render.worldofwarcraft.com/us/icons/56/classicon_druid.jpg",
  DemonHunter: "https://render.worldofwarcraft.com/us/icons/56/classicon_demonhunter.jpg",
  Evoker: "https://render.worldofwarcraft.com/us/icons/56/classicon_evoker.jpg",
};

export interface DungeonOverallStats {
  averageTime: number;
  averageDeaths: number;
  averageItemLevel: number;
  successRate: number;
}

export interface DungeonClassStats {
  runCount: number;
  averageTime: number;
  averageDeaths: number;
  averageItemLevel: number;
  successRate: number;
}

export interface DungeonPeriodStats {
  totalRuns: number;
  overall: DungeonOverallStats;
  byClass: Record<string, DungeonClassStats>;
}

export interface DungeonDashboardResponse {
  date: string;
  yearly: Record<string, DungeonPeriodStats>;
  monthly: Record<string, DungeonPeriodStats>;
  weekly: Record<string, DungeonPeriodStats>;
}

export interface JobRun {
  id: number;
  status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";
  startedAt: string;
  finishedAt: string | null;
  durationSeconds: number | null;
  recordsProcessed: number | null;
  errorMessage: string | null;
  pipelineId: number | null;
}

export interface DungeonRawStats {
  id: number;
  dungeonName: string;
  playerClass: string;
  date: string;
  totalRuns: number;
  totalTime: number;
  totalDeaths: number;
  totalItemLevel: number;
  successCount: number;
  lastUpdated: string;
}

export interface Dataset {
  id: number;
  name: string;
  description: string | null;
  owner: string;
  schemaVersion: string | null;
  createdAt: string;
}

export interface Pipeline {
  id: number;
  name: string;
  description: string | null;
  datasetId: number;
  schedule: string | null;
  active: boolean;
  timeoutMinutes: number;
  createdAt: string;
}

export interface AlertEvent {
  id: number;
  pipelineId: number | null;
  jobRunId: number | null;
  message: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  status: "OPEN" | "RESOLVED";
  createdAt: string;
}

export type AlertMode = "CONSECUTIVE_FAIL_EMAIL" | "NO_ALERTS" | "EXCLUDE_TIMEOUT_FAILURES";

export interface AlertRule {
  id: number;
  pipelineId: number;
  alertMode: AlertMode;
}

export interface JobRunStep {
  id: number;
  jobRunId: number;
  stepName: string;
  status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";
  startedAt: string;
  finishedAt: string | null;
  recordsProcessed: number | null;
  errorMessage: string | null;
}
