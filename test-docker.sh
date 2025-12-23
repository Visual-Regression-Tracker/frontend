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

# Build command - install Linux-compatible dependencies, then run tests
# This ensures platform-specific binaries (like esbuild) are installed for Linux
PLAYWRIGHT_ARGS="$*"
COMMAND=("bash" "-c" "npm install && npx playwright test ${PLAYWRIGHT_ARGS}")

echo "Creating container with command: npm install && npx playwright test ${PLAYWRIGHT_ARGS}..."

# Run the container
# Note: Since web server and tests run in the same container, localhost connections work
EXIT_CODE=0
docker run --rm \
    --ipc=host \
    -v "${LOCAL_DIR}:${DOCKER_DIR}" \
    -w "${DOCKER_DIR}" \
    "${ENV_ARGS[@]}" \
    "${IMAGE_NAME}" \
    "${COMMAND[@]}" || EXIT_CODE=$?

echo "Container exit code: ${EXIT_CODE}"

if [ $EXIT_CODE -ne 0 ]; then
    echo "Container ended unsuccessfully, check logs for info" >&2
    exit $EXIT_CODE
fi
