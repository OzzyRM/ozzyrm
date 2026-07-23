import { pgEnum, pgTable, serial, text, integer } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);

/** Application users */
export const users = pgTable("users", {
    /** Primary key */
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name"),
    role: roleEnum("role").notNull().default("user"),
});

export const posts = pgTable("posts", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    content: text("content"),
    authorId: integer("author_id").notNull().references(() => users.id),
});
