package org.example.dungeonbackend.repository;

import org.example.dungeonbackend.model.Pipeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PipelineRepository extends JpaRepository<Pipeline, Long> {
    List<Pipeline> findByDatasetId(Long datasetId);
    Optional<Pipeline> findFirstByActiveTrue();
}
