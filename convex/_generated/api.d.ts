/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _constants from "../_constants.js";
import type * as agent from "../agent.js";
import type * as crons from "../crons.js";
import type * as documents from "../documents.js";
import type * as embeddings from "../embeddings.js";
import type * as ingest from "../ingest.js";
import type * as messages from "../messages.js";
import type * as presence from "../presence.js";
import type * as prompts from "../prompts.js";
import type * as rooms from "../rooms.js";
import type * as tools from "../tools.js";
import type * as userApiKeys from "../userApiKeys.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  _constants: typeof _constants;
  agent: typeof agent;
  crons: typeof crons;
  documents: typeof documents;
  embeddings: typeof embeddings;
  ingest: typeof ingest;
  messages: typeof messages;
  presence: typeof presence;
  prompts: typeof prompts;
  rooms: typeof rooms;
  tools: typeof tools;
  userApiKeys: typeof userApiKeys;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
