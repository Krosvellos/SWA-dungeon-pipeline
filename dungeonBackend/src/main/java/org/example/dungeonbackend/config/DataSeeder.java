package org.example.dungeonbackend.config;

import org.example.dungeonbackend.model.Dataset;
import org.example.dungeonbackend.model.Pipeline;
import org.example.dungeonbackend.repository.DatasetRepository;
import org.example.dungeonbackend.repository.PipelineRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataSeeder implements CommandLineRunner {

    private final DatasetRepository datasetRepository;
    private final PipelineRepository pipelineRepository;
    private final MongoTemplate mongoTemplate;

    public DataSeeder(DatasetRepository datasetRepository, PipelineRepository pipelineRepository, MongoTemplate mongoTemplate) {
        this.datasetRepository = datasetRepository;
        this.pipelineRepository = pipelineRepository;
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void run(String... args) {
        if (datasetRepository.count() == 0) {
            Dataset ds = new Dataset(
                    "dungeon_runs",
                    "Raw dungeon run data collected from all active dungeons",
                    "analytics-team",
                    "1.0"
            );
            ds.setCreatedAt(LocalDateTime.now());
            datasetRepository.save(ds);
            System.out.println("[DataSeeder] Created default dataset: dungeon_runs");
        }

        datasetRepository.findAll().forEach(ds -> {
            if (!mongoTemplate.collectionExists(ds.getName())) {
                mongoTemplate.createCollection(ds.getName());
                System.out.println("[DataSeeder] Created MongoDB collection: " + ds.getName());
            }
        });

        if (pipelineRepository.count() == 0) {
            Long datasetId = datasetRepository.findByName("dungeon_runs")
                    .map(Dataset::getId).orElse(1L);

            Pipeline p = new Pipeline();
            p.setName("daily-aggregation");
            p.setDescription("Aggregates raw dungeon run data from MongoDB into PostgreSQL statistics");
            p.setDatasetId(datasetId);
            p.setSchedule("0 0 2 * * *");
            p.setActive(true);
            p.setCreatedAt(LocalDateTime.now());
            pipelineRepository.save(p);
            System.out.println("[DataSeeder] Created default pipeline: daily-aggregation");
        }
    }
}
