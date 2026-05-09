import json
import random
from datetime import datetime, timedelta
from urllib import request, error


API_URL = "http://localhost:8080/api/dungeon/run"

# Date window — full range used for ilvl progression and patch calculations
START_DATE = "2026-01-01"
END_DATE = "2026-04-15"

# Only actually POST data from this date onward (existing data already in MongoDB)
GENERATE_FROM = "2026-03-16"

# Per selected day:
# weekdays should be closer to the lower range,
# weekends should be closer to the upper range.
WEEKDAY_RUN_RANGE = (600, 1300)
WEEKEND_RUN_RANGE = (1500, 2000)

# Most runs should happen between these hours
PEAK_START_HOUR = 9
PEAK_END_HOUR = 22
OFF_PEAK_CHANCE = 0.15

# How much ilvl should rise from start to end of the whole period
TOTAL_ILVL_GROWTH = 13

# Optional reproducibility
RANDOM_SEED = None  # e.g. 42

# ── Balance patches ───────────────────────────────────────────────────────────
# Each patch applies additive deltas on top of CLASS_PROFILES from its date onward.
# Patches are cumulative — patch 2 stacks on top of patch 1.
PATCHES = [
    {
        "date": "2026-01-22",
        "label": "Patch 1.1",
        "class_deltas": {
            "Warrior": {"damage_factor": +0.08, "speed_factor": +0.05, "death_bias": -1},
            "Rogue":   {"damage_factor": -0.10, "speed_factor": -0.06},
            "Priest":  {"damage_factor": -0.05, "death_bias": +1},
            "Monk":    {"damage_factor": +0.04, "speed_factor": +0.04},
        },
    },
    {
        "date": "2026-02-12",
        "label": "Patch 1.2",
        "class_deltas": {
            "Warrior": {"damage_factor": -0.06, "speed_factor": -0.04},
            "Monk":    {"speed_factor": +0.08, "damage_factor": +0.05},
            "Hunter":  {"damage_factor": +0.06, "speed_factor": +0.04, "death_bias": -1},
            "Warlock": {"damage_factor": +0.07, "speed_factor": +0.05},
            "Paladin": {"damage_factor": +0.05, "damage_taken_factor": -0.05},
        },
    },
    {
        "date": "2026-02-19",
        "label": "Patch 1.2.1",
        # Hotfix týden po 1.2 — Monk byl příliš silný, Druid a Shaman dlouho ignorováni, Rogue částečně obnoven
        "class_deltas": {
            "Monk":   {"speed_factor": -0.05},
            "Druid":  {"damage_factor": +0.07, "speed_factor": +0.05},
            "Shaman": {"damage_factor": +0.04, "speed_factor": +0.04},
            "Rogue":  {"damage_factor": +0.05, "speed_factor": +0.03},
        },
    },
    {
        "date": "2026-03-05",
        "label": "Patch 1.3",
        # Velký balancovací patch před Season 2 — Priest a Warrior redemption, meta se stabilizuje
        "class_deltas": {
            "Priest":  {"damage_factor": +0.09, "death_bias": -2},
            "Warrior": {"damage_factor": +0.05, "death_bias": -1},
            "Rogue":   {"speed_factor": +0.04},
            "Paladin": {"speed_factor": +0.05},
            "Warlock": {"damage_taken_factor": -0.04},
        },
    },
    {
        "date": "2026-03-20",
        "label": "Patch 2.0 — Season 2",
        # Zahájení Season 2 — drasticky obtížnější dungeony, všechny třídy mají nižší winrate.
        # Hráči se učí nové mechaniky, death count roste, boss enrage timery zkráceny.
        "class_deltas": {
            "Warrior":    {"success_factor": -0.30, "death_bias": +3, "damage_taken_factor": +0.15},
            "Paladin":    {"success_factor": -0.25, "death_bias": +2, "damage_taken_factor": +0.10},
            "Rogue":      {"success_factor": -0.32, "death_bias": +2, "speed_factor": -0.08},
            "Priest":     {"success_factor": -0.35, "death_bias": +4, "damage_factor": -0.08},
            "Monk":       {"success_factor": -0.22, "death_bias": +2},
            "Hunter":     {"success_factor": -0.28, "death_bias": +2, "speed_factor": -0.06},
            "Druid":      {"success_factor": -0.26, "death_bias": +2, "damage_taken_factor": +0.08},
            "Shaman":     {"success_factor": -0.30, "death_bias": +3},
            "Warlock":    {"success_factor": -0.24, "death_bias": +2, "damage_taken_factor": +0.06},
        },
    },
]

