package org.example.dungeonbackend.service;

import org.example.dungeonbackend.dto.DatasetRequest;
import org.example.dungeonbackend.model.Dataset;
import org.example.dungeonbackend.repository.DatasetRepository;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DatasetService {

    private final DatasetRepository datasetRepository;
    private final MongoTemplate mongoTemplate;

    public DatasetService(DatasetRepository datasetRepository, MongoTemplate mongoTemplate) {
        this.datasetRepository = datasetRepository;
        this.mongoTemplate = mongoTemplate;
    }

    public List<Dataset> getAll() {
        return datasetRepository.findAll();
    }

    public Dataset getById(Long id) {
        return datasetRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dataset not found: " + id));
    }

    public Dataset create(DatasetRequest req) {
        Dataset d = new Dataset();
        d.setName(req.getName());
        d.setDescription(req.getDescription());
        d.setOwner(req.getOwner());
        d.setSchemaVersion(req.getSchemaVersion());
        d.setCreatedAt(LocalDateTime.now());
        Dataset saved = datasetRepository.save(d);
        if (!mongoTemplate.collectionExists(saved.getName())) {
            mongoTemplate.createCollection(saved.getName());
        }
        return saved;
    }

    public Dataset update(Long id, DatasetRequest req) {
        Dataset d = getById(id);
        d.setName(req.getName());
        d.setDescription(req.getDescription());
        d.setOwner(req.getOwner());
        d.setSchemaVersion(req.getSchemaVersion());
        return datasetRepository.save(d);
    }

    public void delete(Long id) {
        getById(id);
        datasetRepository.deleteById(id);
    }
}
