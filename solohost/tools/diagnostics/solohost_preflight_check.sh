#!/usr/bin/env bash
# solohost_preflight_check.sh — Pre-flight system resources evaluator

set -u

echo "=== SoloHost Hardware & Runtime Pre-Flight Audit ==="

# 1. CPU Core Count
CPU_CORES=$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 1)
echo "[1/4] CPU Cores Detected: $CPU_CORES"
if [ "$CPU_CORES" -lt 4 ]; then
    echo "  [WARN] SoloHost v2 recommends >= 4 CPU cores."
else
    echo "  [PASS] CPU Cores: PASS"
fi

# 2. Total RAM Check
MEM_KB=$(awk '/^MemTotal:/ {print $2; exit}' /proc/meminfo 2>/dev/null || true)
if [ -n "$MEM_KB" ]; then
    MEM_GB=$((MEM_KB / 1024 / 1024))
    echo "[2/4] Total System RAM: ${MEM_GB}GB"
    if [ "$MEM_GB" -lt 8 ]; then
        echo "  [WARN] SoloHost v2 recommends >= 8GB RAM."
    else
        echo "  [PASS] Memory: PASS"
    fi
else
    echo "[2/4] Total System RAM: Check skipped (non-Linux or /proc/meminfo unavailable)."
fi

# 3. Docker Daemon Availability
echo "[3/4] Checking Docker Engine..."
if command -v docker &> /dev/null; then
    if docker info &> /dev/null; then
        echo "  [PASS] Docker Daemon is active and responsive."
    else
        echo "  [FAIL] Docker installed but daemon is not running!"
    fi
else
    echo "  [FAIL] Docker CLI not found."
fi

# 4. Port Availability (3000)
echo "[4/4] Checking Port 3000 availability..."
if command -v nc &> /dev/null; then
    if nc -z 127.0.0.1 3000 2>/dev/null; then
        echo "  [WARN] Port 3000 is currently in use."
    else
        echo "  [PASS] Port 3000 is open and ready for binding."
    fi
elif command -v ss &> /dev/null; then
    if ss -tln 2>/dev/null | grep -q ':3000\b'; then
        echo "  [WARN] Port 3000 is currently in use."
    else
        echo "  [PASS] Port 3000 is open and ready for binding."
    fi
else
    echo "  [INFO] Neither 'nc' nor 'ss' found; skipping port 3000 probe."
fi

echo "=== Pre-flight Audit Complete ==="