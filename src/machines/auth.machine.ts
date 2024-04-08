// @deno-types='npm:xstate'
import { assign, fromPromise, setup } from "xstate";

const _api_url = import.meta.env.VITE_API_URL;
const API_URL = {
  auth: {
    me: `${_api_url}/auth/me`,
    refresh: `${_api_url}/auth/refresh`,
    sign_in: `${_api_url}/auth/sign-in`,
  },
};

export const machine = setup({
  types: {
    input: {} as MachineInput,
    context: {} as MachineCtx,
    events: {} as MachineEvent,
  },
  actions: {
    update_auth: assign(() => {
      return {
        access_token: localStorage.getItem("access_token"),
        refresh_token: localStorage.getItem("refresh_token"),
      };
    }),
    clean_auth: assign(() => {
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("access_token");
      return {
        access_token: null,
        refresh_token: null,
      };
    }),
  },
  actors: {
    api_auth_me: fromPromise(async ({ input }: {
      input: {
        access_token: string;
      };
    }) => {
      const response = await fetch(API_URL.auth.me, {
        method: "get",
        headers: {
          "authorization": `Bearer ${input.access_token}`,
        },
      });
      const jData = await response.json();

      return jData;
    }),
    api_auth_refresh: fromPromise(async ({ input }: {
      input: { refresh_token: string };
    }) => {
      const response = await fetch(API_URL.auth.refresh, {
        method: "post",
        body: JSON.stringify({
          refresh_token: `Bearer ${input.refresh_token}`,
        }),
        headers: {
          "content-type": "application/json",
        },
      });
      const jData = await response.json();

      return jData;
    }),
    api_auth_sing_in: fromPromise(async ({ input }: {
      input: { auth_provider: string; credential: string };
    }) => {
      const response = await fetch(API_URL.auth.sign_in, {
        method: "post",
        body: JSON.stringify(input),
        headers: {
          "content-type": "application/json",
        },
      });
      const jData = await response.json();

      console.log(jData);

      return jData;
    }),
  },
  guards: {
    is_not_refresh: function (
      _,
      { refresh_token }: Pick<
        MachineCtx,
        "refresh_token"
      >,
    ) {
      return !refresh_token;
    },
    is_access: function (
      _,
      { access_token }: Pick<MachineCtx, "access_token">,
    ) {
      return !!access_token;
    },
  },
}).createMachine({
  context: ({ input }) => {
    return {
      access_token: null,
      refresh_token: null,
    };
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
            input: ({ context }) => {
              return {
                access_token: context.access_token!,
              };
            },
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
            id: "api/auth/refresh (guest)",
            input: ({ context }) => {
              return {
                refresh_token: context.refresh_token!,
              };
            },
            onDone: {
              target: "#cv-builder/auth.User",
              actions: [
                {
                  type: "update_auth",
                  params: ({ event }) => {
                    console.log("======");
                    console.log(event);
                    console.log("======");

                    return event.output;
                  },
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
            input: ({ event }) => {
              if (event.type !== "SIGN_IN_WITH_GOOGLE_SUCCESS") {
                throw new Error(
                  `Should be SIGN_IN_WITH_GOOGLE_SUCCESS event here but got ${event.type}`,
                );
              }

              console.log("==========================================");
              console.log(event.payload);
              console.log("==========================================");

              return {
                auth_provider: "google",
                credential: event.payload.credential,
              };
            },
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
      entry: [
        ({ event }) => {
          console.log(
            "// TODO ==================================================================",
          );
          console.log(
            "// TODO ==================================================================",
          );
          console.log(event);
          console.log(
            "// TODO ==================================================================",
          );
          console.log(
            "// TODO ==================================================================",
          );
        },
      ],
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
            id: "api/auth/refresh (user)",
            input: ({ context }) => {
              return {
                refresh_token: context.refresh_token!,
              };
            },
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

type MachineCtx = {
  access_token: null | string;
  refresh_token: null | string;
};

type MachineInput = {};

type MachineEvent =
  | { type: "LOGOUT" }
  | { type: "ACCESS_EXPIRED" }
  | { type: "SIGN_IN_WITH_GOOGLE_START" }
  | { type: "SIGN_IN_WITH_GOOGLE_FAIL" }
  | { type: "SIGN_IN_WITH_GOOGLE_SUCCESS"; payload: { credential: string } };
