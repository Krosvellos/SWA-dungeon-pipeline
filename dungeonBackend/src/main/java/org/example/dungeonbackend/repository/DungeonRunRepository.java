package org.example.dungeonbackend.repository;

import org.example.dungeonbackend.model.DungeonRun;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DungeonRunRepository extends MongoRepository<DungeonRun, String> {
}
