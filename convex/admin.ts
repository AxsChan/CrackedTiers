import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

async function requireAdmin(ctx: any, token: string) {
  const user = await ctx.db.query("testers").withIndex("by_session", (q: any) => q.eq("session_token", token)).first();
  if (!user) throw new Error("Unauthorized: Not logged in.");
  if (user.status !== 'approved' || !['admin', 'owner', 'superadmin'].includes(user.role || '')) {
    throw new Error("Unauthorized: Admin access required.");
  }
  return user;
}

export const searchTesters = query({
  args: { term: v.string() },
  handler: async (ctx, args) => {
    if (!args.term) return [];
    const testers = await ctx.db.query("testers").collect();
    return testers.filter(t => (t.mc_name || "").toLowerCase().includes(args.term.toLowerCase()) || (t.username || "").toLowerCase().includes(args.term.toLowerCase())).slice(0, 10).map(t => ({ mc_name: t.mc_name, username: t.username }));
  }
});

export const getTesterByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("testers").withIndex("by_mc_name", q => q.eq("mc_name", args.name)).first();
  }
});

export const getPlayerTiers = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("players").filter(q => q.eq(q.field("name"), args.name)).collect();
  }
});

export const getAltsByIp = query({
  args: { userId: v.id("testers") },
  handler: async (ctx, args) => {
    const target = await ctx.db.get(args.userId);
    if (!target) return [];
    const testers = await ctx.db.query("testers").collect();
    return testers.filter(t => t._id !== args.userId && (t.sign_up_ip === target.sign_up_ip || t.last_sign_in_ip === target.last_sign_in_ip)).map(t => t.mc_name || t.username);
  }
});

export const savePlayer = mutation({
  args: { token: v.string(), currentName: v.string(), newMcName: v.string(), region: v.string(), bio: v.string(), tiers: v.any() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const tester = await ctx.db.query("testers").withIndex("by_mc_name", q => q.eq("mc_name", args.currentName)).first();
    if (tester) {
      await ctx.db.patch(tester._id, { mc_name: args.newMcName, username: args.newMcName, region: args.region, bio: args.bio });
    }
    const existingPlayers = await ctx.db.query("players").filter(q => q.eq(q.field("name"), args.currentName)).collect();
    for (const p of existingPlayers) { await ctx.db.delete(p._id); }
    const isTester = tester?.status === "approved";
    for (const tier of args.tiers) {
      if (tier.tier) {
        await ctx.db.insert("players", { name: args.newMcName, category: tier.category, tier: tier.tier, region: args.region, tester: isTester, updated_at: Date.now() });
      }
    }
    return true;
  }
});

export const internalUpdatePassword = mutation({
  args: { token: v.string(), userId: v.id("testers"), hash: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    await ctx.db.patch(args.userId, { password_hash: args.hash });
    return true;
  }
});

export const suspend = mutation({
  args: { token: v.string(), userId: v.id("testers"), durationMs: v.number(), reason: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("User not found");
    if (target.role === 'superadmin' && admin.role !== 'superadmin') throw new Error("Cannot suspend superadmin");
    await ctx.db.patch(args.userId, { status: "suspended", suspended_until: Date.now() + args.durationMs, admin_message: args.reason, suspend_reason: args.reason });
    return true;
  }
});

export const unsuspend = mutation({
  args: { token: v.string(), userId: v.id("testers") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("User not found");
    const restoreStatus = (target.role === 'admin' || target.role === 'owner' || target.role === 'superadmin' || target.app_answers) ? 'approved' : 'registered';
    await ctx.db.patch(args.userId, { status: restoreStatus, suspended_until: undefined, admin_message: undefined, suspend_reason: undefined });
    return true;
  }
});

export const banIp = mutation({
  args: { token: v.string(), ip: v.string(), banned_by: v.id("testers") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const existing = await ctx.db.query("banned_ips").withIndex("by_ip", q => q.eq("ip_address", args.ip)).first();
    if (!existing) { await ctx.db.insert("banned_ips", { ip_address: args.ip, banned_at: Date.now(), banned_by: args.banned_by }); }
    return true;
  }
});

export const unbanIp = mutation({
  args: { token: v.string(), ip: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const existing = await ctx.db.query("banned_ips").withIndex("by_ip", q => q.eq("ip_address", args.ip)).first();
    if (existing) { await ctx.db.delete(existing._id); }
    return true;
  }
});

export const deleteAccount = mutation({
  args: { token: v.string(), userId: v.id("testers") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("User not found");
    if (target.role === 'superadmin' && admin.role !== 'superadmin') throw new Error("Cannot delete superadmin");
    const players = await ctx.db.query("players").filter(q => q.eq(q.field("name"), target.mc_name)).collect();
    for (const p of players) { await ctx.db.delete(p._id); }
    await ctx.db.delete(args.userId);
    return true;
  }
});

