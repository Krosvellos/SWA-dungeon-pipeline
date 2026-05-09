package org.example.dungeonbackend.dto;

import java.util.Map;

public class DungeonDashboardResponse {
    private String date;
    private Map<String, DungeonPeriodStats> yearly;
    private Map<String, DungeonPeriodStats> monthly;
    private Map<String, DungeonPeriodStats> weekly;

    public DungeonDashboardResponse() {}

    public DungeonDashboardResponse(String date, Map<String, DungeonPeriodStats> yearly,
                                    Map<String, DungeonPeriodStats> monthly, Map<String, DungeonPeriodStats> weekly) {
        this.date = date;
        this.yearly = yearly;
        this.monthly = monthly;
        this.weekly = weekly;
    }

    public static Builder builder() { return new Builder(); }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public Map<String, DungeonPeriodStats> getYearly() { return yearly; }
    public void setYearly(Map<String, DungeonPeriodStats> yearly) { this.yearly = yearly; }
    public Map<String, DungeonPeriodStats> getMonthly() { return monthly; }
    public void setMonthly(Map<String, DungeonPeriodStats> monthly) { this.monthly = monthly; }
    public Map<String, DungeonPeriodStats> getWeekly() { return weekly; }
    public void setWeekly(Map<String, DungeonPeriodStats> weekly) { this.weekly = weekly; }

    public static class Builder {
        private String date;
        private Map<String, DungeonPeriodStats> yearly;
        private Map<String, DungeonPeriodStats> monthly;
        private Map<String, DungeonPeriodStats> weekly;

        public Builder date(String date) { this.date = date; return this; }
        public Builder yearly(Map<String, DungeonPeriodStats> yearly) { this.yearly = yearly; return this; }
        public Builder monthly(Map<String, DungeonPeriodStats> monthly) { this.monthly = monthly; return this; }
        public Builder weekly(Map<String, DungeonPeriodStats> weekly) { this.weekly = weekly; return this; }
        public DungeonDashboardResponse build() {
            return new DungeonDashboardResponse(date, yearly, monthly, weekly);
        }
    }

    // -------------------------------------------------------------------------

    public static class DungeonPeriodStats {
        private long totalRuns;
        private DungeonOverallStats overall;
        private Map<String, DungeonClassStats> byClass;

        public DungeonPeriodStats() {}

        public DungeonPeriodStats(long totalRuns, DungeonOverallStats overall, Map<String, DungeonClassStats> byClass) {
            this.totalRuns = totalRuns;
            this.overall = overall;
            this.byClass = byClass;
        }

        public static Builder builder() { return new Builder(); }

        public long getTotalRuns() { return totalRuns; }
        public void setTotalRuns(long totalRuns) { this.totalRuns = totalRuns; }
        public DungeonOverallStats getOverall() { return overall; }
        public void setOverall(DungeonOverallStats overall) { this.overall = overall; }
        public Map<String, DungeonClassStats> getByClass() { return byClass; }
        public void setByClass(Map<String, DungeonClassStats> byClass) { this.byClass = byClass; }

        public static class Builder {
            private long totalRuns;
            private DungeonOverallStats overall;
            private Map<String, DungeonClassStats> byClass;

            public Builder totalRuns(long totalRuns) { this.totalRuns = totalRuns; return this; }
            public Builder overall(DungeonOverallStats overall) { this.overall = overall; return this; }
            public Builder byClass(Map<String, DungeonClassStats> byClass) { this.byClass = byClass; return this; }
            public DungeonPeriodStats build() { return new DungeonPeriodStats(totalRuns, overall, byClass); }
        }
    }

    // -------------------------------------------------------------------------

    public static class DungeonOverallStats {
        private double averageTime;
        private double averageDeaths;
        private double averageItemLevel;
        private double successRate;

        public DungeonOverallStats() {}

        public DungeonOverallStats(double averageTime, double averageDeaths, double averageItemLevel, double successRate) {
            this.averageTime = averageTime;
            this.averageDeaths = averageDeaths;
            this.averageItemLevel = averageItemLevel;
            this.successRate = successRate;
        }

        public static Builder builder() { return new Builder(); }

        public double getAverageTime() { return averageTime; }
        public void setAverageTime(double averageTime) { this.averageTime = averageTime; }
        public double getAverageDeaths() { return averageDeaths; }
        public void setAverageDeaths(double averageDeaths) { this.averageDeaths = averageDeaths; }
        public double getAverageItemLevel() { return averageItemLevel; }
        public void setAverageItemLevel(double averageItemLevel) { this.averageItemLevel = averageItemLevel; }
        public double getSuccessRate() { return successRate; }
        public void setSuccessRate(double successRate) { this.successRate = successRate; }

        public static class Builder {
            private double averageTime;
            private double averageDeaths;
            private double averageItemLevel;
            private double successRate;

            public Builder averageTime(double v) { this.averageTime = v; return this; }
            public Builder averageDeaths(double v) { this.averageDeaths = v; return this; }
            public Builder averageItemLevel(double v) { this.averageItemLevel = v; return this; }
            public Builder successRate(double v) { this.successRate = v; return this; }
            public DungeonOverallStats build() {
                return new DungeonOverallStats(averageTime, averageDeaths, averageItemLevel, successRate);
            }
        }
    }

    // -------------------------------------------------------------------------

    public static class DungeonClassStats {
        private long runCount;
        private double averageTime;
        private double averageDeaths;
        private double averageItemLevel;
        private double successRate;

        public DungeonClassStats() {}

        public DungeonClassStats(long runCount, double averageTime, double averageDeaths,
                                 double averageItemLevel, double successRate) {
            this.runCount = runCount;
            this.averageTime = averageTime;
            this.averageDeaths = averageDeaths;
            this.averageItemLevel = averageItemLevel;
            this.successRate = successRate;
        }

        public static Builder builder() { return new Builder(); }

        public long getRunCount() { return runCount; }
        public void setRunCount(long runCount) { this.runCount = runCount; }
        public double getAverageTime() { return averageTime; }
        public void setAverageTime(double averageTime) { this.averageTime = averageTime; }
        public double getAverageDeaths() { return averageDeaths; }
        public void setAverageDeaths(double averageDeaths) { this.averageDeaths = averageDeaths; }
        public double getAverageItemLevel() { return averageItemLevel; }
        public void setAverageItemLevel(double averageItemLevel) { this.averageItemLevel = averageItemLevel; }
        public double getSuccessRate() { return successRate; }
        public void setSuccessRate(double successRate) { this.successRate = successRate; }

        public static class Builder {
            private long runCount;
            private double averageTime;
            private double averageDeaths;
            private double averageItemLevel;
            private double successRate;

            public Builder runCount(long v) { this.runCount = v; return this; }
            public Builder averageTime(double v) { this.averageTime = v; return this; }
            public Builder averageDeaths(double v) { this.averageDeaths = v; return this; }
            public Builder averageItemLevel(double v) { this.averageItemLevel = v; return this; }
            public Builder successRate(double v) { this.successRate = v; return this; }
            public DungeonClassStats build() {
                return new DungeonClassStats(runCount, averageTime, averageDeaths, averageItemLevel, successRate);
            }
        }
    }
}
