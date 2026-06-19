# ==========================================
# Stage 1: Frontend Builder
# ==========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Install frontend dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source and build
COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Final Runtime Instance
# ==========================================
FROM node:20-alpine

# Install system-level ffmpeg for audio transcoding
RUN apk add --no-cache ffmpeg

WORKDIR /app/backend

# Install production dependencies for the backend proxy
COPY backend/package*.json ./
RUN npm install --production

# Copy backend server code
COPY backend/ ./

# Copy the compiled static Vue assets from Stage 1 into the 'public' directory
COPY --from=frontend-builder /app/frontend/dist ./public

# Force the server to bind to all network interfaces
ENV HOST=0.0.0.0
ENV PORT=5678
# By default, we point to the MT3 backend container. This can be overridden.
ENV MT3_API_URL=http://localhost:5000/transcribe-anything

EXPOSE 5678

CMD ["node", "server.js"]
