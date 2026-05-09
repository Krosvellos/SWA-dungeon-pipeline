package org.example.dungeonbackend.model;

import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "processed_runs")
public class ProcessedDungeonRun extends DungeonRun {
}
