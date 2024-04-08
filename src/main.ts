import { createPinia } from "pinia";
import { createApp } from "vue";
import GoogleSignInButtonPlugin from "vue3-google-login";
import App from "./App.vue";
import "./style.css";

createApp(App)
  .use(createPinia())
  .use(
    GoogleSignInButtonPlugin,
    {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    },
  )
  .mount("#app");
