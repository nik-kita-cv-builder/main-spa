import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import GoogleSignInButtonPlugin, {
  type GoogleSignInPluginOptions,
} from "vue3-google-signin";

createApp(App)
  .use(
    GoogleSignInButtonPlugin,
    {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    } satisfies GoogleSignInPluginOptions,
  )
  .mount("#app");
