package org.example.dungeonbackend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "dungeon_runs")
public class DungeonRun {
    @Id
    private String id;
    private String runId;
    private String timestamp;
    private String date;
    private String dungeonName;
    @JsonProperty("class")
    private String playerClass;
    private int ilvl;
    private double fullRunTime;
    private int deathCount;
    private int enemiesKilled;
    private double bossKillTime;
    private String lootQuality;
    private int damageDealt;
    private int damageTaken;
    private int potionsUsed;
    private int goldCollected;
    private boolean finalBossKilled;

    public DungeonRun() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getRunId() { return runId; }
    public void setRunId(String runId) { this.runId = runId; }
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getDungeonName() { return dungeonName; }
    public void setDungeonName(String dungeonName) { this.dungeonName = dungeonName; }
    public String getPlayerClass() { return playerClass; }
    public void setPlayerClass(String playerClass) { this.playerClass = playerClass; }
    public int getIlvl() { return ilvl; }
    public void setIlvl(int ilvl) { this.ilvl = ilvl; }
    public double getFullRunTime() { return fullRunTime; }
    public void setFullRunTime(double fullRunTime) { this.fullRunTime = fullRunTime; }
    public int getDeathCount() { return deathCount; }
    public void setDeathCount(int deathCount) { this.deathCount = deathCount; }
    public int getEnemiesKilled() { return enemiesKilled; }
    public void setEnemiesKilled(int enemiesKilled) { this.enemiesKilled = enemiesKilled; }
    public double getBossKillTime() { return bossKillTime; }
    public void setBossKillTime(double bossKillTime) { this.bossKillTime = bossKillTime; }
    public String getLootQuality() { return lootQuality; }
    public void setLootQuality(String lootQuality) { this.lootQuality = lootQuality; }
    public int getDamageDealt() { return damageDealt; }
    public void setDamageDealt(int damageDealt) { this.damageDealt = damageDealt; }
    public int getDamageTaken() { return damageTaken; }
    public void setDamageTaken(int damageTaken) { this.damageTaken = damageTaken; }
    public int getPotionsUsed() { return potionsUsed; }
    public void setPotionsUsed(int potionsUsed) { this.potionsUsed = potionsUsed; }
    public int getGoldCollected() { return goldCollected; }
    public void setGoldCollected(int goldCollected) { this.goldCollected = goldCollected; }
    public boolean isFinalBossKilled() { return finalBossKilled; }
    public void setFinalBossKilled(boolean finalBossKilled) { this.finalBossKilled = finalBossKilled; }
}
