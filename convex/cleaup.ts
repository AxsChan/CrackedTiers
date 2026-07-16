import { mutation } from "./_generated/server";

export const clearPasswordBackup = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all documents in the password_backup table
    const docs = await ctx.db.query("password_backup").collect();
    
    // Loop through and delete every single one
    for (const doc of docs) {
      await ctx.db.delete(doc._id);
    }
    
    return { success: true, deleted: docs.length };
  },
});