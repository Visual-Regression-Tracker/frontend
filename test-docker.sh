#!/bin/bash
set -e

# Get Playwright version from package.json
PLAYWRIGHT_VERSION=$(node -p "require('./package.json').devDependencies['@playwright/test']?.replace(/[^\d.]/g, '')")
IMAGE_NAME="mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}"

# Get current directory for mounting
LOCAL_DIR=$(pwd)
DOCKER_DIR="${LOCAL_DIR}"

echo "Pulling image ${IMAGE_NAME}..."
docker pull "${IMAGE_NAME}"

# Pass CI through so playwright.config.ts picks its CI settings (workers,
# retries, forbidOnly) inside the container too
ENV_ARGS=()
if [[ -n "${CI}" ]]; then
    ENV_ARGS+=(-e CI)
fi

# Linux node_modules live in their own volume: installing them into the
# mounted checkout would replace the host's platform binaries (esbuild,
# rolldown), and the volume keeps them between runs
NODE_MODULES_VOLUME="vrt-frontend-node-modules-$(echo -n "${LOCAL_DIR}" | shasum | cut -c1-8)"

# npm's download cache: a host folder when NPM_CACHE_DIR is set (CI caches
# it between runs), otherwise a named volume that lives between local runs
NPM_CACHE_MOUNT="${NPM_CACHE_DIR:-vrt-frontend-npm-cache}"
if [[ -n "${NPM_CACHE_DIR}" ]]; then
    mkdir -p "${NPM_CACHE_DIR}"
fi

# Build command - install Linux-compatible dependencies, then run tests
# This ensures platform-specific binaries (like esbuild) are installed for Linux
PLAYWRIGHT_ARGS="$*"
COMMAND=("bash" "-c" "npm ci --prefer-offline --no-audit --no-fund && npx playwright test ${PLAYWRIGHT_ARGS}")

echo "Creating container with command: npm ci && npx playwright test ${PLAYWRIGHT_ARGS}..."

# Run the container
# Note: Since web server and tests run in the same container, localhost connections work
EXIT_CODE=0
docker run --rm \
    --ipc=host \
    -v "${LOCAL_DIR}:${DOCKER_DIR}" \
    -v "${NODE_MODULES_VOLUME}:${DOCKER_DIR}/node_modules" \
    -v "${NPM_CACHE_MOUNT}:/root/.npm" \
    -w "${DOCKER_DIR}" \
    "${ENV_ARGS[@]}" \
    "${IMAGE_NAME}" \
    "${COMMAND[@]}" || EXIT_CODE=$?

echo "Container exit code: ${EXIT_CODE}"

if [ $EXIT_CODE -ne 0 ]; then
    echo "Container ended unsuccessfully, check logs for info" >&2
    exit $EXIT_CODE
fi
