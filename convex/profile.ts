import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

async function getUserByToken(ctx: any, token: string) {
  return await ctx.db.query("testers").withIndex("by_session", (q: any) => q.eq("session_token", token)).first();
}

export const getProfileData = query({
  args: { token: v.optional(v.string()), userId: v.optional(v.id("testers")), mc_name: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.userId) return await ctx.db.get(args.userId);
    if (args.mc_name) {
      // Case-insensitive search for mc_name
      const testers = await ctx.db.query("testers").collect();
      return testers.find(t => (t.mc_name || "").toLowerCase() === args.mc_name!.toLowerCase());
    }
    if (args.token) {
      const user = await getUserByToken(ctx, args.token);
      if (!user) return null;
      const { password_hash, encrypted_password, session_token, ...safeUser } = user;
      return safeUser;
    }
    return null;
  }
});

export const getProfileStats = query({
  args: { mc_name: v.string() },
  handler: async (ctx, args) => {
    const players = await ctx.db.query("players").collect();
    // Case-insensitive filter for tiers
    const testerRows = players.filter(p => (p.name || "").toLowerCase() === args.mc_name.toLowerCase());
    
    const POINTS: any = { HT1:60,LT1:45,HT2:30,LT2:20,HT3:10,LT3:6,HT4:4,LT4:3,HT5:2,LT5:1 };
    
    const pointsMap = new Map();
    players.forEach(p => {
      if (!POINTS[p.tier]) return;
      pointsMap.set((p.name || "").toLowerCase(), (pointsMap.get((p.name || "").toLowerCase()) || 0) + POINTS[p.tier]);
    });
    
    const sortedPlayers = [...pointsMap.entries()].sort((a, b) => b[1] - a[1]);
    const rankIndex = sortedPlayers.findIndex(([name]) => name === args.mc_name.toLowerCase());
    const rank = rankIndex !== -1 ? rankIndex + 1 : 0;
    const userPoints = testerRows.reduce((sum, p) => sum + (POINTS[p.tier] || 0), 0);
    
    return { tiers: testerRows, rank, points: userPoints };
  }
});

export const updateBio = mutation({
  args: { token: v.string(), bio: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserByToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");
    await ctx.db.patch(user._id, { bio: args.bio });
    return true;
  }
});

export const updateName = mutation({
  args: { token: v.string(), newName: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserByToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");
    const oldName = user.mc_name;
    
    // Case-insensitive check if the new name is already taken
    const allTesters = await ctx.db.query("testers").collect();
    const existing = allTesters.find(t => (t.mc_name || "").toLowerCase() === args.newName.toLowerCase());
    if (existing && existing._id !== user._id) throw new Error("That username is already taken!");
    
    await ctx.db.patch(user._id, { mc_name: args.newName, username: args.newName, display_name: args.newName });
    
    // Case-insensitive fetch of all player rows to move them to the new name
    if (oldName) {
      const allPlayers = await ctx.db.query("players").collect();
      const playerRows = allPlayers.filter(p => (p.name || "").toLowerCase() === oldName.toLowerCase());
      for (const p of playerRows) {
        await ctx.db.patch(p._id, { name: args.newName });
      }
    }
    return true;
  }
});

export const updateRegion = mutation({
  args: { token: v.string(), region: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserByToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");
    await ctx.db.patch(user._id, { region: args.region });
    
    // Case-insensitive fetch of all player rows to update their region
    if (user.mc_name) {
      const allPlayers = await ctx.db.query("players").collect();
      const playerRows = allPlayers.filter(p => (p.name || "").toLowerCase() === user.mc_name.toLowerCase());
      for (const p of playerRows) {
        await ctx.db.patch(p._id, { region: args.region });
      }
    }
    return true;
  }
});

export const generateDiscordCode = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserByToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await ctx.db.patch(user._id, { discord_link_code: code });
    return code;
  }
});

export const getUserForPasswordChange = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("testers").withIndex("by_session", (q: any) => q.eq("session_token", args.token)).first();
  }
});

export const internalUpdatePassword = mutation({
  args: { userId: v.id("testers"), hash: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { password_hash: args.hash });
    return true;
  }
});