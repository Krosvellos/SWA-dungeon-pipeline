package org.example.dungeonbackend.repository;

import org.example.dungeonbackend.model.JobRunStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobRunStepRepository extends JpaRepository<JobRunStep, Long> {
    List<JobRunStep> findByJobRunIdOrderByStartedAtAsc(Long jobRunId);
}
