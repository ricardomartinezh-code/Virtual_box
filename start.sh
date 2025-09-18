#!/usr/bin/env bash
set -euo pipefail

export DISPLAY="${DISPLAY:-:99}"
VNC_PORT="${VNC_PORT:-5900}"
NOVNC_PORT="${NOVNC_PORT:-6080}"
XVFB_SCREEN="${XVFB_SCREEN:-1280x720x24}"

# Launch virtual framebuffer
Xvfb "$DISPLAY" -screen 0 "$XVFB_SCREEN" &

# Give Xvfb a moment to start
sleep 1

# Start a lightweight window manager
fluxbox &

# Configure VNC authentication
if [[ -n "${VNC_PASSWORD:-}" ]]; then
  VNC_AUTH_OPTS=(-passwd "$VNC_PASSWORD")
else
  VNC_AUTH_OPTS=(-nopw)
fi

# Launch x11vnc bound to the Xvfb display
x11vnc -display "$DISPLAY" -forever -shared -rfbport "$VNC_PORT" "${VNC_AUTH_OPTS[@]}" -bg

# Start noVNC web client proxy
/usr/share/novnc/utils/novnc_proxy --vnc "localhost:${VNC_PORT}" --listen "$NOVNC_PORT" &

# Start the Node.js server (foreground)
exec node server.js
