"""Renders the demo family call's speech to audio files with an open model on this machine.

Reads public/family/lines.json (kept equal to the rules by src/lib/family.test.ts), writes one .m4a per
line into public/family/ and public/family/voice.json (words -> file) for lines the app looks up by text.

Every file is AI-generated speech. That is written into each file's metadata, as NASA Space Apps
requires for generated audio, and shown in the app.

Model: Kokoro-82M (hexgrad, Apache-2.0), MLX 8-bit copy, through mlx-audio (MIT). Voices are Kokoro's
own synthetic presets, not copies of any person.

Run from app/:  <python with mlx-audio> scripts/render_family_voice.py
"""
import json
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import types

import numpy as np
import soundfile as sf


def _no_espeak() -> None:
    """Kokoro's spelling fallback, espeak-ng, is GPL and not installed here. Without it, words outside
    Kokoro's own dictionary are skipped, so check_family_voice.py listens to every file afterwards."""
    stub = types.ModuleType("misaki.espeak")

    class EspeakFallback:
        def __init__(self, *args, **kwargs) -> None:
            raise RuntimeError("espeak-ng is not used")

    stub.EspeakFallback = EspeakFallback
    stub.EspeakG2P = EspeakFallback
    sys.modules["misaki.espeak"] = stub


_no_espeak()
from mlx_audio.tts.utils import load_model  # noqa: E402

MODEL = "mlx-community/Kokoro-82M-8bit"
# Who speaks with which Kokoro preset, and how fast.
VOICES = {
    "marta": ("bf_emma", 0.92),
    "jonas": ("am_michael", 1.0),
    "priya": ("af_bella", 1.0),
    "ai": ("af_sky", 1.0),
    "orbit": ("bm_george", 1.0),
}
# Names that are not in Kokoro's dictionary, with their sounds, so they are not skipped. Only the speech uses these; the words shown stay as written.
SOUNDS = {"Marta": "mˈɑɹtə", "Jonas": "jˈoʊnəs", "Priya": "pɹˈiːə"}
NOTE = "AI-generated speech (SI). Model: Kokoro-82M, Apache-2.0. Synthetic preset voice, not a real person. Demo stand-in for a recorded family message."

root = Path(__file__).resolve().parent.parent / "public"
lines = json.loads((root / "family" / "lines.json").read_text())
model = load_model(MODEL)
by_text = {}
started = time.time()
for line in lines:
    voice, speed = VOICES[line["voice"]]
    lang = voice[0]
    say = line["say"]
    for name, sound in SOUNDS.items():
        say = say.replace(name, f"[{name}](/{sound}/)")
    chunks = [np.asarray(r.audio) for r in model.generate(say, voice=voice, speed=speed, lang_code=lang)]
    audio = np.concatenate(chunks)
    out = root / line["file"]
    with tempfile.NamedTemporaryFile(suffix=".wav") as wav:
        sf.write(wav.name, audio, 24000)
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", wav.name, "-af", "loudnorm=I=-18:TP=-2", "-ar", "44100", "-c:a", "aac", "-b:a", "64k",
             "-metadata", f"title={line['text'][:60]}", "-metadata", f"artist=AI-generated voice ({voice}, Kokoro-82M)", "-metadata", f"comment={NOTE}", "-metadata", "genre=AI-generated speech", str(out)],
            check=True,
        )
    if line["voice"] in ("ai", "orbit"):
        by_text[line["text"]] = line["file"]
    print(f"{line['file']}  {len(audio) / 24000:.1f} s  {voice}", flush=True)
(root / "family" / "voice.json").write_text(json.dumps(by_text, indent=1, ensure_ascii=False) + "\n")
print(f"{len(lines)} lines in {time.time() - started:.1f} s", file=sys.stderr)
