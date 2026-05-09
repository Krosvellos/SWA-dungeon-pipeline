package org.example.dungeonbackend.service;

import org.example.dungeonbackend.dto.DungeonDashboardResponse;
import org.example.dungeonbackend.dto.DungeonDashboardResponse.DungeonClassStats;
import org.example.dungeonbackend.dto.DungeonDashboardResponse.DungeonOverallStats;
import org.example.dungeonbackend.dto.DungeonDashboardResponse.DungeonPeriodStats;
import org.example.dungeonbackend.model.*;
import org.example.dungeonbackend.repository.*;
import org.example.dungeonbackend.model.AlertRule.AlertMode;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
public class DungeonService {

    private final DungeonRunRepository dungeonRunRepository;
    private final ProcessedDungeonRunRepository processedRepository;
    private final DungeonStatsRepository statsRepository;
    private final JobRunRepository jobRunRepository;
    private final JobRunStepRepository jobRunStepRepository;
    private final AlertEventRepository alertEventRepository;
    private final PipelineRepository pipelineRepository;
    private final DatasetRepository datasetRepository;
    private final AlertRuleRepository alertRuleRepository;
    private final EmailService emailService;
    private final MongoTemplate mongoTemplate;

    public DungeonService(DungeonRunRepository dungeonRunRepository,
                          ProcessedDungeonRunRepository processedRepository,
                          DungeonStatsRepository statsRepository,
                          JobRunRepository jobRunRepository,
                          JobRunStepRepository jobRunStepRepository,
                          AlertEventRepository alertEventRepository,
                          PipelineRepository pipelineRepository,
                          DatasetRepository datasetRepository,
                          AlertRuleRepository alertRuleRepository,
                          EmailService emailService,
                          MongoTemplate mongoTemplate) {
        this.dungeonRunRepository = dungeonRunRepository;
        this.processedRepository = processedRepository;
        this.statsRepository = statsRepository;
        this.jobRunRepository = jobRunRepository;
        this.jobRunStepRepository = jobRunStepRepository;
        this.alertEventRepository = alertEventRepository;
        this.pipelineRepository = pipelineRepository;
        this.datasetRepository = datasetRepository;
        this.alertRuleRepository = alertRuleRepository;
        this.emailService = emailService;
        this.mongoTemplate = mongoTemplate;
    }

    private JobRunStep startStep(Long jobRunId, String name) {
        JobRunStep step = new JobRunStep();
        step.setJobRunId(jobRunId);
        step.setStepName(name);
        step.setStatus(JobRun.Status.RUNNING);
        step.setStartedAt(LocalDateTime.now());
        return jobRunStepRepository.save(step);
    }

    private void finishStep(JobRunStep step, JobRun.Status status, int records, String error) {
        step.setStatus(status);
        step.setFinishedAt(LocalDateTime.now());
        step.setRecordsProcessed(records);
        step.setErrorMessage(error);
        jobRunStepRepository.save(step);
    }

    public DungeonRun processFinishedRun(DungeonRun run) {
        return dungeonRunRepository.save(run);
    }

    public DungeonDashboardResponse getDashboardStats(String dateStr) {
        LocalDate date = LocalDate.parse(dateStr);
        List<DungeonStats> allStats = statsRepository.findAll();

        return DungeonDashboardResponse.builder()
                .date(dateStr)
                .yearly(aggregateByPeriod(allStats, date, "yearly"))
                .monthly(aggregateByPeriod(allStats, date, "monthly"))
                .weekly(aggregateByPeriod(allStats, date, "weekly"))
                .build();
    }

