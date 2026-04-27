#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path


def main() -> int:
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