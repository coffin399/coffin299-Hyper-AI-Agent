import json
import re
import subprocess
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
REQUIREMENTS_PATH = PROJECT_ROOT / "requirements.txt"
NOTICE_PATH = PROJECT_ROOT / "NOTICE"


def run_pip_licenses() -> list[dict]:
    try:
        result = subprocess.run(
            [
                sys.executable,
                "-m",
                "piplicenses",
                "--format=json",
                "--with-authors",
                "--with-urls",
                "--from=mixed",
            ],
            capture_output=True,
            text=True,
            check=True,
        )
    except FileNotFoundError:
        print("ERROR: Python が見つかりませんでした。venv が有効か確認してください。", file=sys.stderr)
        sys.exit(1)
    except subprocess.CalledProcessError as e:
        if "No module named piplicenses" in e.stderr:
            print(
                "ERROR: pip-licenses がインストールされていません。\n"
                "  pip install pip-licenses\n"
                "を実行してから、再度 generate_notice.bat を実行してください。",
                file=sys.stderr,
            )
        else:
            print("ERROR: pip-licenses の実行に失敗しました:\n" + e.stderr, file=sys.stderr)
        sys.exit(1)

    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError as e:
        print(f"ERROR: pip-licenses の出力を JSON として解析できませんでした: {e}", file=sys.stderr)
        sys.exit(1)

    if not isinstance(data, list):
        print("ERROR: pip-licenses の JSON 出力形式が予想と異なります。", file=sys.stderr)
        sys.exit(1)

    return data


def normalize_pkg_name(name: str) -> str:
    # pip / PyPI 名表記をゆるく吸収するための正規化
    return name.strip().replace("_", "-").split("[")[0].lower()


def build_license_index(entries: list[dict]) -> dict:
    index: dict[str, dict] = {}
    for entry in entries:
        # pip-licenses の標準キー想定: Name, Version, License, URL, Author など
        name = entry.get("Name") or entry.get("name")
        if not name:
            continue
        key = normalize_pkg_name(name)
        # 同名があっても最初のものを優先
        index.setdefault(key, entry)
    return index


def iter_requirements_packages() -> list[str]:
    if not REQUIREMENTS_PATH.exists():
        print(f"ERROR: {REQUIREMENTS_PATH} が見つかりません。", file=sys.stderr)
        sys.exit(1)

    pkgs: list[str] = []

    pattern = re.compile(r"^[A-Za-z0-9_.\-\[\]]+")

    with REQUIREMENTS_PATH.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            # コメントの後ろを削除 (pkg==x  # comment)
            if " #" in line:
                line = line.split(" #", 1)[0].strip()

            m = pattern.match(line)
            if not m:
                continue
            token = m.group(0)
            # バージョンなどの演算子を落とす
            token = re.split(r"[<>=!~]", token)[0]
            pkg = token.split("[")[0]
            pkgs.append(pkg)

    return pkgs


def format_notice(ordered_entries: list[tuple[str, dict]]) -> str:
    lines: list[str] = []

    lines.append("Hyper AI Agent - Third-party notices")
    lines.append("====================================")
    lines.append("")
    lines.append("This project is licensed under the MIT License (see LICENSE).")
    lines.append("")
    lines.append("It also uses the following third-party components:")
    lines.append("")

    separator = "-" * 70

    for pkg_name, entry in ordered_entries:
        name = entry.get("Name") or entry.get("name") or pkg_name
        version = entry.get("Version") or entry.get("version") or "(unknown)"
        license_name = entry.get("License") or entry.get("license") or "(unknown)"
        url = entry.get("URL") or entry.get("url") or ""
        author = entry.get("Author") or entry.get("author") or ""

        lines.append(separator)
        lines.append("")
        lines.append(f"Package: {name}")
        lines.append(f"Version: {version}")
        lines.append(f"License: {license_name}")
        if url:
            lines.append(f"URL: {url}")
        if author:
            lines.append(f"Author: {author}")
        lines.append("")

    return "\n".join(lines) + "\n"


def main() -> None:
    license_entries = run_pip_licenses()
    license_index = build_license_index(license_entries)

    required_pkgs = iter_requirements_packages()

    ordered_entries: list[tuple[str, dict]] = []
    missing: list[str] = []

    for raw_name in required_pkgs:
        key = normalize_pkg_name(raw_name)
        entry = license_index.get(key)
        if entry is None:
            missing.append(raw_name)
            continue
        ordered_entries.append((raw_name, entry))

    if missing:
        print("WARNING: 以下のパッケージは pip-licenses の結果からライセンス情報を取得できませんでした:", file=sys.stderr)
        for name in missing:
            print(f"  - {name}", file=sys.stderr)
        print("必要に応じて NOTICE に手動で追記してください。", file=sys.stderr)

    notice_text = format_notice(ordered_entries)

    NOTICE_PATH.parent.mkdir(parents=True, exist_ok=True)
    NOTICE_PATH.write_text(notice_text, encoding="utf-8")

    print(f"NOTICE を生成しました: {NOTICE_PATH}")


if __name__ == "__main__":
    main()
