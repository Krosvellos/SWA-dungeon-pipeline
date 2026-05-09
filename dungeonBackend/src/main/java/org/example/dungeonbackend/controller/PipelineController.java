package org.example.dungeonbackend.controller;

import jakarta.validation.Valid;
import org.example.dungeonbackend.dto.PipelineRequest;
import org.example.dungeonbackend.model.AlertEvent;
import org.example.dungeonbackend.model.Pipeline;
import org.example.dungeonbackend.service.AlertService;
import org.example.dungeonbackend.service.PipelineService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pipelines")
@CrossOrigin(origins = "*")
public class PipelineController {

    private final PipelineService pipelineService;
    private final AlertService alertService;

    public PipelineController(PipelineService pipelineService, AlertService alertService) {
        this.pipelineService = pipelineService;
        this.alertService = alertService;
    }

    @GetMapping
    public ResponseEntity<List<Pipeline>> getAll() {
        return ResponseEntity.ok(pipelineService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pipeline> getById(@PathVariable Long id) {
        return ResponseEntity.ok(pipelineService.getById(id));
    }

    @PostMapping
    public ResponseEntity<Pipeline> create(@Valid @RequestBody PipelineRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pipelineService.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Pipeline> update(@PathVariable Long id, @Valid @RequestBody PipelineRequest req) {
        return ResponseEntity.ok(pipelineService.update(id, req));
    }

    @PatchMapping("/{id}/active")
    public ResponseEntity<Pipeline> setActive(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        boolean active = Boolean.TRUE.equals(body.get("active"));
        return ResponseEntity.ok(pipelineService.setActive(id, active));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        pipelineService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/run")
    public ResponseEntity<Void> run(@PathVariable Long id) {
        pipelineService.run(id);
        return ResponseEntity.accepted().build();
    }

    @GetMapping("/{id}/alerts")
    public ResponseEntity<List<AlertEvent>> getAlerts(@PathVariable Long id) {
        return ResponseEntity.ok(alertService.getByPipeline(id));
    }
}
