import vue from "npm:@vitejs/plugin-vue@^4.5.2";
import { defineConfig } from "npm:vite@^5.0.10";

import "npm:@vueuse/core";
import "npm:@xstate/vue";
import "npm:pinia";
import "npm:vue3-google-login";
import "npm:vue@^3";
import "npm:xstate";
/**
 * @description
 * # wtf
 * 1. uncomment and load for first time only
 * 2. get error!
 * 3. comment and load again
 */
// import "npm:@vue/tsconfig/tsconfig.json" with { type: "json" };

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
});
