# Fluid Slack bot. Playwright's image brings Node + Chromium (email slicing); we add git + python3 (client guard hook).
FROM mcr.microsoft.com/playwright:v1.64.1-noble
RUN apt-get update && apt-get install -y --no-install-recommends git python3 ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY bot/start.sh /app/start.sh
ENV NODE_ENV=production GIT_SYNC=1
CMD ["bash", "/app/start.sh"]
