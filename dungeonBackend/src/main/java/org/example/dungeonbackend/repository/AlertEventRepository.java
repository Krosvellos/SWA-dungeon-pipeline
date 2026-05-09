package org.example.dungeonbackend.repository;

import org.example.dungeonbackend.model.AlertEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertEventRepository extends JpaRepository<AlertEvent, Long> {
    List<AlertEvent> findAllByOrderByCreatedAtDesc();
    List<AlertEvent> findByPipelineIdOrderByCreatedAtDesc(Long pipelineId);
    List<AlertEvent> findByStatus(AlertEvent.AlertStatus status);
    long countByStatus(AlertEvent.AlertStatus status);
}
