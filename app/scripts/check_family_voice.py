"""Listens to every rendered file with Whisper (openai/whisper-large-v3-turbo, MIT) and prints the words
of each line that the speech model left out. Run from app/ with a Python that has mlx-whisper."""
import json
import re
import sys
from pathlib import Path

import mlx_whisper

root = Path(__file__).resolve().parent.parent / "public"
SAME = {"5": "five", "millimetres": "mm", "70mm": "70", "i'm": "am"}


def words(t: str) -> list[str]:
    """Words as heard, with the spellings Whisper prefers treated as the same word."""
    t = t.lower().replace("’", "'").replace("70mm", "70 mm").replace("i'm", "i am")
    return [SAME.get(w, w) for w in re.findall(r"[a-z0-9']+", t)]


bad = 0
rules = 0
for line in json.loads((root / "family" / "lines.json").read_text()):
    heard = mlx_whisper.transcribe(str(root / line["file"]), path_or_hf_repo="mlx-community/whisper-large-v3-turbo", language="en")["text"]
    missing = [w for w in words(line["say"]) if w not in words(heard)]
    if missing:
        bad += 1
        rules += line["voice"] == "orbit"
        print(f"{line['file']}: missing {missing}\n   heard: {heard.strip()}")
print(f"{bad} of the files differ")
# A health rule must be spoken whole: a missing word there fails the check.
sys.exit(1 if rules else 0)
