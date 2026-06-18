<script setup>
import TranscriberDropzone from './components/TranscriberDropzone.vue'
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

      <TranscriberDropzone />
      
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
