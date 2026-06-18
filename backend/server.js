const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const port = process.env.PORT || 3000;

// Setup multer for temporary file uploads
const upload = multer({ dest: os.tmpdir() });

// Middleware for serving static files from the 'public' directory
// We will copy the Vue build output here in the final container
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No audio file provided' });
    }

    const inputPath = req.file.path;
    const outputPath = path.join(os.tmpdir(), `${req.file.filename}_converted.wav`);

    try {
        // Transcode audio to 16kHz, mono, 16-bit PCM WAV
        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .toFormat('wav')
                .audioChannels(1)
                .audioFrequency(16000)
                .audioCodec('pcm_s16le')
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .save(outputPath);
        });

        // Read the WAV file and convert it to a Base64 string
        const wavBuffer = await fs.promises.readFile(outputPath);
        const base64Data = wavBuffer.toString('base64');
        const payload = { data: base64Data };

        // Post the payload to the MT3 API
        const mt3Url = process.env.MT3_API_URL || 'http://localhost:5000/transcribe-anything';
        console.log(`Sending payload to ${mt3Url}...`);
        
        const response = await axios.post(mt3Url, payload, {
            timeout: 300000, // 5 minutes timeout
            responseType: 'arraybuffer', // Expecting raw binary (MIDI) response
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Received response from MT3 API.');

        // Send the raw binary MIDI response straight back to the client
        res.set({
            'Content-Type': 'audio/midi',
            'Content-Disposition': 'attachment; filename="transcription.mid"'
        });
        res.send(response.data);

    } catch (error) {
        console.error('Error during transcription process:', error.message || error);
        res.status(500).json({ error: 'Transcription failed', details: error.message || String(error) });
    } finally {
        // Cleanup temporary files
        try {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        } catch (cleanupError) {
            console.error('Error cleaning up temp files:', cleanupError);
        }
    }
});

// Fallback to index.html for Vue Router (if used)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Web UI proxy server listening at http://0.0.0.0:${port}`);
});
