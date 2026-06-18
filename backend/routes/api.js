const express = require('express');
const multer = require('multer');
const os = require('os');
const TranscribeController = require('../controllers/transcribeController');

const router = express.Router();

/**
 * Configure Multer middleware for handling multipart/form-data.
 * We store files temporarily in the OS's default tmpdir.
 */
const upload = multer({ dest: os.tmpdir() });

/**
 * POST /api/transcribe
 * 
 * Endpoint to receive audio files, transcode them, and proxy them to the MT3 API.
 * Uses multer middleware to parse the single file field named 'audio'.
 */
router.post('/transcribe', upload.single('audio'), TranscribeController.handleTranscription);

module.exports = router;
