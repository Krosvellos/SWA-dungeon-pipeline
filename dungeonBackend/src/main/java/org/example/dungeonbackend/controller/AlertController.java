package org.example.dungeonbackend.controller;

import org.example.dungeonbackend.model.AlertEvent;
import org.example.dungeonbackend.service.AlertService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = "*")
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    @GetMapping
    public ResponseEntity<List<AlertEvent>> getAll() {
        return ResponseEntity.ok(alertService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AlertEvent> getById(@PathVariable Long id) {
        return ResponseEntity.ok(alertService.getById(id));
    }

    @PatchMapping("/{id}/resolve")
    public ResponseEntity<AlertEvent> resolve(@PathVariable Long id) {
        return ResponseEntity.ok(alertService.resolve(id));
    }
}
