import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  players: defineTable({
    id: v.optional(v.any()),
    name: v.optional(v.any()),
    category: v.optional(v.any()),
    tier: v.optional(v.any()),
    region: v.optional(v.any()),
    tester: v.optional(v.any()),
    created_at: v.optional(v.any()),
    updated_at: v.optional(v.any()),
    last_tested_at: v.optional(v.any()),
  }).index("by_name", ["name"]),

  testers: defineTable({
    id: v.optional(v.any()),
    username: v.optional(v.any()),
    display_name: v.optional(v.any()),
    is_admin: v.optional(v.any()),
    created_at: v.optional(v.any()),
    email: v.optional(v.any()),
    can_test: v.optional(v.any()),
    user_id: v.optional(v.any()),
    status: v.optional(v.any()),
    mc_name: v.optional(v.any()),
    region: v.optional(v.any()),
    app_tiers: v.optional(v.any()),
    app_answers: v.optional(v.any()),
    sign_up_ip: v.optional(v.any()),
    last_sign_in_ip: v.optional(v.any()),
    admin_message: v.optional(v.any()),
    bio: v.optional(v.any()),
    role: v.optional(v.any()),
    discord_id: v.optional(v.any()),
    discord_link_code: v.optional(v.any()),
    discord_username: v.optional(v.any()),
    suspended_until: v.optional(v.any()),
    suspend_reason: v.optional(v.any()),
    strikes: v.optional(v.any()),
    quota_progress: v.optional(v.any()),
    quota_exempt: v.optional(v.any()),
    password_hash: v.optional(v.any()),
    encrypted_password: v.optional(v.any()),
    session_token: v.optional(v.any()),
  })
    .index("by_email", ["email"])
    .index("by_username", ["username"])
    .index("by_mc_name", ["mc_name"])
    .index("by_session", ["session_token"]),

  player_testers: defineTable({
    id: v.optional(v.any()),
    player_name: v.optional(v.any()),
    tester_name: v.optional(v.any()),
    created_at: v.optional(v.any()),
  }).index("by_player_name", ["player_name"]),

  site_settings: defineTable({
    id: v.optional(v.any()),
    allow_registration: v.optional(v.any()),
    allow_applications: v.optional(v.any()),
    rejected_expiration_days: v.optional(v.any()),
    queue_cooldown_hours: v.optional(v.any()),
    quota_limit: v.optional(v.any()),
    quota_ends_at: v.optional(v.any()),
    strike_limit: v.optional(v.any()),
  }),

  banned_ips: defineTable({
    id: v.optional(v.any()),
    ip_address: v.optional(v.any()),
    banned_at: v.optional(v.any()),
    banned_by: v.optional(v.any()),
  }).index("by_ip", ["ip_address"]),
});