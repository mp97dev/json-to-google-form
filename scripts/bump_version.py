#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import subprocess


def is_version_staged() -> bool:
    result = subprocess.run(
        ["git", "diff", "--cached", "--name-only", "--", "VERSION"],
        check=True,
        capture_output=True,
        text=True,
    )
    return "VERSION" in result.stdout.splitlines()


def main() -> int:
    if is_version_staged():
        print('VERSION already staged, skipping bump.')
        return 0

    version_file = Path("VERSION")
    current = version_file.read_text(encoding="utf-8").strip()

    parts = current.split(".")
    if len(parts) != 3 or any(not part.isdigit() for part in parts):
        raise ValueError(
            "VERSION must follow semantic format MAJOR.MINOR.PATCH with numeric values only"
        )

    major, minor, patch = (int(part) for part in parts)
    next_version = f"{major}.{minor}.{patch + 1}"

    version_file.write_text(f"{next_version}\n", encoding="utf-8")
    print(f"Updated VERSION: {current} -> {next_version}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())