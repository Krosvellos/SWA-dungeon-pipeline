package org.example.dungeonbackend.controller;

import jakarta.validation.Valid;
import org.example.dungeonbackend.dto.DatasetRequest;
import org.example.dungeonbackend.model.Dataset;
import org.example.dungeonbackend.service.DatasetService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/datasets")
@CrossOrigin(origins = "*")
public class DatasetController {

    private final DatasetService datasetService;

    public DatasetController(DatasetService datasetService) {
        this.datasetService = datasetService;
    }

    @GetMapping
    public ResponseEntity<List<Dataset>> getAll() {
        return ResponseEntity.ok(datasetService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Dataset> getById(@PathVariable Long id) {
        return ResponseEntity.ok(datasetService.getById(id));
    }

    @PostMapping
    public ResponseEntity<Dataset> create(@Valid @RequestBody DatasetRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(datasetService.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Dataset> update(@PathVariable Long id, @Valid @RequestBody DatasetRequest req) {
        return ResponseEntity.ok(datasetService.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        datasetService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
