import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

// Create or update a user
export const createOrUpdateUser = mutation({
  args: {
    tokenIdentifier: v.string(),
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .first();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        email: args.email,
      });
      return existingUser._id;
    }

    return await ctx.db.insert("users", args);
  },
});

// Create a new folder
export const createFolder = mutation({
  args: {
    name: v.string(),
    emoji: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("folders", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update a folder
export const updateFolder = mutation({
  args: {
    id: v.id("folders"),
    name: v.optional(v.string()),
    emoji: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete a folder
export const deleteFolder = mutation({
  args: {
    id: v.id("folders"),
  },
  handler: async (ctx, args) => {
    // First, update all notes in this folder to have no folder
    const notesInFolder = await ctx.db
      .query("notes")
      .withIndex("by_folder", (q) => q.eq("folderId", args.id.toString()))
      .collect();

    for (const note of notesInFolder) {
      await ctx.db.patch(note._id, { folderId: undefined });
    }

    // Then delete the folder
    await ctx.db.delete(args.id);
  },
});

// Create a new note
export const createNote = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    userId: v.string(),
    folderId: v.optional(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("notes", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update an existing note
export const updateNote = mutation({
  args: {
    id: v.id("notes"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    folderId: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
}); 