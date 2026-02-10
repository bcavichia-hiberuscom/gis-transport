#!/usr/bin/env bash
set -e

ROOT_DIR=$(pwd)
echo "Root dir: $ROOT_DIR"

echo "=== [1/6] Installing pnpm ==="
npm install -g pnpm@10

echo "=== [2/6] Installing dependencies ==="
pnpm install --frozen-lockfile

echo "=== [3/6] Generating Prisma Client ==="
cd "$ROOT_DIR/packages/database" && pnpm exec prisma generate

echo "=== [4/6] Building packages/shared ==="
cd "$ROOT_DIR/packages/shared" && npx tsc

echo "=== [5/6] Building packages/database ==="
cd "$ROOT_DIR/packages/database" && npx tsc

echo "=== [6/6] Building apps/api ==="
cd "$ROOT_DIR/apps/api" && npx tsc

echo "=== Verifying build output ==="
ls -la "$ROOT_DIR/apps/api/dist/"
echo "=== Build complete ==="
