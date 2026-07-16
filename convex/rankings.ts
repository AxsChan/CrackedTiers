import { query } from "./_generated/server";
import { v } from "convex/values";

// Used by index.html to load the leaderboard
export const getRankingsData = query({
  args: {},
  handler: async (ctx) => {
    const testers = await ctx.db.query("testers").collect();
    const players = await ctx.db.query("players").collect();

    const suspendedNames = new Set(
      testers
        .filter((t) => t.status === "suspended")
        .map((t) => (t.mc_name || t.username || "").toLowerCase())
    );

    const testerNames = new Set(
      testers
        .filter((t) => t.status === "approved")
        .map((t) => (t.mc_name || "").toLowerCase())
    );

    return {
      players: players.filter((p) => !suspendedNames.has(p.name.toLowerCase())),
      testerNames: Array.from(testerNames),
    };
  },
});

// Used by index.html modal to get the profile link
export const getTesterByMcName = query({
  args: { mc_name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("testers")
      .withIndex("by_mc_name", (q) => q.eq("mc_name", args.mc_name))
      .first();
  },
});

// Used by home.html to display the staff team
export const getStaff = query({
  args: {},
  handler: async (ctx) => {
    const testers = await ctx.db
      .query("testers")
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();
      
    return testers.map((t) => ({
      _id: t._id,
      mc_name: t.mc_name,
      role: t.role,
    }));
  },
});