# For this many days after each patch, all classes get extra deaths (chaos from changed mechanics)
PATCH_DEATH_SPIKE_DAYS = 3
PATCH_DEATH_SPIKE_BIAS = 2

CLASSES = [
    "Warrior",
    "Paladin",
    "Rogue",
    "Priest",
    "Monk",
    "Hunter",
    "Druid",
    "Shaman",
    "Warlock",
]

DUNGEONS = {
    "gnollDungeon": {
        "prefix": "gnoll",
        "ilvl_range": (590, 608),
        "fullRunTime_range": (16.5, 24.5),
        "deathCount_range": (2, 7),
        "enemiesKilled_range": (85, 110),
        "bossKillTime_range": (2.4, 3.8),
        "damageDealt_range": (14500, 18500),
        "damageTaken_range": (6200, 9000),
        "potionsUsed_range": (0, 3),
        "goldCollected_range": (230, 320),
    },
    "dragonDungeon": {
        "prefix": "dragon",
        "ilvl_range": (598, 618),
        "fullRunTime_range": (27.0, 36.5),
        "deathCount_range": (1, 5),
        "enemiesKilled_range": (130, 160),
        "bossKillTime_range": (4.2, 5.8),
        "damageDealt_range": (20000, 24500),
        "damageTaken_range": (7600, 9800),
        "potionsUsed_range": (1, 4),
        "goldCollected_range": (360, 470),
    },
    "cathedralDungeon": {
        "prefix": "cathedral",
        "ilvl_range": (600, 620),
        "fullRunTime_range": (21.0, 28.5),
        "deathCount_range": (1, 6),
        "enemiesKilled_range": (105, 132),
        "bossKillTime_range": (2.8, 4.0),
        "damageDealt_range": (17000, 21000),
        "damageTaken_range": (6000, 8600),
        "potionsUsed_range": (0, 3),
        "goldCollected_range": (290, 390),
    },
}

LOOT_QUALITY_WEIGHTS = [
    ("Common", 0.35),
    ("Rare", 0.40),
    ("Epic", 0.22),
    ("Legendary", 0.03),
]

CLASS_PROFILES = {
    "Warrior": {"speed_factor": 0.95, "damage_factor": 0.98, "damage_taken_factor": 1.14, "death_bias": 2, "potions_factor": 1.10, "success_factor": 1.0},
    "Paladin": {"speed_factor": 0.88, "damage_factor": 0.90, "damage_taken_factor": 1.00, "death_bias": 0, "potions_factor": 0.95, "success_factor": 1.0},
    "Rogue":   {"speed_factor": 1.18, "damage_factor": 1.12, "damage_taken_factor": 0.88, "death_bias": -1, "potions_factor": 0.90, "success_factor": 1.0},
    "Priest":  {"speed_factor": 0.84, "damage_factor": 0.80, "damage_taken_factor": 0.94, "death_bias": 0, "potions_factor": 1.05, "success_factor": 1.0},
    "Monk":    {"speed_factor": 1.08, "damage_factor": 1.04, "damage_taken_factor": 0.93, "death_bias": 0, "potions_factor": 0.95, "success_factor": 1.0},
    "Hunter":  {"speed_factor": 1.10, "damage_factor": 1.08, "damage_taken_factor": 0.86, "death_bias": -1, "potions_factor": 0.90, "success_factor": 1.0},
    "Druid":   {"speed_factor": 0.99, "damage_factor": 0.96, "damage_taken_factor": 0.95, "death_bias": 0, "potions_factor": 0.95, "success_factor": 1.0},
    "Shaman":  {"speed_factor": 1.00, "damage_factor": 1.00, "damage_taken_factor": 0.94, "death_bias": 0, "potions_factor": 1.00, "success_factor": 1.0},
    "Warlock": {"speed_factor": 1.03, "damage_factor": 1.06, "damage_taken_factor": 0.91, "death_bias": -1, "potions_factor": 0.90, "success_factor": 1.0},
}


