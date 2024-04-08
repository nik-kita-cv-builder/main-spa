// @deno-types='npm:xstate'
import { createActor } from "xstate";
import { machine as auth_machine, utils } from "./auth.machine.ts";

Deno.test("auth.machine", async () => {
  (utils as any).get_auth_payload = () => {
    return {
      access_token: "access",
      refresh_token: "refresh",
    };
  };
  const actor = createActor(auth_machine, {});

  actor.subscribe((s) => {
    console.log(s.value);
  });

  actor.start();

  await new Promise((resolve) => setTimeout(resolve, 1000));

  actor.send({ type: "LOGOUT" });

  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log(actor.getSnapshot().context);
  actor.stop();
});
