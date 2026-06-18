# MT3 Web UI Container 🎵

A fully containerized, network-accessible graphical front-end and proxy backend for the MT3 (Multi-Task Multitrack Music Transcription) machine learning engine.
![MT3 Transcriber](frontend/public/favicon.svg)
## Features

- **Beautiful Drag-and-Drop Interface:** Built with Vue 3 and TailwindCSS, featuring a smooth state-machine visualizer for uploads and transcriptions.
- **Audio Transcoding Built-In:** Utilizes `fluent-ffmpeg` to ensure all uploaded audio (MP3, FLAC, M4A, etc.) is strictly converted to the `16kHz, mono, 16-bit PCM WAV` format required by MT3.
- **Base64 Payload Streaming:** Handles the conversion and streaming of audio data to the backend inference container.
- **Network Agnostic:** Binds to `0.0.0.0`, allowing any device on your local network (LAN) to drop files into the web UI and receive transcribed `.mid` MIDI files instantly.
- **Multi-Stage Docker Architecture:** An optimized, single-container deployment containing both the static frontend assets and the Node.js Express proxy.

## Architecture

This project acts as a bridge. It intercepts local network uploads, processes them, and routes them via `localhost` to an isolated MT3 inference container.

1. **Frontend:** Vue 3 (Composition API), Vite, TailwindCSS.
2. **Backend Proxy:** Node.js, Express, Multer, Fluent-FFmpeg, Axios.
3. **Upstream Target:** By default, it looks for the MT3 container running on `http://localhost:5000/transcribe-anything`.

## Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose installed.
- An instance of the MT3 API running locally (defaults to `localhost:5000`).

## Getting Started (Quickstart)

We provide a convenient launch script for Windows users:

```powershell
.\launch.ps1
```

This script will:
1. Identify your local IPv4 LAN address.
2. Build and launch the container via `docker-compose`.
3. Print the network URL (e.g., `http://192.168.1.50:3000`) so you can access the UI from your phone or other laptops.

### Manual Docker Setup

If you prefer to run it manually or on Linux/macOS:

```bash
# Build and run the container in detached mode
docker-compose up --build -d

# Check the logs
docker-compose logs -f
```

Visit `http://localhost:3000` (or your machine's LAN IP) to use the interface.

## Configuration

You can override environment variables in the `docker-compose.yml`:

- `PORT`: The port the web UI binds to (default: `3000`).
- `MT3_API_URL`: The downstream MT3 API endpoint (default: `http://localhost:5000/transcribe-anything`).

## Development

If you wish to develop on the frontend or backend without Docker:

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
node server.js
```
*(Ensure `ffmpeg` is installed on your host system if running the backend outside of Docker).*

## License

This project is licensed under the [MIT License](LICENSE).