def get_active_profile(class_name, run_dt):
    """Returns CLASS_PROFILES with all applicable patch deltas applied."""
    profile = dict(CLASS_PROFILES[class_name])
    for patch in PATCHES:
        if run_dt.date() >= parse_date(patch["date"]).date():
            for key, delta in patch["class_deltas"].get(class_name, {}).items():
                profile[key] = profile[key] + delta
    return profile


def get_patch_death_spike(run_dt):
    """Returns extra death bias for the first few days after any patch."""
    for patch in PATCHES:
        patch_dt = parse_date(patch["date"])
        days_since = (run_dt.date() - patch_dt.date()).days
        if 0 <= days_since < PATCH_DEATH_SPIKE_DAYS:
            return PATCH_DEATH_SPIKE_BIAS
    return 0


def get_active_patch_label(run_dt):
    """Returns the label of the most recent active patch, or None."""
    label = None
    for patch in PATCHES:
        if run_dt.date() >= parse_date(patch["date"]).date():
            label = patch["label"]
    return label


def weighted_choice(weighted_items):
    r = random.random()
    cumulative = 0.0
    for item, weight in weighted_items:
        cumulative += weight
        if r <= cumulative:
            return item
    return weighted_items[-1][0]


def clamp(value, low, high):
    return max(low, min(high, value))


def round2(value):
    return round(value, 2)


def parse_date(date_str: str) -> datetime:
    return datetime.strptime(date_str, "%Y-%m-%d")


def daterange(start_date: datetime, end_date: datetime):
    current = start_date
    while current <= end_date:
        yield current
        current += timedelta(days=1)


def is_weekend(dt: datetime) -> bool:
    return dt.weekday() >= 5


def pick_run_count_for_day(dt: datetime) -> int:
    if is_weekend(dt):
        return random.randint(*WEEKEND_RUN_RANGE)
    return random.randint(*WEEKDAY_RUN_RANGE)


def random_timestamp_for_day(day_dt: datetime) -> datetime:
    if random.random() < OFF_PEAK_CHANCE:
        if random.random() < 0.5:
            hour = random.randint(0, 8)
        else:
            hour = random.randint(22, 23)
    else:
        hour = random.randint(PEAK_START_HOUR, PEAK_END_HOUR)

    minute = random.randint(0, 59)
    second = random.randint(0, 59)
    return day_dt.replace(hour=hour, minute=minute, second=second)


