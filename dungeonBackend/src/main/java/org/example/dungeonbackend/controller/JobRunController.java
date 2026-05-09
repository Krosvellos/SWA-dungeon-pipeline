package org.example.dungeonbackend.controller;

import org.example.dungeonbackend.model.JobRun;
import org.example.dungeonbackend.model.JobRunStep;
import org.example.dungeonbackend.repository.JobRunRepository;
import org.example.dungeonbackend.repository.JobRunStepRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/runs")
@CrossOrigin(origins = "*")
public class JobRunController {

    private final JobRunRepository jobRunRepository;
    private final JobRunStepRepository jobRunStepRepository;

    public JobRunController(JobRunRepository jobRunRepository, JobRunStepRepository jobRunStepRepository) {
        this.jobRunRepository = jobRunRepository;
        this.jobRunStepRepository = jobRunStepRepository;
    }

    @GetMapping
    public ResponseEntity<List<JobRun>> getAll() {
        return ResponseEntity.ok(jobRunRepository.findAllByOrderByStartedAtDesc());
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobRun> getById(@PathVariable Long id) {
        return jobRunRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/steps")
    public ResponseEntity<List<JobRunStep>> getSteps(@PathVariable Long id) {
        return ResponseEntity.ok(jobRunStepRepository.findByJobRunIdOrderByStartedAtAsc(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<JobRun> patch(@PathVariable Long id, @RequestBody Map<String, String> body) {
        JobRun run = jobRunRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "JobRun not found"));

        if (run.getStatus() == JobRun.Status.SUCCESS || run.getStatus() == JobRun.Status.FAILED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot update a completed job");
        }

        String newStatus = body.get("status");
        if ("FAILED".equals(newStatus)) {
            run.setStatus(JobRun.Status.FAILED);
        } else if ("SUCCESS".equals(newStatus)) {
            run.setStatus(JobRun.Status.SUCCESS);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status must be FAILED or SUCCESS");
        }

        run.setFinishedAt(LocalDateTime.now());
        if (run.getStartedAt() != null) {
            run.setDurationSeconds(Duration.between(run.getStartedAt(), run.getFinishedAt()).getSeconds());
        }

        return ResponseEntity.ok(jobRunRepository.save(run));
    }
}
