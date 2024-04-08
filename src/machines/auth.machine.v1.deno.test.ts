import { assertEquals, assertNotEquals } from "@std/assert";
// @deno-types='npm:xstate'
import { assign, createActor, fromPromise, setup } from "xstate";

type Ctx = {
  access_token: null | string;
  refresh_token: null | string;
};

export const impl = {
  get_auth_payload: () => {
    const refresh_token = localStorage.getItem("refresh_token");

    if (refresh_token) {
      return {
        access_token: localStorage.getItem("access_token"),
        refresh_token,
      };
    }

    return { access_token: null, refresh_token: null };
  },
  clean_auth_payload: () => {
    return {
      access_token: null,
      refresh_token: null,
    };
  },
};

export const auth_machine_v1 = setup({
  types: {
    context: {} as Ctx,
    events: {} as
      | { type: "LOGOUT" }
      | { type: "ACCESS_EXPIRED" }
      | { type: "SIGN_IN_WITH_GOOGLE_START" }
      | { type: "SIGN_IN_WITH_GOOGLE_FAIL" }
      | { type: "SIGN_IN_WITH_GOOGLE_SUCCESS" },
  },
  actions: {
    update_auth: assign(() => {
      console.log("action: update_auth");
      return impl.get_auth_payload();
    }),
    clean_auth: assign(() => {
      console.log("action: clean_auth");
      return impl.clean_auth_payload();
    }),
  },
  actors: {
    api_auth_me: fromPromise(async () => {
      console.log("actor: api_auth_me");
      return {
        id: 1,
        name: "nik",
      };
    }),
    api_auth_refresh: fromPromise(async () => {
      return {
        access_token: "access",
        refresh_token: "refresh",
      };
    }),
    api_auth_sing_in: fromPromise(async () => {
      return {
        access_token: "access",
        refresh_token: "refresh",
      };
    }),
  },
  guards: {
    is_not_refresh: function (
      _,
      { refresh_token }: Pick<
        Ctx,
        "refresh_token"
      >,
    ) {
      return !refresh_token;
    },
    is_access: function (_, { access_token }: Pick<Ctx, "access_token">) {
      console.log("guard: is_access", access_token);
      return !!access_token;
    },
  },
}).createMachine({
  context: {
    access_token: null,
    refresh_token: null,
  },
  id: "cv-builder/auth",
  initial: "Guest",
  entry: [
    {
      type: "update_auth",
    },
  ],
  states: {
    Guest: {
      initial: "Exchanging_visitor",
      on: {
        SIGN_IN_WITH_GOOGLE_START: {
          target: "#cv-builder/auth.Guest.Processing_google_sign_in",
        },
      },
      states: {
        Exchanging_visitor: {
          always: [
            {
              target: "#cv-builder/auth.Guest",
              guard: {
                type: "is_not_refresh",
                params: ({ context }) => {
                  return {
                    refresh_token: context.refresh_token,
                  };
                },
              },
            },
            {
              target: "Checking_access_token",
              guard: {
                type: "is_access",
                params: ({ context }) => {
                  return {
                    access_token: context.access_token,
                  };
                },
              },
            },
            {
              target: "Refreshing",
            },
          ],
        },
        Checking_access_token: {
          invoke: {
            id: "api/auth/me",
            input: {},
            onDone: {
              target: "#cv-builder/auth.User",
            },
            onError: {
              target: "Refreshing",
            },
            src: "api_auth_me",
          },
        },
        Refreshing: {
          invoke: {
            id: "api/auth/refresh",
            input: {},
            onDone: {
              target: "#cv-builder/auth.User",
              actions: [
                {
                  type: "update_auth",
                },
              ],
            },
            onError: {
              target: "#cv-builder/auth.Guest",
              actions: [
                {
                  type: "clean_auth",
                },
              ],
            },
            src: "api_auth_refresh",
          },
        },
        Processing_google_sign_in: {
          initial: "Waiting_for_user_consent",
          states: {
            Waiting_for_user_consent: {
              on: {
                SIGN_IN_WITH_GOOGLE_SUCCESS: {
                  target: "#cv-builder/auth.Guest.Getting_auth_jwt_tokens",
                },
                SIGN_IN_WITH_GOOGLE_FAIL: {
                  target: "#cv-builder/auth.Guest",
                },
              },
            },
          },
        },
        Getting_auth_jwt_tokens: {
          invoke: {
            id: "api/auth/sign-in",
            input: {},
            onDone: {
              target: "#cv-builder/auth.User",
            },
            onError: {
              target: "#cv-builder/auth.Guest",
            },
            src: "api_auth_sing_in",
          },
        },
      },
    },
    User: {
      initial: "Active_session",
      on: {
        LOGOUT: {
          target: "Guest",
          actions: [
            {
              type: "clean_auth",
            },
          ],
        },
      },
      states: {
        Active_session: {
          on: {
            ACCESS_EXPIRED: {
              target: "Refreshing_session",
            },
          },
        },
        Refreshing_session: {
          invoke: {
            id: "api/auth/refresh",
            input: {},
            onDone: {
              target: "Active_session",
              actions: [
                {
                  type: "update_auth",
                },
              ],
            },
            onError: {
              target: "#cv-builder/auth.Guest",
              actions: [
                {
                  type: "clean_auth",
                },
              ],
            },
            src: "api_auth_refresh",
          },
        },
      },
    },
  },
});

Deno.test("Should check prev auth session and return to Guest state", async (t) => {
  await t.step("refresh_token is missing", () => {
    (impl as any).get_auth_payload = () => {
      return {
        access_token: "access",
        refresh_token: null,
      };
    };
    const actor = createActor(auth_machine_v1, {});
    assertEquals(actor.getSnapshot().value, { Guest: "Exchanging_visitor" });
    actor.subscribe((s) => {
      console.log(s.value);
    });
    actor.start();
    assertEquals(actor.getSnapshot().value, { Guest: "Exchanging_visitor" });
    actor.stop();
  });

  await t.step("both tokens are missing", () => {
    (impl as any).get_auth_payload = () => {
      return {
        access_token: null,
        refresh_token: null,
      };
    };
    const actor = createActor(auth_machine_v1, {});
    assertEquals(actor.getSnapshot().value, { Guest: "Exchanging_visitor" });
    actor.subscribe((s) => {
      console.log(s.value);
    });
    actor.start();
    assertEquals(actor.getSnapshot().value, { Guest: "Exchanging_visitor" });
    actor.stop();
  });
});

Deno.test("Should check prev auth session and transmit to User state", async (t) => {
  await t.step("access_token is actual", async () => {
    (impl as any).get_auth_payload = () => {
      return {
        access_token: "access",
        refresh_token: "refresh",
      };
    };
    const actor = createActor(auth_machine_v1, {});
    assertEquals(actor.getSnapshot().value, { Guest: "Checking_access_token" });
    actor.subscribe((s) => {
      console.log(s.value);
    });
    actor.start();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assertEquals(actor.getSnapshot().value, { User: "Active_session" });
    actor.stop();
  });
  await t.step("access_token is not actual, but refresh is", async () => {
    (impl as any).get_auth_payload = () => {
      return {
        access_token: null,
        refresh_token: "refresh",
      };
    };
    const actor = createActor(auth_machine_v1, {});
    assertNotEquals(actor.getSnapshot().value, {
      Guest: "Checking_access_token",
    });
    actor.subscribe((s) => {
      console.log(s.value);
    });
    actor.start();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assertEquals(actor.getSnapshot().value, { User: "Active_session" });
    actor.stop();
  });
});
