import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  players: defineTable({
    name: v.string(),
    category: v.union(
      v.literal("sword"), v.literal("axe"), v.literal("crystal"),
      v.literal("nethpot"), v.literal("pot"), v.literal("uhc"),
      v.literal("smp"), v.literal("mace")
    ),
    tier: v.string(),
    region: v.optional(v.string()),
    tester: v.optional(v.boolean()),
    created_at: v.optional(v.number()),
    updated_at: v.optional(v.number()),
    last_tested_at: v.optional(v.number()),
  }).index("by_name", ["name"]),

  testers: defineTable({
    username: v.string(),
    display_name: v.string(),
    is_admin: v.optional(v.boolean()),
    created_at: v.optional(v.number()),
    email: v.optional(v.string()),
    can_test: v.optional(v.boolean()),
    user_id: v.optional(v.string()),
    status: v.union(
      v.literal("pending"), v.literal("registered"), v.literal("approved"),
      v.literal("suspended"), v.literal("rejected")
    ),
    mc_name: v.optional(v.string()),
    region: v.optional(v.string()),
    app_tiers: v.optional(v.any()),
    app_answers: v.optional(v.any()),
    sign_up_ip: v.optional(v.string()),
    last_sign_in_ip: v.optional(v.string()),
    admin_message: v.optional(v.string()),
    bio: v.optional(v.string()),
    role: v.optional(v.string()),
    discord_id: v.optional(v.string()),
    discord_link_code: v.optional(v.string()),
    discord_username: v.optional(v.string()),
    suspended_until: v.optional(v.number()),
    suspend_reason: v.optional(v.string()),
    strikes: v.optional(v.number()),
    quota_progress: v.optional(v.number()),
    quota_exempt: v.optional(v.boolean()),
    // Custom Auth fields for Supabase migration:
    password_hash: v.optional(v.string()),
    session_token: v.optional(v.string()),
  })
  .index("by_email", ["email"])
  .index("by_username", ["username"])
  .index("by_mc_name", ["mc_name"])
  .index("by_session", ["session_token"]),

  player_testers: defineTable({
    player_name: v.string(),
    tester_name: v.string(),
    created_at: v.optional(v.number()),
  }).index("by_player_name", ["player_name"]),

  site_settings: defineTable({
    allow_registration: v.optional(v.boolean()),
    allow_applications: v.optional(v.boolean()),
    rejected_expiration_days: v.optional(v.number()),
    queue_cooldown_hours: v.optional(v.number()),
    quota_limit: v.optional(v.number()),
    quota_ends_at: v.optional(v.number()),
    strike_limit: v.optional(v.number()),
  }),

  banned_ips: defineTable({
    ip_address: v.string(),
    banned_at: v.optional(v.number()),
    banned_by: v.optional(v.string()),
  }).index("by_ip", ["ip_address"]),

  password_backup: defineTable({
    email: v.optional(v.string()),
    encrypted_password: v.optional(v.string()),
    created_at: v.optional(v.number()),
    last_sign_in_at: v.optional(v.number()),
  }),
});