package org.example.dungeonbackend.service;

import org.example.dungeonbackend.dto.PipelineRequest;
import org.example.dungeonbackend.model.Pipeline;
import org.example.dungeonbackend.repository.DatasetRepository;
import org.example.dungeonbackend.repository.PipelineRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PipelineService {

    private final PipelineRepository pipelineRepository;
    private final DatasetRepository datasetRepository;
    private final DungeonService dungeonService;

    public PipelineService(PipelineRepository pipelineRepository,
                           DatasetRepository datasetRepository,
                           DungeonService dungeonService) {
        this.pipelineRepository = pipelineRepository;
        this.datasetRepository = datasetRepository;
        this.dungeonService = dungeonService;
    }

    public List<Pipeline> getAll() {
        return pipelineRepository.findAll();
    }

    public Pipeline getById(Long id) {
        return pipelineRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pipeline not found: " + id));
    }

    public Pipeline create(PipelineRequest req) {
        if (!datasetRepository.existsById(req.getDatasetId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Dataset not found: " + req.getDatasetId());
        }
        Pipeline p = new Pipeline();
        p.setName(req.getName());
        p.setDescription(req.getDescription());
        p.setDatasetId(req.getDatasetId());
        p.setSchedule(req.getSchedule());
        p.setActive(req.isActive());
        p.setTimeoutMinutes(req.getTimeoutMinutes());
        p.setCreatedAt(LocalDateTime.now());
        return pipelineRepository.save(p);
    }

    public Pipeline update(Long id, PipelineRequest req) {
        Pipeline p = getById(id);
        if (!datasetRepository.existsById(req.getDatasetId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Dataset not found: " + req.getDatasetId());
        }
        p.setName(req.getName());
        p.setDescription(req.getDescription());
        p.setDatasetId(req.getDatasetId());
        p.setSchedule(req.getSchedule());
        p.setActive(req.isActive());
        p.setTimeoutMinutes(req.getTimeoutMinutes());
        return pipelineRepository.save(p);
    }

    public Pipeline setActive(Long id, boolean active) {
        Pipeline p = getById(id);
        p.setActive(active);
        return pipelineRepository.save(p);
    }

    public void delete(Long id) {
        getById(id);
        pipelineRepository.deleteById(id);
    }

    public void run(Long id) {
        Pipeline p = getById(id);
        if (!p.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Pipeline is not active and cannot be run");
        }
        dungeonService.aggregateDataAsync(p.getId());
    }
}
