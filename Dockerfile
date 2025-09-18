FROM mcr.microsoft.com/playwright:v1.47.2-jammy

WORKDIR /app

# Install VNC server, noVNC and a lightweight window manager
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        fluxbox \
        x11vnc \
        novnc \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci
COPY . .
RUN npx playwright install --with-deps

COPY start.sh ./
RUN chmod +x start.sh

ENV PORT=3000 \
    DISPLAY=:99 \
    VNC_PORT=5900 \
    NOVNC_PORT=6080

EXPOSE 3000 5900 6080

CMD ["./start.sh"]
