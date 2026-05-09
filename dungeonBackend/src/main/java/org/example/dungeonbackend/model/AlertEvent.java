package org.example.dungeonbackend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "alert_events")
public class AlertEvent {

    public enum Severity { INFO, WARNING, CRITICAL }
    public enum AlertStatus { OPEN, RESOLVED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long pipelineId;
    private Long jobRunId;

    @Column(nullable = false)
    private String message;

    @Enumerated(EnumType.STRING)
    private Severity severity;

    @Enumerated(EnumType.STRING)
    private AlertStatus status;

    private LocalDateTime createdAt;

    public AlertEvent() {}

    public AlertEvent(Long pipelineId, Long jobRunId, String message, Severity severity) {
        this.pipelineId = pipelineId;
        this.jobRunId = jobRunId;
        this.message = message;
        this.severity = severity;
        this.status = AlertStatus.OPEN;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getPipelineId() { return pipelineId; }
    public void setPipelineId(Long pipelineId) { this.pipelineId = pipelineId; }
    public Long getJobRunId() { return jobRunId; }
    public void setJobRunId(Long jobRunId) { this.jobRunId = jobRunId; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Severity getSeverity() { return severity; }
    public void setSeverity(Severity severity) { this.severity = severity; }
    public AlertStatus getStatus() { return status; }
    public void setStatus(AlertStatus status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
