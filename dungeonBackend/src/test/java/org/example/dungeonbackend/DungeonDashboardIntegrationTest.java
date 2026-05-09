package org.example.dungeonbackend;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.dungeonbackend.model.DungeonRun;
import org.example.dungeonbackend.repository.DungeonRunRepository;
import org.example.dungeonbackend.repository.ProcessedDungeonRunRepository;
import org.example.dungeonbackend.service.DungeonService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class DungeonDashboardIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private DungeonService dungeonService;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DungeonRunRepository dungeonRunRepository;
    @MockBean
    private ProcessedDungeonRunRepository processedRepository;

    @BeforeEach
    public void setup() {
        Mockito.when(dungeonRunRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        Mockito.when(processedRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
    }

    @Test
    public void testFullPipelineAndDashboard() throws Exception {
        String date = "2026-03-14";

        DungeonRun run1 = new DungeonRun();
        run1.setRunId("cathedral-2026-03-14-0001");
        run1.setTimestamp("2026-03-14T18:42:11Z");
        run1.setDate(date);
        run1.setDungeonName("cathedralDungeon");
        run1.setPlayerClass("Rogue");
        run1.setIlvl(612);
        run1.setFullRunTime(23.44);
        run1.setDeathCount(3);
        run1.setFinalBossKilled(true);

        Mockito.when(dungeonRunRepository.findAll()).thenReturn(Collections.singletonList(run1));

        mockMvc.perform(post("/api/dungeon/run")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(run1)))
                .andExpect(status().isOk());

        dungeonService.aggregateData();

        mockMvc.perform(get("/api/dungeon/dashboard")
                .param("date", date))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.date").value(date))
                .andExpect(jsonPath("$.yearly.cathedralDungeon.totalRuns").value(1))
                .andExpect(jsonPath("$.yearly.cathedralDungeon.overall.averageTime").value(23.4))
                .andExpect(jsonPath("$.yearly.cathedralDungeon.byClass.Rogue.runCount").value(1));
    }
}
