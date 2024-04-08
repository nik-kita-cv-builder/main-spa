<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { type CallbackTypes, GoogleLogin } from 'vue3-google-login';
import { useAuthStore } from './auth.store';

const authStore = useAuthStore();

authStore.auth_actor_ref.subscribe((state) => {
  console.log(state.value);
});

const handleSuccess: CallbackTypes.CredentialCallback = async (response) => {
  authStore.auth_actor_ref.send({
    type: 'SIGN_IN_WITH_GOOGLE_SUCCESS',
    payload: {
      credential: response.credential!,
    },
  })
}

const handleError = (error: any) => {
  console.error(error);
  authStore.auth_actor_ref.send({
    type: 'SIGN_IN_WITH_GOOGLE_FAIL',
  })
}
const wait_for_user_consent = () => {
  console.log('wait for user consent')
  authStore.auth_actor_ref.send({
    type: 'SIGN_IN_WITH_GOOGLE_START'
  })
}

onMounted(() => {
  wait_for_user_consent();
})
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
    <pre v-if="authStore.select_auth_payload.isAuthenticated">
      Access:   {{ authStore.select_auth_payload.access }}
      Refresh:  {{ authStore.select_auth_payload.refresh }}
    </pre>
    <GoogleLogin v-else :callback="handleSuccess" :error="handleError" />
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