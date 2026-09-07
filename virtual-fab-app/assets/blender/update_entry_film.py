#!/usr/bin/env python3
"""입실 영상을 새 렌더로 교체한다.

원본 렌더에는 제목·단계칩(상단)과 자막·진행바(하단)가 구워져 있어 앱 UI 와
겹친다. 그 영역을 잘라내고 커버 이미지를 다시 만든 뒤, 필요하면
CleanroomLobby.tsx 의 FILM_SEGMENTS 까지 갱신한다.

  python3 update_entry_film.py 새영상.mp4
  python3 update_entry_film.py 새영상.mp4 --crop-top 0 --crop-bottom 0
  python3 update_entry_film.py 새영상.mp4 --frames 1,96,180,258,348 --fps 12

--frames 는 스토리보드 HTML 의 starts 배열을 그대로 넣으면 된다.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

APP = Path(__file__).resolve().parents[2]
MEDIA = APP / "public" / "media"
LOBBY = APP / "src" / "CleanroomLobby.tsx"


def probe(path: Path) -> dict:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height", "-show_entries", "format=duration",
         "-of", "json", str(path)],
        capture_output=True, text=True, check=True).stdout
    d = json.loads(out)
    st = d["streams"][0]
    return {"w": st["width"], "h": st["height"], "dur": float(d["format"]["duration"])}


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("source", type=Path)
    p.add_argument("--crop-top", type=int, default=80, help="구워진 제목·단계칩 높이")
    p.add_argument("--crop-bottom", type=int, default=46, help="구워진 자막·진행바 높이")
    p.add_argument("--frames", default="", help="구간 시작 프레임(1부터), 쉼표 구분")
    p.add_argument("--fps", type=float, default=12.0, help="--frames 의 기준 fps")
    p.add_argument("--crf", type=int, default=23)
    a = p.parse_args()

    if not a.source.exists():
        print(f"원본이 없다: {a.source}")
        return 1
    if not shutil.which("ffmpeg"):
        print("ffmpeg 가 없다")
        return 1

    info = probe(a.source)
    keep = info["h"] - a.crop_top - a.crop_bottom
    if keep <= 0:
        print(f"자를 높이가 원본({info['h']})보다 크다")
        return 1
    print(f"원본 {info['w']}x{info['h']} · {info['dur']:.2f}s -> 잘라낸 뒤 {info['w']}x{keep}")

    MEDIA.mkdir(parents=True, exist_ok=True)
    vf = f"crop={info['w']}:{keep}:0:{a.crop_top}"
    subprocess.run(["ffmpeg", "-v", "error", "-i", str(a.source), "-vf", vf,
                    "-c:v", "libx264", "-crf", str(a.crf), "-preset", "medium",
                    "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an",
                    "-y", str(MEDIA / "cleanroom_entry.mp4")], check=True)
    # 커버는 사람이 확실히 보이는 지점에서 뽑는다.
    subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{min(3.0, info['dur'] / 4):.2f}",
                    "-i", str(a.source), "-frames:v", "1", "-vf", vf,
                    "-y", str(MEDIA / "cleanroom_entry_cover.jpg")], check=True)

    out = probe(MEDIA / "cleanroom_entry.mp4")
    size = (MEDIA / "cleanroom_entry.mp4").stat().st_size / 1024
    print(f"교체 완료: {out['w']}x{out['h']} · {out['dur']:.2f}s · {size:.0f} KB")

    if a.frames:
        starts = [(float(x) - 1) / a.fps for x in a.frames.split(",")]
        bounds = starts + [out["dur"]]
        segs = ", ".join(f"[{bounds[i]:.3f}, {bounds[i + 1]:.3f}]" for i in range(len(starts)))
        src = LOBBY.read_text(encoding="utf-8")
        new = f"const FILM_SEGMENTS: Array<[number, number]> = [\n  {segs},\n]"
        patched, n = re.subn(r"const FILM_SEGMENTS: Array<\[number, number\]> = \[.*?\n\]",
                             new, src, count=1, flags=re.S)
        if n:
            LOBBY.write_text(patched, encoding="utf-8")
            print(f"FILM_SEGMENTS 갱신: {segs}")
        else:
            print("FILM_SEGMENTS 를 찾지 못했다. 수동 확인 필요")
    else:
        print(f"구간 시각은 그대로 둔다. 길이가 {out['dur']:.2f}s 로 바뀌었으면 --frames 를 넘겨라")

    print("\n다음: npm run build (dist 가 곧 라이브다)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
