import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// FIX: Made case-insensitive so users can log in regardless of capital letters
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const testers = await ctx.db.query("testers").collect();
    return testers.find(t => (t.email || "").toLowerCase() === args.email.toLowerCase());
  },
});

// FIX: Checks both username AND mc_name, and is completely case-insensitive
export const getUserByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const testers = await ctx.db.query("testers").collect();
    const searchTerm = args.username.toLowerCase();
    return testers.find(t => 
      (t.username || "").toLowerCase() === searchTerm || 
      (t.mc_name || "").toLowerCase() === searchTerm
    );
  },
});

export const saveSessionToken = mutation({
  args: { userId: v.id("testers"), token: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { session_token: args.token });
  },
});

export const getCurrentUser = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.token) return null;
    const user = await ctx.db.query("testers").withIndex("by_session", (q) => q.eq("session_token", args.token)).first();
    if (!user) return null;
    const { password_hash, encrypted_password, session_token, ...safeUser } = user;
    return safeUser;
  },
});

export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("site_settings").first();
  },
});

export const checkIpBan = query({
  args: { ip: v.string() },
  handler: async (ctx, args) => {
    const ban = await ctx.db.query("banned_ips").withIndex("by_ip", q => q.eq("ip_address", args.ip)).first();
    return !!ban;
  },
});

export const getTesterByMcName = query({
  args: { mc_name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("testers").withIndex("by_mc_name", q => q.eq("mc_name", args.mc_name)).first();
  },
});

export const insertTester = mutation({
  args: {
    email: v.string(), password_hash: v.string(), mc_name: v.string(),
    username: v.string(), display_name: v.string(), region: v.string(),
    sign_up_ip: v.string(), last_sign_in_ip: v.string(), session_token: v.string()
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("testers", {
      email: args.email, password_hash: args.password_hash, mc_name: args.mc_name,
      username: args.username, display_name: args.display_name, region: args.region,
      sign_up_ip: args.sign_up_ip, last_sign_in_ip: args.last_sign_in_ip, session_token: args.session_token,
      status: "registered", role: "tester", is_admin: false, can_test: true,
      created_at: Date.now(), strikes: 0, quota_progress: 0, quota_exempt: false
    });
  },
});

export const clearRejection = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("testers").withIndex("by_session", q => q.eq("session_token", args.token)).first();
    if (!user) throw new Error("Unauthorized");
    await ctx.db.patch(user._id, { status: "registered", admin_message: undefined });
    return true;
  },
});

export const submitApplication = mutation({
  args: { token: v.string(), app_answers: v.any() },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("testers").withIndex("by_session", q => q.eq("session_token", args.token)).first();
    if (!user) throw new Error("Unauthorized");
    await ctx.db.patch(user._id, { app_answers: args.app_answers, status: "pending", admin_message: undefined });
    return true;
  },
});

// Added to fix the infinite spam loop on the frontend
export const clearAdminMessage = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("testers")
      .withIndex("by_session", (q) => q.eq("session_token", args.token))
      .first();
    if (!user) throw new Error("Unauthorized");
    
    await ctx.db.patch(user._id, { admin_message: undefined });
    return true;
  },
});