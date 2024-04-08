import { useActorRef, useSelector } from "@xstate/vue";
import { defineStore } from "pinia";
import { machine } from "./machines/auth.machine";

export const useAuthStore = defineStore("auth", () => {
  const auth_actor_ref = useActorRef(machine);
  const select_auth_payload = useSelector(auth_actor_ref, (state) => {
    console.log("-----------------------------");
    console.log(state.value);
    console.log(state.context);
    console.log("-----------------------------");
    return {
      isAuthenticated: state.matches("User"),
      access: state.context.access_token,
      refresh: state.context.refresh_token,
    };
  });

  return {
    auth_actor_ref,
    select_auth_payload,
  };
});
