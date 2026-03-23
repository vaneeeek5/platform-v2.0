#!/bin/bash
# Start the platform dev server
# All deps must be installed at /private/tmp/platform-deps
# Run: npm install --prefix /private/tmp/platform-deps --cache /tmp/npm-cache (if /tmp cleared after reboot)

DEPS=/private/tmp/platform-deps
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Re-install deps if /tmp was cleared
if [ ! -f "$DEPS/node_modules/.bin/next" ]; then
  echo "==> Installing dependencies to $DEPS ..."
  mkdir -p "$DEPS"
  cp "$APP_DIR/package.json" "$DEPS/"
  npm install --prefix "$DEPS" --cache /tmp/npm-cache-app
fi

# Sync source files to deps folder
rsync -a --exclude=node_modules --exclude=.next --exclude=.git "$APP_DIR/" "$DEPS/app/"

echo "==> Starting Next.js dev server on http://localhost:3000 ..."
cd "$DEPS/app" && TMPDIR=/tmp "$DEPS/node_modules/.bin/next" dev --port 3000
