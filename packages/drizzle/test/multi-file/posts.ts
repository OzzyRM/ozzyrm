import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const posts = pgTable("posts", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    content: text("content"),
    authorId: integer("author_id").notNull().references(() => users.id),
    publishedAt: timestamp("published_at"),
});
