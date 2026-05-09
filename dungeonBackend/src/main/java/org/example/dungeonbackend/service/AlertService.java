package org.example.dungeonbackend.service;

import org.example.dungeonbackend.model.AlertEvent;
import org.example.dungeonbackend.repository.AlertEventRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AlertService {

    private final AlertEventRepository alertEventRepository;

    public AlertService(AlertEventRepository alertEventRepository) {
        this.alertEventRepository = alertEventRepository;
    }

    public List<AlertEvent> getAll() {
        return alertEventRepository.findAllByOrderByCreatedAtDesc();
    }

    public AlertEvent getById(Long id) {
        return alertEventRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Alert not found: " + id));
    }

    public List<AlertEvent> getByPipeline(Long pipelineId) {
        return alertEventRepository.findByPipelineIdOrderByCreatedAtDesc(pipelineId);
    }

    public AlertEvent resolve(Long id) {
        AlertEvent alert = getById(id);
        alert.setStatus(AlertEvent.AlertStatus.RESOLVED);
        return alertEventRepository.save(alert);
    }

    public long countOpen() {
        return alertEventRepository.countByStatus(AlertEvent.AlertStatus.OPEN);
    }
}