def to_utc_z(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def calculate_ilvl_factor(ilvl: int, dungeon_cfg: dict) -> float:
    low, high = dungeon_cfg["ilvl_range"]
    span = max(1, high - low)
    return (ilvl - low) / span


def calculate_time_progress(run_dt: datetime, start_dt: datetime, end_dt: datetime) -> float:
    total_seconds = max(1.0, (end_dt - start_dt).total_seconds())
    current_seconds = (run_dt - start_dt).total_seconds()
    return clamp(current_seconds / total_seconds, 0.0, 1.0)


def generate_progressive_ilvl(run_dt: datetime, dungeon_cfg: dict, start_dt: datetime, end_dt: datetime) -> int:
    base_low, base_high = dungeon_cfg["ilvl_range"]
    progress = calculate_time_progress(run_dt, start_dt, end_dt)

    # Shift the whole ilvl window upward over time.
    ilvl_shift = round(progress * TOTAL_ILVL_GROWTH)

    # Keep some spread within the shifted window.
    shifted_low = base_low + ilvl_shift
    shifted_high = base_high + ilvl_shift

    return random.randint(shifted_low, shifted_high)


def build_run(run_dt: datetime, daily_counters: dict, start_dt: datetime, end_dt: datetime) -> dict:
    dungeon_name = random.choice(list(DUNGEONS.keys()))
    dungeon_cfg = DUNGEONS[dungeon_name]

    class_name = random.choice(CLASSES)
    profile = get_active_profile(class_name, run_dt)

    prefix = dungeon_cfg["prefix"]
    daily_counters[prefix] = daily_counters.get(prefix, 0) + 1
    sequence = daily_counters[prefix]

    ilvl = generate_progressive_ilvl(run_dt, dungeon_cfg, start_dt, end_dt)
    ilvl_factor = calculate_ilvl_factor(ilvl, {
        "ilvl_range": (
            dungeon_cfg["ilvl_range"][0],
            dungeon_cfg["ilvl_range"][1] + TOTAL_ILVL_GROWTH
        )
    })

    base_run_time = random.uniform(*dungeon_cfg["fullRunTime_range"])
    base_boss_time = random.uniform(*dungeon_cfg["bossKillTime_range"])
    base_deaths = random.randint(*dungeon_cfg["deathCount_range"])
    enemies_killed = random.randint(*dungeon_cfg["enemiesKilled_range"])
    base_damage = random.randint(*dungeon_cfg["damageDealt_range"])
    base_damage_taken = random.randint(*dungeon_cfg["damageTaken_range"])
    base_potions = random.randint(*dungeon_cfg["potionsUsed_range"])
    gold_collected = random.randint(*dungeon_cfg["goldCollected_range"])
    loot_quality = weighted_choice(LOOT_QUALITY_WEIGHTS)

    damage_ilvl_multiplier = 1.0 + (ilvl_factor * 0.18)
    speed_ilvl_divisor = 1.0 + (ilvl_factor * 0.14)
    death_ilvl_reduction = round(ilvl_factor * 2)

    damage_dealt = int(base_damage * profile["damage_factor"] * damage_ilvl_multiplier)
    damage_taken = int(base_damage_taken * profile["damage_taken_factor"] * (1.0 - ilvl_factor * 0.08))

    full_run_time = base_run_time / speed_ilvl_divisor / profile["speed_factor"]
    boss_kill_time = base_boss_time / (1.0 + ilvl_factor * 0.12) / profile["speed_factor"]

    death_count = (
        base_deaths
        + profile["death_bias"]
        + get_patch_death_spike(run_dt)
        - death_ilvl_reduction
        + random.choice([-1, 0, 0, 1])
    )
    death_count = clamp(death_count, 0, 12)

    potions_used = int(round(base_potions * profile["potions_factor"]))
    potions_used = clamp(potions_used, 0, 6)

    base_success_rate = 0.92 * clamp(profile["success_factor"], 0.0, 1.0)
    final_boss_killed = random.random() < base_success_rate

    if not final_boss_killed:
        full_run_time *= random.uniform(0.55, 0.85)
        boss_kill_time *= random.uniform(0.60, 0.95)
        gold_collected = int(gold_collected * random.uniform(0.45, 0.80))
        loot_quality = random.choice(["Common", "Rare"])

    return {
        "runId": f"{prefix}-{run_dt.strftime('%Y-%m-%d')}-{sequence:04d}",
        "timestamp": to_utc_z(run_dt),
        "date": run_dt.strftime("%Y-%m-%d"),
        "dungeonName": dungeon_name,
        "class": class_name,
        "ilvl": ilvl,
        "fullRunTime": round2(full_run_time),
        "deathCount": death_count,
        "enemiesKilled": enemies_killed,
        "bossKillTime": round2(boss_kill_time),
        "lootQuality": loot_quality,
        "damageDealt": damage_dealt,
        "damageTaken": damage_taken,
        "potionsUsed": potions_used,
        "goldCollected": gold_collected,
        "finalBossKilled": final_boss_killed,
    }


def post_json(url: str, payload: dict):
    data = json.dumps(payload).encode("utf-8")
    req = request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=10) as response:
            status = response.status
            body = response.read().decode("utf-8", errors="replace")
            return status, body
    except error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        return e.code, body
    except Exception as e:
        return None, str(e)


