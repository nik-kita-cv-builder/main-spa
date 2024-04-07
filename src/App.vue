<script setup lang="ts">
import { ref } from 'vue';
import { GoogleSignInButton, type CredentialResponse } from 'vue3-google-signin';

const access = ref('')
const refresh = ref('')

const handleSuccess = async (response: CredentialResponse) => {
  const res = await fetch(import.meta.env.VITE_API_URL + '/auth/sign-in', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      auth_provider: 'google',
      credential: response.credential
    })
  }).then((r) => r.json())
  access.value = res.access_token
  refresh.value = res.refresh_token
}

const handleError = (error: any) => {
  console.error(error)
}
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
    <pre v-if="access && refresh">
      Access:   {{ access }}
      Refresh:  {{ refresh }}
    </pre>
    <GoogleSignInButton v-else @success="handleSuccess" @error="handleError" />
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