"""Separate check of app/src/lib/missRate.ts, written without its code.

Plants known problems into NASA UTMB bed-rest readings and counts, per rule, how many are
caught in clean windows (no alarm on those vitals before anything was planted).
Definitions: docs/research/miss-rate.md.

Run: python3 app/scripts/miss_rate_check.py
"""

import json
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "src" / "data" / "utmb-replay.json"
VITALS = ["hr", "sys", "dia", "temp"]
STARTS = [20, 35, 50]
RULES = ["earth1", "earth2", "strict", "orbit1", "orbit2"]


def earth_over(v, x):
    return x > 100 if v == "hr" else x >= {"sys": 130, "dia": 80, "temp": 38.0}[v]


def strict_over(v, x):
    if v == "sys":
        return x >= 140
    if v == "dia":
        return x >= 90
    return earth_over(v, x)


def personal_limit(v, base):
    if base[v] is None:
        return None
    if v == "hr":
        return base["hr"] * 1.2
    if v == "sys":
        return base["sys"] + 20
    if v == "dia":
        return base["dia"] + 15
    return base["temp"] + 0.5


def over(rule, base, day, v):
    x = day[v]
    if x is None:
        return False
    if rule.startswith("earth"):
        return earth_over(v, x)
    if rule == "strict":
        return strict_over(v, x)
    limit = personal_limit(v, base)
    return limit is not None and x >= limit


def first_alarm(rule, base, window, vitals):
    two_day = rule in ("earth2", "orbit2")
    for k in range(1 if two_day else 0, len(window)):
        for v in vitals:
            if over(rule, base, window[k], v) and (not two_day or over(rule, base, window[k - 1], v)):
                return k
    return -1


def steady(days, change):
    return days, lambda v, i: change.get(v, 0)


PROBLEMS = {
    "fever-0.5": steady(3, {"temp": 0.5}),
    "fever-1.0": steady(3, {"temp": 1.0}),
    "fever-1.5": steady(3, {"temp": 1.5}),
    "hr-10": steady(5, {"hr": 10}),
    "hr-20": steady(5, {"hr": 20}),
    "hr-30": steady(5, {"hr": 30}),
    "drift-0.5": (30, lambda v, i: 0.5 * (i + 1) if v == "hr" else 0),
    "drift-1.0": (30, lambda v, i: 1.0 * (i + 1) if v == "hr" else 0),
    "bp-up-15": steady(3, {"sys": 15, "dia": 9}),
    "bp-up-25": steady(3, {"sys": 25, "dia": 15}),
    "bp-up-35": steady(3, {"sys": 35, "dia": 21}),
    "bp-down-20": steady(3, {"sys": -20, "dia": -12}),
    "bp-down-30": steady(3, {"sys": -30, "dia": -18}),
}
PROBLEM_VITALS = {
    "fever": ["temp"], "hr": ["hr"], "drift": ["hr"], "bp": ["sys", "dia"],
}


def main():
    subjects = json.loads(DATA.read_text())["subjects"]
    for name, (length, change) in PROBLEMS.items():
        vitals = PROBLEM_VITALS[name.split("-")[0]]
        clean_n = dict.fromkeys(RULES, 0)
        clean_caught = dict.fromkeys(RULES, 0)
        for s in subjects:
            days = [dict(zip(VITALS, d[1:])) for d in s["days"]]
            base = s["baseline"]
            for start in STARTS:
                if start + length > len(days) or any(base[v] is None for v in vitals):
                    continue
                clean = days[start:start + length]
                if not any(d[v] is not None for d in clean for v in vitals):
                    continue
                sick = []
                for i, d in enumerate(clean):
                    d2 = dict(d)
                    for v in vitals:
                        if d2[v] is not None:
                            d2[v] += change(v, i)
                    sick.append(d2)
                for rule in RULES:
                    if first_alarm(rule, base, clean, vitals) >= 0:
                        continue
                    clean_n[rule] += 1
                    if first_alarm(rule, base, sick, vitals) >= 0:
                        clean_caught[rule] += 1
        print(name.ljust(11), " | ".join(f"{r} {clean_caught[r]}/{clean_n[r]}" for r in RULES))


if __name__ == "__main__":
    main()
