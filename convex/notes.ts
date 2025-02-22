import { query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

// Get all notes for a user
export const getNotes = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get notes by folder
export const getNotesByFolder = query({
  args: { folderId: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .withIndex("by_folder", (q) => q.eq("folderId", args.folderId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
  },
});

// Get folders for a user
export const getFolders = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("folders")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Search notes by content or title
export const searchNotes = query({
  args: {
    searchText: v.string(),
    userId: v.string(),
    folderId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const contentResults = await ctx.db
      .query("notes")
      .withSearchIndex("search_content", (q) =>
        q.search("content", args.searchText)
      )
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    const titleResults = await ctx.db
      .query("notes")
      .withSearchIndex("search_title", (q) =>
        q.search("title", args.searchText)
      )
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    // Combine results
    const allResults = [...contentResults, ...titleResults];
    
    // Deduplicate by _id
    const uniqueMap = new Map<string, Doc<"notes">>();
    allResults.forEach((note) => {
      uniqueMap.set(note._id.toString(), note);
    });
    
    return Array.from(uniqueMap.values());
  },
});

// Get notes by tag
export const getNotesByTag = query({
  args: { tag: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    return notes.filter(note => note.tags.includes(args.tag));
  },
});