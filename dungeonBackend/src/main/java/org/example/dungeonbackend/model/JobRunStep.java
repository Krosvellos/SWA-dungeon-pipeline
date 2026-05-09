package org.example.dungeonbackend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "job_run_steps")
public class JobRunStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long jobRunId;

    @Column(nullable = false)
    private String stepName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobRun.Status status;

    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
    private Integer recordsProcessed;

    @Column(length = 1000)
    private String errorMessage;

    public JobRunStep() {}

    public Long getId() { return id; }
    public Long getJobRunId() { return jobRunId; }
    public void setJobRunId(Long jobRunId) { this.jobRunId = jobRunId; }
    public String getStepName() { return stepName; }
    public void setStepName(String stepName) { this.stepName = stepName; }
    public JobRun.Status getStatus() { return status; }
    public void setStatus(JobRun.Status status) { this.status = status; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    public LocalDateTime getFinishedAt() { return finishedAt; }
    public void setFinishedAt(LocalDateTime finishedAt) { this.finishedAt = finishedAt; }
    public Integer getRecordsProcessed() { return recordsProcessed; }
    public void setRecordsProcessed(Integer recordsProcessed) { this.recordsProcessed = recordsProcessed; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}
