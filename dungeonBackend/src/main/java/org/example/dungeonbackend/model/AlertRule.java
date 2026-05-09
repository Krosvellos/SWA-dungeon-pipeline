package org.example.dungeonbackend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "alert_rules")
public class AlertRule {

    public enum AlertMode {
        CONSECUTIVE_FAIL_EMAIL,
        NO_ALERTS,
        EXCLUDE_TIMEOUT_FAILURES
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long pipelineId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlertMode alertMode;

    public AlertRule() {}

    public AlertRule(Long pipelineId, AlertMode alertMode) {
        this.pipelineId = pipelineId;
        this.alertMode = alertMode;
    }

    public Long getId() { return id; }
    public Long getPipelineId() { return pipelineId; }
    public void setPipelineId(Long pipelineId) { this.pipelineId = pipelineId; }
    public AlertMode getAlertMode() { return alertMode; }
    public void setAlertMode(AlertMode alertMode) { this.alertMode = alertMode; }
}
