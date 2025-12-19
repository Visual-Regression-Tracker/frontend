#!/bin/bash

# Script to run Playwright tests in a Docker container
# Note: The frontend application should be running (e.g., via docker compose up ui)
# Usage:
#   ./test-docker.sh                    # Run all tests
#   ./test-docker.sh --update-snapshots # Update snapshots
#   BASE_URL=http://host.docker.internal:8080 ./test-docker.sh # Custom base URL

set -e

IMAGE_NAME="frontend-test"
CONTAINER_NAME="vrt-frontend-test-$(date +%s)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Clean up any existing container with the same name pattern
EXISTING_CONTAINERS=$(docker ps -a --filter "name=vrt-frontend-test-" --format "{{.Names}}" 2>/dev/null || true)
if [ -n "$EXISTING_CONTAINERS" ]; then
  echo "$EXISTING_CONTAINERS" | xargs docker rm -f 2>/dev/null || true
fi

echo -e "${GREEN}Running tests in Docker container...${NC}"

# Use host network mode on Linux for direct localhost access
# On Mac/Windows, use host.docker.internal mapping and override BASE_URL
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
  NETWORK_OPTION="--network host"
else
  NETWORK_OPTION="--add-host=host.docker.internal:host-gateway"
  BASE_URL="${BASE_URL:-http://host.docker.internal:8080}"
fi

# Run the container
docker run --rm \
  --name "${CONTAINER_NAME}" \
  ${NETWORK_OPTION} \
  -v "$(pwd)/test-results:/app/test-results" \
  -v "$(pwd)/playwright-report:/app/playwright-report" \
  -v "$(pwd)/integration_tests:/app/integration_tests" \
  -v "$(pwd)/src:/app/src" \
  -v "$(pwd)/playwright.config.ts:/app/playwright.config.ts" \
  -v "$(pwd)/tsconfig.json:/app/tsconfig.json" \
  -v "$(pwd)/package.json:/app/package.json" \
  -v "$(pwd)/package-lock.json:/app/package-lock.json" \
  -e CI=true \
  -e NODE_ENV=test \
  ${BASE_URL:+-e BASE_URL="${BASE_URL}"} \
  "${IMAGE_NAME}" \
  npx playwright test "$@"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}Tests completed successfully!${NC}"
else
  echo -e "${RED}Tests failed with exit code: $EXIT_CODE${NC}"
fi

exit $EXIT_CODE

