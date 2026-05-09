package org.example.dungeonbackend.service;

import org.example.dungeonbackend.model.AlertRule;
import org.example.dungeonbackend.repository.AlertRuleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AlertRuleService {

    private final AlertRuleRepository alertRuleRepository;

    public AlertRuleService(AlertRuleRepository alertRuleRepository) {
        this.alertRuleRepository = alertRuleRepository;
    }

    public List<AlertRule> getAll() {
        return alertRuleRepository.findAll();
    }

    public AlertRule getById(Long id) {
        return alertRuleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "AlertRule not found"));
    }

    public AlertRule getByPipelineId(Long pipelineId) {
        return alertRuleRepository.findByPipelineId(pipelineId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No AlertRule for pipeline " + pipelineId));
    }

    // Create or replace the alert rule for a pipeline
    public AlertRule upsertForPipeline(Long pipelineId, AlertRule.AlertMode mode) {
        AlertRule rule = alertRuleRepository.findByPipelineId(pipelineId)
                .orElseGet(() -> new AlertRule(pipelineId, mode));
        rule.setAlertMode(mode);
        return alertRuleRepository.save(rule);
    }

    public void delete(Long id) {
        if (!alertRuleRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "AlertRule not found");
        }
        alertRuleRepository.deleteById(id);
    }
}
