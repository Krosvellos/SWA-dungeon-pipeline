package org.example.dungeonbackend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "dungeon_stats")
public class DungeonStats {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String dungeonName;
    private String playerClass;
    private String date; // YYYY-MM-DD for grouping
    
    private long totalRuns;
    private double totalTime;
    private long totalDeaths;
    private long totalItemLevel;
    private long successCount;
    
    private LocalDateTime lastUpdated;

    public DungeonStats() {}

    public DungeonStats(Long id, String dungeonName, String playerClass, String date, long totalRuns, double totalTime, long totalDeaths, long totalItemLevel, long successCount, LocalDateTime lastUpdated) {
        this.id = id;
        this.dungeonName = dungeonName;
        this.playerClass = playerClass;
        this.date = date;
        this.totalRuns = totalRuns;
        this.totalTime = totalTime;
        this.totalDeaths = totalDeaths;
        this.totalItemLevel = totalItemLevel;
        this.successCount = successCount;
        this.lastUpdated = lastUpdated;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getDungeonName() { return dungeonName; }
    public void setDungeonName(String dungeonName) { this.dungeonName = dungeonName; }
    public String getPlayerClass() { return playerClass; }
    public void setPlayerClass(String playerClass) { this.playerClass = playerClass; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public long getTotalRuns() { return totalRuns; }
    public void setTotalRuns(long totalRuns) { this.totalRuns = totalRuns; }
    public double getTotalTime() { return totalTime; }
    public void setTotalTime(double totalTime) { this.totalTime = totalTime; }
    public long getTotalDeaths() { return totalDeaths; }
    public void setTotalDeaths(long totalDeaths) { this.totalDeaths = totalDeaths; }
    public long getTotalItemLevel() { return totalItemLevel; }
    public void setTotalItemLevel(long totalItemLevel) { this.totalItemLevel = totalItemLevel; }
    public long getSuccessCount() { return successCount; }
    public void setSuccessCount(long successCount) { this.successCount = successCount; }
    public LocalDateTime getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }
}
