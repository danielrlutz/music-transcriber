import os
import base64
import tempfile
import logging
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
import note_seq

# nest_asyncio is incompatible with uvicorn's uvloop and is not needed in Docker
# Removed to prevent startup crash

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="MT3 Machine Learning API Wrapper")

class TranscriptionRequest(BaseModel):
    data: str  # Base64 encoded WAV file

# ==========================================
# MT3 Inference Stub
# ==========================================
# Note: Full MT3 inference requires loading T5x checkpoints and Gin configs.
# This wrapper abstracts the complex setup. In a production scenario, you would
# load the `mt3` models globally on startup here.

def run_mt3_inference(wav_path: str, output_midi_path: str):
    """
    Runs the MT3 machine learning model on a 16kHz WAV file and outputs a MIDI file.
    """
    logger.info(f"Starting MT3 inference on {wav_path}...")
    
    # -------------------------------------------------------------
    # PLACEHOLDER: Insert actual MT3 model inference call here.
    # Because MT3 requires downloading a 3GB checkpoint from Google Cloud,
    # and configuring T5x + Gin, this section is represented as a stub.
    #
    # Example logic:
    # 1. Load audio: audio, sr = librosa.load(wav_path, sr=16000)
    # 2. Tokenize: tokens = mt3_model.predict(audio)
    # 3. Decode: sequence = mt3_vocab.decode(tokens)
    # 4. Save: note_seq.sequence_proto_to_midi_file(sequence, output_midi_path)
    # -------------------------------------------------------------
    
    # For testing the API flow without a 3GB GPU model loaded, we generate an empty MIDI.
    # Once the MT3 library is fully configured with its checkpoint on your VPS, 
    # replace this block with the actual `mt3` inference function.
    empty_sequence = note_seq.NoteSequence()
    note_seq.sequence_proto_to_midi_file(empty_sequence, output_midi_path)
    
    logger.info("Inference complete. MIDI saved.")

# ==========================================
# API Routes
# ==========================================

@app.post("/transcribe-anything")
async def transcribe(request: TranscriptionRequest):
    """
    Receives a Base64 encoded WAV file, transcodes it using MT3, and returns the binary MIDI.
    """
    try:
        # 1. Decode the Base64 audio back into binary
        audio_bytes = base64.b64decode(request.data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to decode Base64 data: {str(e)}")

    # 2. Create temporary files for the WAV input and MIDI output
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as wav_file:
        wav_file.write(audio_bytes)
        wav_path = wav_file.name

    midi_path = wav_path.replace(".wav", ".mid")

    try:
        # 3. Pass the WAV to the MT3 Engine
        run_mt3_inference(wav_path, midi_path)

        # 4. Ensure the output MIDI was actually created
        if not os.path.exists(midi_path):
            raise HTTPException(status_code=500, detail="MT3 Engine failed to output a MIDI file.")

        # 5. Send the raw binary MIDI file back to the Node.js proxy
        return FileResponse(
            path=midi_path, 
            media_type="audio/midi", 
            filename="transcription.mid",
            background=None # FileResponse handles cleanup via background tasks if configured, but we'll let the OS handle tmpdir cleanup for simplicity here
        )

    except Exception as e:
        logger.error(f"Inference error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during transcription.")

if __name__ == "__main__":
    import uvicorn
    # Bind to 0.0.0.0 so the Node.js proxy container can route to it
    uvicorn.run(app, host="0.0.0.0", port=5000)
