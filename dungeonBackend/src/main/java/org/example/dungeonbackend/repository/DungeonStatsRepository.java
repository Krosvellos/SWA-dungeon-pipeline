package org.example.dungeonbackend.repository;

import org.example.dungeonbackend.model.DungeonStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DungeonStatsRepository extends JpaRepository<DungeonStats, Long> {
    Optional<DungeonStats> findByDungeonNameAndPlayerClassAndDate(String dungeonName, String playerClass, String date);
    
    @Query("SELECT DISTINCT d.date FROM DungeonStats d")
    List<String> findDistinctDates();
}
