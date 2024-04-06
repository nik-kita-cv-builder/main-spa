<script setup lang="ts">
import { GoogleSignInButton } from 'vue3-google-signin';
</script>

<template>
  <div class="root">
    <div>
      <a href="https://vitejs.dev" target="_blank">
        <img src="/vite.svg" class="logo" alt="Vite logo" />
      </a>

      <a href="https://vuejs.org/" target="_blank">
        <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
      </a>
    </div>
    <img src="/vite-deno.svg" alt="Vite with Deno" />
    <GoogleSignInButton @success="console.log" @error="console.error" />
  </div>
</template>

<style scoped>
.root {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
}
</style>