"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";

export const changePassword = action({
  args: { token: v.string(), currentPass: v.string(), newPass: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery("profile:getUserForPasswordChange", { token: args.token });
    if (!user || !user.password_hash) throw new Error("User not found.");
    
    const isMatch = bcrypt.compareSync(args.currentPass, user.password_hash);
    if (!isMatch) throw new Error("Current password is incorrect");
    
    const hash = bcrypt.hashSync(args.newPass, 10);
    await ctx.runMutation("profile:internalUpdatePassword", { userId: user._id, hash });
    return true;
  }
});