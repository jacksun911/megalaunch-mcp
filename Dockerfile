# MegaLaunch MCP Server — Dockerfile for Glama.ai sandbox
# https://glama.ai/mcp/servers/jacksun911/megalaunch-mcp

FROM node:20-alpine

WORKDIR /app

# Install production dependencies first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy server source
COPY index.js README.md LICENSE ./

# MegaLaunch MCP speaks stdio (standard MCP transport).
# Glama's sandbox pipes stdin/stdout to this process.
ENTRYPOINT ["node", "index.js"]
