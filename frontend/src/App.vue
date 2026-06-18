<script setup>
import { ref } from 'vue'

const isDragging = ref(false)
const file = ref(null)
const status = ref('idle') // idle, uploading, transcribing, complete, error
const errorMessage = ref('')
const progress = ref(0) // 0 to 100 roughly for visual

const handleDragOver = (e) => {
  e.preventDefault()
  isDragging.value = true
}

const handleDragLeave = (e) => {
  e.preventDefault()
  isDragging.value = false
}

const handleDrop = (e) => {
  e.preventDefault()
  isDragging.value = false
  const droppedFiles = e.dataTransfer.files
  if (droppedFiles.length > 0) {
    processFile(droppedFiles[0])
  }
}

const handleFileSelect = (e) => {
  const selectedFiles = e.target.files
  if (selectedFiles.length > 0) {
    processFile(selectedFiles[0])
  }
}

const processFile = async (selectedFile) => {
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
    
    // Determine dynamic host to support LAN access
    const apiUrl = `${window.location.protocol}//${window.location.host}/api/transcribe`
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Server error: ${response.status} ${errorText}`)
    }

    progress.value = 100
    status.value = 'complete'

    // Get the MIDI blob and trigger download
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    // Use original filename but change extension to .mid
    const originalName = selectedFile.name.replace(/\.[^/.]+$/, "")
    a.download = `${originalName}_transcribed.mid`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    a.remove()
    
    // Reset after a few seconds
    setTimeout(() => {
      resetState()
    }, 5000)

  } catch (error) {
    console.error('Transcription failed:', error)
    errorMessage.value = error.message || 'An unknown error occurred during transcription.'
    status.value = 'error'
  }
}

const resetState = () => {
  status.value = 'idle'
  file.value = null
  progress.value = 0
  errorMessage.value = ''
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
    <!-- Background styling elements -->
    <div class="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-black z-0"></div>
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob z-0"></div>
    <div class="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 z-0"></div>

    <div class="max-w-xl w-full bg-slate-800/80 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-slate-700/50 z-10 relative">
      <div class="text-center mb-10">
        <h1 class="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-3 tracking-tight">
          MT3 Transcriber
        </h1>
        <p class="text-slate-400 text-lg">Drop an audio file to generate MIDI instantly.</p>
      </div>

      <!-- Drag & Drop Zone -->
      <div 
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
        class="border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ease-out flex flex-col items-center justify-center min-h-[300px]"
        :class="[
          status === 'idle' || status === 'error' ? 'cursor-pointer hover:border-indigo-400 hover:bg-slate-700/30' : '',
          isDragging ? 'border-indigo-500 bg-indigo-500/10 scale-105 shadow-indigo-500/20 shadow-xl' : 'border-slate-600'
        ]"
      >
        <template v-if="status === 'idle'">
          <input 
            type="file" 
            id="fileInput" 
            class="hidden" 
            accept="audio/*" 
            @change="handleFileSelect"
          >
          <label for="fileInput" class="cursor-pointer flex flex-col items-center">
            <svg class="w-16 h-16 text-slate-400 mb-6 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
            <span class="text-xl text-slate-200 font-medium mb-2">Drag and drop audio here</span>
            <span class="text-sm text-slate-500">or click to browse</span>
          </label>
        </template>

        <template v-else-if="status === 'uploading' || status === 'transcribing'">
          <div class="flex flex-col items-center w-full">
            <div class="relative w-20 h-20 mb-6">
              <svg class="animate-spin text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 class="text-2xl text-white font-semibold mb-2">
              {{ status === 'uploading' ? 'Uploading...' : 'Transcribing Audio...' }}
            </h3>
            <p class="text-slate-400 mb-6 text-center max-w-xs truncate">{{ file?.name }}</p>
            
            <!-- Progress Bar -->
            <div class="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div 
                class="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-1000 ease-out"
                :style="`width: ${progress}%`"
              ></div>
            </div>
            <p class="text-xs text-slate-500 mt-3 uppercase tracking-widest font-semibold">
              {{ status === 'transcribing' ? 'This may take a few minutes' : '' }}
            </p>
          </div>
        </template>

        <template v-else-if="status === 'complete'">
          <div class="flex flex-col items-center">
            <div class="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 text-green-400">
              <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h3 class="text-2xl text-white font-semibold mb-2">Transcription Complete!</h3>
            <p class="text-slate-400 text-center">Your MIDI file is downloading.</p>
          </div>
        </template>

        <template v-else-if="status === 'error'">
          <div class="flex flex-col items-center">
            <div class="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 text-red-400">
              <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </div>
            <h3 class="text-2xl text-white font-semibold mb-2">Error</h3>
            <p class="text-red-400 text-center mb-6">{{ errorMessage }}</p>
            <button 
              @click="resetState"
              class="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style>
/* Custom animations that Tailwind might not have by default */
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}
.animate-blob {
  animation: blob 7s infinite;
}
.animation-delay-2000 {
  animation-delay: 2s;
}
</style>
