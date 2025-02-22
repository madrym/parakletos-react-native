import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    tokenIdentifier: v.string(),
  }).index("by_token", ["tokenIdentifier"]),

  folders: defineTable({
    name: v.string(),
    emoji: v.string(),
    userId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["userId"],
    }),

  notes: defineTable({
    title: v.string(),
    content: v.string(),
    userId: v.string(),
    folderId: v.optional(v.string()),
    tags: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_folder", ["folderId"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["userId", "folderId"],
    })
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["userId", "folderId"],
    }),
}); 