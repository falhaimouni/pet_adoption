#!/usr/bin/env bash

set -euo pipefail

HOSTNAME="petopia.com"
HOST_IP="127.0.0.1"
PORT="8443"
URL="https://${HOSTNAME}:${PORT}"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

echo
echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${CYAN}${BOLD}          Pet Adoption - Open Website${RESET}"
echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo

# ------------------------------------------------------------
# Find a supported browser
# ------------------------------------------------------------

BROWSER=""

if command -v brave-browser >/dev/null 2>&1; then
    BROWSER="$(command -v brave-browser)"

elif command -v brave >/dev/null 2>&1; then
    BROWSER="$(command -v brave)"

elif command -v google-chrome >/dev/null 2>&1; then
    BROWSER="$(command -v google-chrome)"

elif command -v google-chrome-stable >/dev/null 2>&1; then
    BROWSER="$(command -v google-chrome-stable)"

elif command -v chromium >/dev/null 2>&1; then
    BROWSER="$(command -v chromium)"

elif command -v chromium-browser >/dev/null 2>&1; then
    BROWSER="$(command -v chromium-browser)"

elif command -v microsoft-edge >/dev/null 2>&1; then
    BROWSER="$(command -v microsoft-edge)"

elif command -v microsoft-edge-stable >/dev/null 2>&1; then
    BROWSER="$(command -v microsoft-edge-stable)"

elif command -v opera >/dev/null 2>&1; then
    BROWSER="$(command -v opera)"

elif command -v vivaldi >/dev/null 2>&1; then
    BROWSER="$(command -v vivaldi)"

elif command -v firefox >/dev/null 2>&1; then
    BROWSER="$(command -v firefox)"

fi

if [[ -z "$BROWSER" ]]; then
    echo -e "${RED}✖ No supported Chromium-based browser was found.${RESET}"
    echo
    echo "Supported browsers:"
    echo "  • Brave"
    echo "  • Google Chrome"
    echo "  • Chromium"
    echo
    exit 1
fi

echo -e "${GREEN}✔ Browser found:${RESET} $BROWSER"

# ------------------------------------------------------------
# Check that the local application is reachable
# ------------------------------------------------------------

echo -e "${BLUE}ℹ Checking Petopia...${RESET}"

if ! curl -k -fsS \
    --resolve "${HOSTNAME}:${PORT}:${HOST_IP}" \
    --max-time 5 \
    "${URL}" >/dev/null 2>&1; then

    echo -e "${RED}✖ Petopia is not reachable on ${URL}${RESET}"
    echo
    echo "Make sure the project is running first:"
    echo
    echo "    make"
    echo
    exit 1
fi

echo -e "${GREEN}✔ Petopia is running.${RESET}"

# ------------------------------------------------------------
# Create an isolated temporary browser profile
# ------------------------------------------------------------

PROFILE_DIR="$(mktemp -d /tmp/petopia-browser.XXXXXX)"

echo -e "${BLUE}ℹ Creating temporary browser profile...${RESET}"

# ------------------------------------------------------------
# Launch browser with local hostname mapping
# ------------------------------------------------------------

echo -e "${BLUE}ℹ Mapping ${HOSTNAME} → ${HOST_IP}${RESET}"
echo -e "${BLUE}ℹ Opening ${URL}${RESET}"
echo

nohup "$BROWSER" \
    --user-data-dir="$PROFILE_DIR" \
    --host-resolver-rules="MAP ${HOSTNAME} ${HOST_IP}" \
    --new-window \
    "$URL" \
    >/dev/null 2>&1 &

echo -e "${GREEN}${BOLD}✔ Petopia opened successfully! 🐾${RESET}"
echo
echo -e "${BOLD}Website:${RESET} ${URL}"
echo