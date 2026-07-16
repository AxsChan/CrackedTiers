"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// ==========================================
// LOGIN ACTION
// ==========================================
export const login = action({
  args: { loginInput: v.string(), password: v.string(), captchaToken: v.string() },
  handler: async (ctx, args) => {
    // 1. Verify Captcha
    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY as string,
        response: args.captchaToken,
      }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.success) throw new Error("Captcha verification failed.");

    // 2. Find User
    let user = null;
    if (args.loginInput.includes('@')) {
      user = await ctx.runQuery("auth:getUserByEmail", { email: args.loginInput });
    } else {
      user = await ctx.runQuery("auth:getUserByUsername", { username: args.loginInput });
    }

    if (!user) throw new Error("User not found. Check your spelling.");

    // 3. Check Password Hash
    const passHash = user.password_hash || user.encrypted_password;
    if (!passHash) throw new Error("User found, but no password is set in the database.");

    const isMatch = bcrypt.compareSync(args.password, passHash);
    if (!isMatch) throw new Error("Password is incorrect.");

    // 4. Create Session
    const sessionToken = crypto.randomBytes(32).toString("hex");
    await ctx.runMutation("auth:saveSessionToken", { userId: user._id, token: sessionToken });

    return { token: sessionToken, user_id: user._id };
  },
});

// ==========================================
// REGISTER ACTION
// ==========================================
export const register = action({
  args: { 
    email: v.string(), 
    password: v.string(), 
    mc_name: v.string(), 
    region: v.string(), 
    ip: v.string() 
  },
  handler: async (ctx, args) => {
    const settings = await ctx.runQuery("auth:getSettings");
    if (settings && !settings.allow_registration) throw new Error("Registration is currently closed.");

    const isBanned = await ctx.runQuery("auth:checkIpBan", { ip: args.ip });
    if (isBanned) throw new Error("Your IP address has been banned.");

    const existingMc = await ctx.runQuery("auth:getTesterByMcName", { mc_name: args.mc_name });
    if (existingMc) throw new Error("That Minecraft username is already taken!");

    const existingEmail = await ctx.runQuery("auth:getUserByEmail", { email: args.email });
    if (existingEmail) throw new Error("That email is already in use!");

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(args.password, salt);
    const sessionToken = crypto.randomBytes(32).toString("hex");

    const userId = await ctx.runMutation("auth:insertTester", {
      email: args.email, 
      password_hash: hash, 
      mc_name: args.mc_name,
      username: args.mc_name, 
      display_name: args.mc_name, 
      region: args.region,
      sign_up_ip: args.ip, 
      last_sign_in_ip: args.ip, 
      session_token: sessionToken
    });

    return { token: sessionToken, user_id: userId };
  },
});