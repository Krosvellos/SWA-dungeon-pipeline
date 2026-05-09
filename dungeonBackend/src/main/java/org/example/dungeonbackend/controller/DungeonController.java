package org.example.dungeonbackend.controller;

import org.example.dungeonbackend.dto.DungeonDashboardResponse;
import org.example.dungeonbackend.model.DungeonRun;
import org.example.dungeonbackend.model.DungeonStats;
import org.example.dungeonbackend.model.JobRun;
import org.example.dungeonbackend.repository.PipelineRepository;
import org.example.dungeonbackend.service.DungeonService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dungeon")
@CrossOrigin(origins = "*") // Allows calls from any frontend port for development
public class DungeonController {

    private final DungeonService dungeonService;
    private final PipelineRepository pipelineRepository;

    public DungeonController(DungeonService dungeonService, PipelineRepository pipelineRepository) {
        this.dungeonService = dungeonService;
        this.pipelineRepository = pipelineRepository;
    }

    private Long defaultPipelineId() {
        return pipelineRepository.findFirstByActiveTrue().map(p -> p.getId()).orElse(null);
    }

    // Endpoint for incoming finished dungeon run data
    @PostMapping("/run")
    public ResponseEntity<DungeonRun> saveDungeonRun(@RequestBody DungeonRun run) {
        return ResponseEntity.ok(dungeonService.processFinishedRun(run));
    }

    // Endpoint for dashboard with overall dungeon stats
    @GetMapping("/dashboard")
    public ResponseEntity<DungeonDashboardResponse> getDashboard(@RequestParam String date) {
        return ResponseEntity.ok(dungeonService.getDashboardStats(date));
    }

    @GetMapping("/stats")
    public ResponseEntity<List<DungeonStats>> getAllStats() {
        return ResponseEntity.ok(dungeonService.getAllStats());
    }

    // CRUD operations for dungeon runs
    @GetMapping("/runs")
    public ResponseEntity<List<DungeonRun>> getAllRuns() {
        return ResponseEntity.ok(dungeonService.getAllDungeonRuns());
    }

    @GetMapping("/runs/{id}")
    public ResponseEntity<DungeonRun> getRunById(@PathVariable String id) {
        return dungeonService.getDungeonRunById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/runs/{id}")
    public ResponseEntity<Void> deleteRun(@PathVariable String id) {
        dungeonService.deleteDungeonRun(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/job-runs")
    public ResponseEntity<List<JobRun>> getJobRuns() {
        return ResponseEntity.ok(dungeonService.getJobRuns());
    }

    // Endpoint to manually trigger the data aggregation process (returns 202 immediately, runs async)
    @PostMapping("/aggregate")
    public ResponseEntity<Void> triggerAggregation() {
        dungeonService.aggregateDataAsync(defaultPipelineId());
        return ResponseEntity.accepted().build();
    }

    // Endpoint to trigger a simulated failure run (sleeps 32s then fails, retries, sends email)
    @PostMapping("/aggregate/test-fail")
    public ResponseEntity<Void> triggerTestFail() {
        dungeonService.aggregateDataTestFail(defaultPipelineId());
        return ResponseEntity.accepted().build();
    }
}
