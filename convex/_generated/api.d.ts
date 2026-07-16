/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as AdminActions from "../AdminActions.js";
import type * as ProfileActions from "../ProfileActions.js";
import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as authActions from "../authActions.js";
import type * as cleaup from "../cleaup.js";
import type * as profile from "../profile.js";
import type * as rankings from "../rankings.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  AdminActions: typeof AdminActions;
  ProfileActions: typeof ProfileActions;
  admin: typeof admin;
  auth: typeof auth;
  authActions: typeof authActions;
  cleaup: typeof cleaup;
  profile: typeof profile;
  rankings: typeof rankings;
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
