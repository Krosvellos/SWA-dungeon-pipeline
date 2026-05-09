# Dungeon Dashboard – Big Data Pipeline Monitor

Projekt MSWA. Simulace orchestrace a monitoringu datových pipeline na téma fantasy dungeon runů z World of Warcraft.

---

## Struktura projektu

```
.
├── dungeonBackend/          # Spring Boot backend (Java)
├── dungeon-frontend/        # Next.js frontend (TypeScript)
├── postgresdb/              # Lokální PostgreSQL server (Postgres.app)
├── simulateRuns.py          # Generátor syntetických dat
├── *DungeonEndInput.json    # Ukázkové vstupy pro ruční testování API
└── dungeonStatistics.json   # Ukázkový export statistik
```

---

## Jak data vznikají

Skript `simulateRuns.py` generuje syntetická data dungeon runů a posílá je jednotlivě přes REST API na backend (`POST /api/dungeon/run`).

Každý run obsahuje: dungeon, třídu postavy, item level, čas běhu, počet smrtí, damage, loot atd.

Simulátor modeluje realistické chování:
- **3 dungeony** s různými rozsahy obtížnosti (`gnollDungeon`, `dragonDungeon`, `cathedralDungeon`)
- **9 tříd postav**, každá s vlastním profilem (rychlost, damage, tendence k smrtím)
- **Postupný růst item levelu** v čase (hráči se vybavují)
- **Víkendový provoz** generuje 1 500–2 000 runů/den, všední dny 600–1 300

---

## Uložení a zpracování dat

### Dataset = MongoDB kolekce

Název datasetu v PostgreSQL přímo odpovídá názvu kolekce v MongoDB. Při vytvoření datasetu (přes frontend nebo při startu backendu) se automaticky vytvoří odpovídající MongoDB kolekce. Pipeline pak agreguje data právě z té kolekce, na kterou její dataset odkazuje.

Příklad: dataset `dungeon_runs` → pipeline čte z MongoDB kolekce `dungeon_runs`.

### MongoDB – raw data

Každý příchozí dungeon run se uloží jako samostatný dokument do MongoDB kolekce odpovídající datasetu (`dungeon_runs` ve výchozím nastavení). Tato data jsou nezpracovaná a čekají na pipeline.

### Pipeline – zpracování do PostgreSQL (ETL)

Každý běh pipeline prochází třemi fázemi sledovanými jako samostatné `JobRunStep` záznamy v PostgreSQL:

**EXTRACT** — načte všechny dokumenty z příslušné MongoDB kolekce do paměti (`mongoTemplate.findAll`). Zaznamená počet načtených dokumentů.

**TRANSFORM** — projde každý načtený run a aktualizuje agregovaný řádek v tabulce `dungeon_stats` (klíčovaný kombinací `dungeonName + playerClass + date`). Pokud řádek pro danou kombinaci ještě neexistuje, vytvoří ho. Inkrementálně připočítává `totalRuns`, `totalTime`, `totalDeaths`, `totalItemLevel` a `successCount`.

**LOAD** — pro každý zpracovaný run vytvoří kopii v MongoDB kolekci `processed_runs` (auditní stopa) a původní dokument z produkční kolekce smaže. Tím je zajištěno, že příští spuštění pipeline nezpracuje stejná data znovu.

Průběh každé fáze (status, čas zahájení/ukončení, počet zpracovaných záznamů, případná chybová zpráva) je viditelný v záložce **Běhy → detail jobu**.

Agregace probíhá automaticky každý den ve **2:00** (cron `0 0 2 * * *`). Pipeline má retry logiku – při selhání se po 30 s pokusí znovu. Chování při selhání řídí konfigurovatelné **alert rule** přiřazené každé pipeline:

| Režim | Chování |
|---|---|
| `CONSECUTIVE_FAIL_EMAIL` | E-mail po dvou po sobě jdoucích selháních |
| `NO_ALERTS` | Žádné alerty ani e-maily |
| `EXCLUDE_TIMEOUT_FAILURES` | Alerty pouze při reálných chybách, timeouty ignorovány |

**Dvě databáze:**

| Databáze | Obsah |
|---|---|
| MongoDB (port 27017) | Raw dungeon runy (per dataset kolekce), processed runy |
| PostgreSQL (port 5432) | Statistiky, pipeline, datasety, job runy, alert rules, alerty |

