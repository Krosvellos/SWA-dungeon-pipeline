package org.example.dungeonbackend.controller;

import org.example.dungeonbackend.model.AlertRule;
import org.example.dungeonbackend.service.AlertRuleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alert-rules")
@CrossOrigin(origins = "*")
public class AlertRuleController {

    private final AlertRuleService alertRuleService;

    public AlertRuleController(AlertRuleService alertRuleService) {
        this.alertRuleService = alertRuleService;
    }

    @GetMapping
    public ResponseEntity<List<AlertRule>> getAll() {
        return ResponseEntity.ok(alertRuleService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AlertRule> getById(@PathVariable Long id) {
        return ResponseEntity.ok(alertRuleService.getById(id));
    }

    @GetMapping("/pipeline/{pipelineId}")
    public ResponseEntity<AlertRule> getByPipeline(@PathVariable Long pipelineId) {
        return ResponseEntity.ok(alertRuleService.getByPipelineId(pipelineId));
    }

    // Create a new alert rule (pipelineId + alertMode in body)
    @PostMapping
    public ResponseEntity<AlertRule> create(@RequestBody Map<String, String> body) {
        Long pipelineId = Long.valueOf(body.get("pipelineId"));
        AlertRule.AlertMode mode = AlertRule.AlertMode.valueOf(body.get("alertMode"));
        return ResponseEntity.status(201).body(alertRuleService.upsertForPipeline(pipelineId, mode));
    }

    // Create or replace the rule for a given pipeline (convenience upsert)
    @PutMapping("/pipeline/{pipelineId}")
    public ResponseEntity<AlertRule> upsert(@PathVariable Long pipelineId,
                                             @RequestBody Map<String, String> body) {
        AlertRule.AlertMode mode = AlertRule.AlertMode.valueOf(body.get("alertMode"));
        return ResponseEntity.ok(alertRuleService.upsertForPipeline(pipelineId, mode));
    }

    // Patch existing rule by its own ID
    @PatchMapping("/{id}")
    public ResponseEntity<AlertRule> patch(@PathVariable Long id, @RequestBody Map<String, String> body) {
        AlertRule rule = alertRuleService.getById(id);
        AlertRule.AlertMode mode = AlertRule.AlertMode.valueOf(body.get("alertMode"));
        return ResponseEntity.ok(alertRuleService.upsertForPipeline(rule.getPipelineId(), mode));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        alertRuleService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
