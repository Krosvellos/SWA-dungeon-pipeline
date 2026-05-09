package org.example.dungeonbackend.repository;

import org.example.dungeonbackend.model.ProcessedDungeonRun;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProcessedDungeonRunRepository extends MongoRepository<ProcessedDungeonRun, String> {
}
