<script setup>
import { ref } from 'vue'
import { useTranscription } from '../composables/useTranscription'

/**
 * The core UI component for the application.
 * Manages the drag-and-drop interactions and delegates business logic to `useTranscription`.
 */

const { status, file, errorMessage, progress, processFile, resetState } = useTranscription()
const isDragging = ref(false)

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
</script>

<template>
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
    <!-- Idle State: Waiting for file -->
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

    <!-- Uploading & Transcribing State -->
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

    <!-- Success State -->
    <template v-else-if="status === 'complete'">
      <div class="flex flex-col items-center">
        <div class="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 text-green-400">
          <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h3 class="text-2xl text-white font-semibold mb-2">Transcription Complete!</h3>
        <p class="text-slate-400 text-center">Your MIDI file is downloading.</p>
      </div>
    </template>

    <!-- Error State -->
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
</template>