    private Map<String, DungeonPeriodStats> aggregateByPeriod(List<DungeonStats> allStats, LocalDate targetDate, String period) {
        Map<String, List<DungeonStats>> filtered = allStats.stream()
                .filter(s -> isInPeriod(LocalDate.parse(s.getDate()), targetDate, period))
                .collect(Collectors.groupingBy(DungeonStats::getDungeonName));

        Map<String, DungeonPeriodStats> result = new HashMap<>();
        for (Map.Entry<String, List<DungeonStats>> entry : filtered.entrySet()) {
            List<DungeonStats> statsList = entry.getValue();

            long totalRuns = statsList.stream().mapToLong(DungeonStats::getTotalRuns).sum();
            double totalTime = statsList.stream().mapToDouble(DungeonStats::getTotalTime).sum();
            long totalDeaths = statsList.stream().mapToLong(DungeonStats::getTotalDeaths).sum();
            long totalIlvl = statsList.stream().mapToLong(DungeonStats::getTotalItemLevel).sum();
            long successCount = statsList.stream().mapToLong(DungeonStats::getSuccessCount).sum();

            DungeonOverallStats overall = DungeonOverallStats.builder()
                    .averageTime(round(totalTime / totalRuns))
                    .averageDeaths(round((double) totalDeaths / totalRuns))
                    .averageItemLevel(round((double) totalIlvl / totalRuns))
                    .successRate(round((double) successCount * 100 / totalRuns))
                    .build();

            Map<String, DungeonClassStats> byClass = new HashMap<>();
            statsList.stream().collect(Collectors.groupingBy(DungeonStats::getPlayerClass))
                    .forEach((className, classStats) -> {
                        long cRuns = classStats.stream().mapToLong(DungeonStats::getTotalRuns).sum();
                        byClass.put(className, DungeonClassStats.builder()
                                .runCount(cRuns)
                                .averageTime(round(classStats.stream().mapToDouble(DungeonStats::getTotalTime).sum() / cRuns))
                                .averageDeaths(round((double) classStats.stream().mapToLong(DungeonStats::getTotalDeaths).sum() / cRuns))
                                .averageItemLevel(round((double) classStats.stream().mapToLong(DungeonStats::getTotalItemLevel).sum() / cRuns))
                                .successRate(round((double) classStats.stream().mapToLong(DungeonStats::getSuccessCount).sum() * 100 / cRuns))
                                .build());
                    });

            result.put(entry.getKey(), DungeonPeriodStats.builder()
                    .totalRuns(totalRuns)
                    .overall(overall)
                    .byClass(byClass)
                    .build());
        }
        return result;
    }

