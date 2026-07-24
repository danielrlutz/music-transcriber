import { ref } from 'vue'

/**
 * Composable for managing the MT3 audio transcription state and API communication.
 * Encapsulates the file uploading, progress tracking, and MIDI downloading logic.
 * 
 * @returns {Object} Reactive state and functions for transcription.
 */
export function useTranscription() {
  /** @type {import('vue').Ref<'idle' | 'uploading' | 'transcribing' | 'complete' | 'error'>} */
  const status = ref('idle')
  
  /** @type {import('vue').Ref<File | null>} */
  const file = ref(null)
  
  /** @type {import('vue').Ref<string>} */
  const errorMessage = ref('')
  
  /** @type {import('vue').Ref<number>} */
  const progress = ref(0) // Visual progress from 0 to 100

  /**
   * Resets the transcription state to its default idle values.
   */
  const resetState = () => {
    status.value = 'idle'
    file.value = null
    progress.value = 0
    errorMessage.value = ''
  }

  /**
   * Processes the selected audio file by uploading it to the backend proxy
   * and subsequently downloading the returned MIDI file.
   * 
   * @param {File} selectedFile - The audio file to transcribe.
   * @returns {Promise<void>}
   */
  const processFile = async (selectedFile) => {
    // Validate file type
    if (!selectedFile.type.startsWith('audio/') && !selectedFile.name.match(/\.(mp3|wav|ogg|flac|m4a|aac)$/i)) {
      errorMessage.value = 'Please upload a valid audio file.'
      status.value = 'error'
      return
    }

    file.value = selectedFile
    status.value = 'uploading'
    errorMessage.value = ''
    progress.value = 10

    const formData = new FormData()
    formData.append('audio', selectedFile)

    try {
      status.value = 'transcribing'
      progress.value = 50
      
      // Determine dynamic host to support LAN access seamlessly
      const apiUrl = `${window.location.protocol}//${window.location.host}/api/transcribe`
      
      // We use standard fetch API for simplicity and no external dependencies here
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        let errorText = 'Unknown error'
        try {
          const errData = await response.json()
          if (errData.details) {
            errorText = `${errData.error || 'Error'}: ${errData.details}`
          } else {
            errorText = errData.error || await response.text()
          }
        } catch {
          errorText = await response.text()
        }
        throw new Error(errorText)
      }

      progress.value = 100
      status.value = 'complete'

      // Extract the raw binary blob (MIDI data) from the response
      const blob = await response.blob()
      
      // Create a temporary object URL and trigger the browser's download mechanic
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      
      // Format output filename based on original filename
      const originalName = selectedFile.name.replace(/\.[^/.]+$/, "")
      a.download = `${originalName}_transcribed.mid`
      
      document.body.appendChild(a)
      a.click()
      
      // Cleanup DOM and memory
      window.URL.revokeObjectURL(url)
      a.remove()
      
      // Auto-reset state after 5 seconds of showing "complete"
      setTimeout(() => {
        if (status.value === 'complete') {
          resetState()
        }
      }, 5000)

    } catch (error) {
      console.error('[useTranscription] Transcription failed:', error)
      errorMessage.value = error.message || 'An unknown error occurred during transcription.'
      status.value = 'error'
    }
  }

  return {
    status,
    file,
    errorMessage,
    progress,
    processFile,
    resetState
  }
}
