package org.example.dungeonbackend.repository;

import org.example.dungeonbackend.model.AlertRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AlertRuleRepository extends JpaRepository<AlertRule, Long> {
    Optional<AlertRule> findByPipelineId(Long pipelineId);
}