    private boolean isInPeriod(LocalDate statDate, LocalDate targetDate, String period) {
        switch (period) {
            case "yearly":
                return statDate.getYear() == targetDate.getYear();
            case "monthly":
                return statDate.getYear() == targetDate.getYear() && statDate.getMonth() == targetDate.getMonth();
            case "weekly":
                WeekFields weekFields = WeekFields.of(Locale.getDefault());
                return statDate.getYear() == targetDate.getYear() &&
                        statDate.get(weekFields.weekOfWeekBasedYear()) == targetDate.get(weekFields.weekOfWeekBasedYear());
            default:
                return false;
        }
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    public List<DungeonStats> getAllStats() {
        return statsRepository.findAll();
    }

    public List<DungeonRun> getAllDungeonRuns() {
        return dungeonRunRepository.findAll();
    }

    public Optional<DungeonRun> getDungeonRunById(String id) {
        return dungeonRunRepository.findById(id);
    }

    public void deleteDungeonRun(String id) {
        dungeonRunRepository.deleteById(id);
    }

    public List<JobRun> getJobRuns() {
        return jobRunRepository.findAllByOrderByStartedAtDesc();
    }

    // Creates one JobRun record, performs aggregation (or simulates timeout), persists result and creates alert on failure
    private JobRun performRun(boolean simulateFailure, Long pipelineId) {
        Pipeline pipeline = pipelineRepository.findById(pipelineId).orElse(null);
        String collectionName = pipeline != null
                ? datasetRepository.findById(pipeline.getDatasetId()).map(Dataset::getName).orElse("dungeon_runs")
                : "dungeon_runs";
        int timeoutMinutes = pipeline != null ? pipeline.getTimeoutMinutes() : 10;

        // --- Phase 1: PENDING — 5s startup / pre-flight data check ---
        JobRun jobRun = new JobRun();
        jobRun.setStatus(JobRun.Status.PENDING);
        jobRun.setStartedAt(LocalDateTime.now());
        jobRun.setPipelineId(pipelineId);
        jobRunRepository.save(jobRun);

        try {
            Thread.sleep(5_000);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            jobRun.setStatus(JobRun.Status.FAILED);
            jobRun.setErrorMessage("Přerušeno během inicializace");
            jobRun.setRecordsProcessed(0);
            jobRun.setFinishedAt(LocalDateTime.now());
            jobRun.setDurationSeconds(Duration.between(jobRun.getStartedAt(), jobRun.getFinishedAt()).getSeconds());
            return jobRunRepository.save(jobRun);
        }

        // No data to process — finish immediately as success
        if (!simulateFailure && mongoTemplate.count(new org.springframework.data.mongodb.core.query.Query(), collectionName) == 0) {
            jobRun.setStatus(JobRun.Status.SUCCESS);
            jobRun.setRecordsProcessed(0);
            jobRun.setFinishedAt(LocalDateTime.now());
            jobRun.setDurationSeconds(Duration.between(jobRun.getStartedAt(), jobRun.getFinishedAt()).getSeconds());
            return jobRunRepository.save(jobRun);
        }

        // --- Phase 2: RUNNING ---
        jobRun.setStatus(JobRun.Status.RUNNING);
        jobRunRepository.save(jobRun);

        AtomicInteger processed = new AtomicInteger(0);
        try {
            if (simulateFailure) {
                Thread.sleep(32_000);
                throw new RuntimeException("Simulovaný timeout: pipeline běžela příliš dlouho (>30s)");
            }

            final Long runId = jobRun.getId();
            ExecutorService executor = Executors.newSingleThreadExecutor();
            Future<?> future = executor.submit(() -> {
                // ── EXTRACT ──────────────────────────────────────────────────
                JobRunStep extractStep = startStep(runId, "EXTRACT");
                List<DungeonRun> runs;
                try {
                    runs = mongoTemplate.findAll(DungeonRun.class, collectionName);
                    finishStep(extractStep, JobRun.Status.SUCCESS, runs.size(), null);
                } catch (Exception e) {
                    finishStep(extractStep, JobRun.Status.FAILED, 0, e.getMessage());
                    throw new RuntimeException("EXTRACT failed: " + e.getMessage(), e);
                }

                // ── TRANSFORM ────────────────────────────────────────────────
                JobRunStep transformStep = startStep(runId, "TRANSFORM");
                int transformCount = 0;
                try {
                    for (DungeonRun run : runs) {
                        if (Thread.currentThread().isInterrupted()) break;
                        updateStats(run);
                        transformCount++;
                    }
                    finishStep(transformStep, JobRun.Status.SUCCESS, transformCount, null);
                } catch (Exception e) {
                    finishStep(transformStep, JobRun.Status.FAILED, transformCount, e.getMessage());
                    throw new RuntimeException("TRANSFORM failed: " + e.getMessage(), e);
                }

                // ── LOAD ─────────────────────────────────────────────────────
                JobRunStep loadStep = startStep(runId, "LOAD");
                int loadCount = 0;
                try {
                    for (DungeonRun run : runs) {
                        if (Thread.currentThread().isInterrupted()) break;
                        ProcessedDungeonRun pr = new ProcessedDungeonRun();
                        copyProperties(run, pr);
                        processedRepository.save(pr);
                        mongoTemplate.remove(run, collectionName);
                        loadCount++;
                        processed.incrementAndGet();
                    }
                    finishStep(loadStep, JobRun.Status.SUCCESS, loadCount, null);
                } catch (Exception e) {
                    finishStep(loadStep, JobRun.Status.FAILED, loadCount, e.getMessage());
                    throw new RuntimeException("LOAD failed: " + e.getMessage(), e);
                }
            });

            try {
                future.get(timeoutMinutes, TimeUnit.MINUTES);
            } catch (TimeoutException e) {
                future.cancel(true);
                throw new RuntimeException("Pipeline překročila časový limit " + timeoutMinutes + " minut");
            } catch (ExecutionException e) {
                Throwable cause = e.getCause();
                throw cause instanceof RuntimeException ? (RuntimeException) cause : new RuntimeException(cause);
            } finally {
                executor.shutdownNow();
            }

            jobRun.setStatus(JobRun.Status.SUCCESS);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            jobRun.setStatus(JobRun.Status.FAILED);
            jobRun.setErrorMessage("Přerušeno");
        } catch (Exception e) {
            jobRun.setStatus(JobRun.Status.FAILED);
            jobRun.setErrorMessage(e.getMessage());
        } finally {
            jobRun.setRecordsProcessed(processed.get());
            jobRun.setFinishedAt(LocalDateTime.now());
            jobRun.setDurationSeconds(Duration.between(jobRun.getStartedAt(), jobRun.getFinishedAt()).getSeconds());
            jobRunRepository.save(jobRun);
        }

        if (jobRun.getStatus() == JobRun.Status.FAILED) {
            AlertMode mode = alertRuleRepository.findByPipelineId(pipelineId)
                    .map(AlertRule::getAlertMode)
                    .orElse(AlertMode.CONSECUTIVE_FAIL_EMAIL);

            boolean isTimeout = jobRun.getErrorMessage() != null &&
                    (jobRun.getErrorMessage().contains("časový limit") || jobRun.getErrorMessage().contains("Simulovaný timeout"));

            boolean shouldCreateAlert = switch (mode) {
                case NO_ALERTS -> false;
                case EXCLUDE_TIMEOUT_FAILURES -> !isTimeout;
                case CONSECUTIVE_FAIL_EMAIL -> true;
            };

            if (shouldCreateAlert) {
                AlertEvent.Severity severity = simulateFailure ? AlertEvent.Severity.CRITICAL : AlertEvent.Severity.WARNING;
                alertEventRepository.save(new AlertEvent(pipelineId, jobRun.getId(),
                        "Run #" + jobRun.getId() + " selhal: " + jobRun.getErrorMessage(), severity));
            }
        }

        return jobRun;
    }

    // Runs the pipeline once; on failure waits 30s and retries exactly once; emails if retry also fails
    private void executeWithRetry(boolean simulateFailure, Long pipelineId) {
        JobRun first = performRun(simulateFailure, pipelineId);
        if (first.getStatus() != JobRun.Status.FAILED) return;

        try {
            Thread.sleep(30_000);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            return;
        }

        JobRun retry = performRun(simulateFailure, pipelineId);
        if (retry.getStatus() == JobRun.Status.FAILED) {
            AlertMode mode = alertRuleRepository.findByPipelineId(pipelineId)
                    .map(AlertRule::getAlertMode)
                    .orElse(AlertMode.CONSECUTIVE_FAIL_EMAIL);

            boolean isTimeout = retry.getErrorMessage() != null &&
                    (retry.getErrorMessage().contains("časový limit") || retry.getErrorMessage().contains("Simulovaný timeout"));

            boolean shouldEmail = switch (mode) {
                case NO_ALERTS -> false;
                case EXCLUDE_TIMEOUT_FAILURES -> !isTimeout;
                case CONSECUTIVE_FAIL_EMAIL -> true;
            };

            if (shouldEmail) {
                emailService.sendConsecutiveFailureAlert(retry);
            }
        }
    }

    @Scheduled(cron = "0 0 2 * * *")
    public void aggregateData() {
        Long pipelineId = pipelineRepository.findFirstByActiveTrue()
                .map(Pipeline::getId).orElse(null);
        executeWithRetry(false, pipelineId);
    }

    @Async
    public void aggregateDataAsync(Long pipelineId) {
        executeWithRetry(false, pipelineId);
    }

    @Async
    public void aggregateDataTestFail(Long pipelineId) {
        executeWithRetry(true, pipelineId);
    }

    private void copyProperties(DungeonRun source, DungeonRun target) {
        target.setRunId(source.getRunId());
        target.setTimestamp(source.getTimestamp());
        target.setDate(source.getDate());
        target.setDungeonName(source.getDungeonName());
        target.setPlayerClass(source.getPlayerClass());
        target.setIlvl(source.getIlvl());
        target.setFullRunTime(source.getFullRunTime());
        target.setDeathCount(source.getDeathCount());
        target.setEnemiesKilled(source.getEnemiesKilled());
        target.setBossKillTime(source.getBossKillTime());
        target.setLootQuality(source.getLootQuality());
        target.setDamageDealt(source.getDamageDealt());
        target.setDamageTaken(source.getDamageTaken());
        target.setPotionsUsed(source.getPotionsUsed());
        target.setGoldCollected(source.getGoldCollected());
        target.setFinalBossKilled(source.isFinalBossKilled());
    }

    private void updateStats(DungeonRun run) {
        DungeonStats stats = statsRepository.findByDungeonNameAndPlayerClassAndDate(
                run.getDungeonName(), run.getPlayerClass(), run.getDate())
                .orElseGet(() -> new DungeonStats(null, run.getDungeonName(), run.getPlayerClass(), run.getDate(),
                        0, 0, 0, 0, 0, LocalDateTime.now()));

        stats.setTotalRuns(stats.getTotalRuns() + 1);
        stats.setTotalTime(stats.getTotalTime() + run.getFullRunTime());
        stats.setTotalDeaths(stats.getTotalDeaths() + run.getDeathCount());
        stats.setTotalItemLevel(stats.getTotalItemLevel() + run.getIlvl());
        if (run.isFinalBossKilled()) stats.setSuccessCount(stats.getSuccessCount() + 1);
        stats.setLastUpdated(LocalDateTime.now());
        statsRepository.save(stats);
    }
}