---

## Frontend

Next.js aplikace dostupná na `http://localhost:3000`.

**Záložky:**

| Záložka | Co umí |
|---|---|
| Přehled | Souhrnné metriky: počty datasetů, pipeline, běhů, alertů |
| Pipeline | Seznam pipeline – spuštění, aktivace/deaktivace, nastavení alert rules, detail s historií běhů |
| Datasety | Správa datasetů (CRUD) |
| Alerty | Přehled alert eventů, možnost vyřešit (resolve) |
| Běhy | Kompletní historie job runů s filtry (pipeline, status, datum) |
| Statistiky | Zpracovaná data z PostgreSQL – weekly/monthly/yearly přehledy per dungeon a per třída |

Mimo cron job lze pipeline spustit ručně tlačítkem **Spustit agregaci** na záložce Pipeline. Dashboard se při běžícím jobu aktualizuje každé 3 sekundy.

---

## Spuštění

### Backend
```bash
cd dungeonBackend
./mvnw spring-boot:run
```
Běží na `http://localhost:8080`. Při startu `DataSeeder` automaticky vytvoří výchozí dataset `dungeon_runs` v PostgreSQL a odpovídající kolekci v MongoDB, pokud ještě neexistují. To samé platí pro všechny další datasety — kolekce se vždy synchronizuje se stavem PostgreSQL.

### Frontend
```bash
cd dungeon-frontend
npm install
npm run dev
```
Běží na `http://localhost:3000`.

### Generování dat
```bash
python3 simulateRuns.py
```
Skript pošle tisíce dungeon runů do backendu. Poté je lze zpracovat spuštěním pipeline z frontendu.

**Charakteristika datasetu:**

Simulované období: `2026-01-01` → `2026-04-15` (105 dní celkem).

- **3 dungeony** s různými rozsahy obtížnosti: `gnollDungeon`, `dragonDungeon`, `cathedralDungeon`
- **9 tříd postav**, každá s vlastním profilem (rychlost, damage, tendence k smrtím)
- **Postupný růst item levelu** o +13 bodů napříč celým obdobím
- **Víkendový provoz** 1 500–2 000 runů/den, všední dny 600–1 300

**Balance patche** — periodické změny silové hierarchie tříd viditelné v datech:

| Patch | Datum | Hlavní změny |
|---|---|---|
| Patch 1.1 | 2026-01-22 | Warrior a Monk posíleni, Rogue a Priest oslabeni |
| Patch 1.2 | 2026-02-12 | Warrior oslaben, Monk / Hunter / Warlock / Paladin posíleni |
| Patch 1.2.1 | 2026-02-19 | Hotfix: Monk nerfnut, Druid a Shaman konečně posíleni, Rogue částečně obnoven |
| Patch 1.3 | 2026-03-05 | Priest a Warrior redemption arc, Rogue dokončen, meta se stabilizuje |
| Season 2 | 2026-03-20 | Nová sezona: výrazné navýšení obtížnosti across all dungeons, win rate všech tříd klesá o 22–35 %, death count roste o 2–4 na run |

Prvních 3 dní po každém patchi mají všechny třídy zvýšený počet smrtí — hráči si zvykají na změněné mechaniky.

### Požadavky
- Java 21+
- Node.js 18+
- Python 3.9+
- MongoDB běžící na `localhost:27017`
- PostgreSQL běžící na `localhost:5432` (uživatel/heslo `postgres/postgres`)

### Inicializace databází

**PostgreSQL** — databázi je nutné vytvořit jednou ručně:
```sql
CREATE DATABASE dungeondb;
```
Tabulky (`pipelines`, `job_runs`, `alert_rules`, atd.) Hibernate vytvoří automaticky při prvním startu backendu (`spring.jpa.hibernate.ddl-auto=update`). Výchozí dataset a pipeline se také vytvoří automaticky přes `DataSeeder`.

**MongoDB** — žádná příprava není potřeba. Databáze `dungeondb` vznikne automaticky při prvním zápisu. Kolekce pro jednotlivé datasety vytváří backend sám při startu (přes `DataSeeder`) nebo při vytvoření nového datasetu z frontendu.