export const getPending = query({
  args: { searchTerm: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let testers = await ctx.db.query("testers").filter(q => q.eq(q.field("status"), "pending")).collect();
    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
      testers = testers.filter(t => (t.username || "").toLowerCase().includes(term) || (t.email || "").toLowerCase().includes(term) || (t.mc_name || "").toLowerCase().includes(term));
    }
    return testers.sort((a,b) => (b.created_at||0) - (a.created_at||0));
  }
});

export const approveApp = mutation({
  args: { token: v.string(), userId: v.id("testers"), msg: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    await ctx.db.patch(args.userId, { status: "approved", admin_message: args.msg || undefined });
    return true;
  }
});

export const rejectApp = mutation({
  args: { token: v.string(), userId: v.id("testers"), reason: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    await ctx.db.patch(args.userId, { status: "rejected", app_answers: undefined, admin_message: args.reason });
    return true;
  }
});

export const rejectAllApps = mutation({
  args: { token: v.string(), reason: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const pending = await ctx.db.query("testers").filter(q => q.eq(q.field("status"), "pending")).collect();
    for (const p of pending) { await ctx.db.patch(p._id, { status: "rejected", app_answers: undefined, admin_message: args.reason }); }
    return pending.length;
  }
});

export const clearRejection = mutation({
  args: { token: v.string(), userId: v.id("testers") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    await ctx.db.patch(args.userId, { status: "registered", app_answers: undefined, admin_message: undefined });
    return true;
  }
});

export const getActive = query({
  args: { searchTerm: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let testers = await ctx.db.query("testers").filter(q => q.eq(q.field("status"), "approved")).collect();
    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
      testers = testers.filter(t => (t.username || "").toLowerCase().includes(term) || (t.email || "").toLowerCase().includes(term) || (t.mc_name || "").toLowerCase().includes(term));
    }
    return testers.sort((a,b) => (b.created_at||0) - (a.created_at||0));
  }
});

export const updateRole = mutation({
  args: { token: v.string(), userId: v.id("testers"), role: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("User not found");
    if (target.role === 'superadmin' && admin.role !== 'superadmin') throw new Error("Cannot edit superadmin");
    if (args.role === 'superadmin' && admin.role !== 'superadmin') throw new Error("Only superadmins can assign superadmin");
    await ctx.db.patch(args.userId, { role: args.role });
    return true;
  }
});

export const removeTester = mutation({
  args: { token: v.string(), userId: v.id("testers") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("User not found");
    if (target.role === 'superadmin' && admin.role !== 'superadmin') throw new Error("Cannot demote superadmin");
    await ctx.db.patch(args.userId, { status: "registered", role: "tester", app_answers: undefined });
    const players = await ctx.db.query("players").filter(q => q.eq(q.field("name"), target.mc_name)).collect();
    for (const p of players) { await ctx.db.patch(p._id, { tester: false }); }
    return true;
  }
});

export const getRejected = query({
  args: { searchTerm: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let testers = await ctx.db.query("testers").filter(q => q.eq(q.field("status"), "rejected")).collect();
    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
      testers = testers.filter(t => (t.username || "").toLowerCase().includes(term) || (t.email || "").toLowerCase().includes(term) || (t.mc_name || "").toLowerCase().includes(term));
    }
    return testers.sort((a,b) => (b.created_at||0) - (a.created_at||0));
  }
});

export const getSuspended = query({
  args: { searchTerm: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let testers = await ctx.db.query("testers").filter(q => q.eq(q.field("status"), "suspended")).collect();
    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
      testers = testers.filter(t => (t.username || "").toLowerCase().includes(term) || (t.email || "").toLowerCase().includes(term) || (t.mc_name || "").toLowerCase().includes(term));
    }
    return testers.sort((a,b) => (b.created_at||0) - (a.created_at||0));
  }
});

export const getBannedIps = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("banned_ips").collect();
  }
});

export const updateSettings = mutation({
  args: { token: v.string(), field: v.string(), value: v.any() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const settings = await ctx.db.query("site_settings").first();
    if (settings) {
      await ctx.db.patch(settings._id, { [args.field]: args.value });
    } else {
      const newSettings: any = { allow_registration: true, allow_applications: true, rejected_expiration_days: 0, queue_cooldown_hours: 1, quota_limit: 0, strike_limit: 3 };
      newSettings[args.field] = args.value;
      await ctx.db.insert("site_settings", newSettings);
    }
    return true;
  }
});