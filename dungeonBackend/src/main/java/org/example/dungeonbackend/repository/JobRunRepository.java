package org.example.dungeonbackend.repository;

import org.example.dungeonbackend.model.JobRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobRunRepository extends JpaRepository<JobRun, Long> {
    List<JobRun> findTop2ByStatusInOrderByStartedAtDesc(List<JobRun.Status> statuses);
    List<JobRun> findAllByOrderByStartedAtDesc();
}