def generate_runs_for_day(day_dt: datetime, run_count: int, start_dt: datetime, end_dt: datetime):
    timestamps = [random_timestamp_for_day(day_dt) for _ in range(run_count)]
    timestamps.sort()

    daily_counters = {}
    return [build_run(run_dt, daily_counters, start_dt, end_dt) for run_dt in timestamps]


def pick_dates(start_date_str: str, end_date_str: str):
    start_dt = parse_date(start_date_str)
    end_dt = parse_date(end_date_str)
    return list(daterange(start_dt, end_dt)), start_dt, end_dt


def main():
    if RANDOM_SEED is not None:
        random.seed(RANDOM_SEED)

    selected_dates, start_dt, end_dt = pick_dates(START_DATE, END_DATE)

    grand_total = 0
    grand_success = 0
    grand_failed = 0

    total_days = len(selected_dates)
    generate_from_dt = parse_date(GENERATE_FROM)
    print(f"Full date range: {START_DATE} → {END_DATE} ({total_days} days)")
    print(f"Generating from: {GENERATE_FROM} (skipping already-inserted days)")
    print(f"Posting to {API_URL}")
    print(f"Total ilvl growth over full period: +{TOTAL_ILVL_GROWTH}")
    print(f"Balance patches: {[p['label'] + ' @ ' + p['date'] for p in PATCHES]}")
    print()

    for day_index, day_dt in enumerate(selected_dates, start=1):
        if day_dt < generate_from_dt:
            continue
        run_count = pick_run_count_for_day(day_dt)
        runs = generate_runs_for_day(day_dt, run_count, start_dt, end_dt)

        day_success = 0
        day_failed = 0
        day_ilvls = [r["ilvl"] for r in runs]

        patch_label = get_active_patch_label(day_dt)
        patch_info = f"patch={patch_label}" if patch_label else "patch=base"
        spike_info = "*SPIKE*" if get_patch_death_spike(day_dt) > 0 else ""

        print("=" * 110)
        print(
            f"DAY {day_index:03d}/{total_days} | "
            f"date={day_dt.strftime('%Y-%m-%d')} | "
            f"weekend={'yes' if is_weekend(day_dt) else 'no'} | "
            f"planned_calls={run_count} | "
            f"avg_ilvl={round(sum(day_ilvls) / len(day_ilvls), 2)} | "
            f"{patch_info} {spike_info}"
        )
        print("=" * 110)

        for idx, run in enumerate(runs, start=1):
            status, body = post_json(API_URL, run)
            ok = status is not None and 200 <= status < 300

            if ok:
                day_success += 1
                grand_success += 1
            else:
                day_failed += 1
                grand_failed += 1

            print(
                f"[{'OK' if ok else 'ERR'}] "
                f"day={day_index:03d} item={idx:04d}/{run_count} | "
                f"{run['runId']} | {run['timestamp']} | {run['class']} | {run['dungeonName']} | "
                f"ilvl={run['ilvl']} | time={run['fullRunTime']} | deaths={run['deathCount']} | "
                f"dmg={run['damageDealt']} | status={status}"
            )

            if not ok:
                print("Response/Error:", body)
                print("Payload:", json.dumps(run, ensure_ascii=False))
                print()

        grand_total += run_count

        print()
        print(
            f"DAY {day_index:03d} FINISHED | "
            f"date={day_dt.strftime('%Y-%m-%d')} | "
            f"success={day_success}/{run_count} | failed={day_failed} | "
            f"min_ilvl={min(day_ilvls)} | max_ilvl={max(day_ilvls)}"
        )
        print()

    print("#" * 110)
    print(
        f"ALL DAYS FINISHED | "
        f"total_days={len(selected_dates)} | "
        f"total_calls={grand_total} | "
        f"success={grand_success} | failed={grand_failed}"
    )
    print("#" * 110)


if __name__ == "__main__":
    main()
