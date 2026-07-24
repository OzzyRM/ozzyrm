import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { roleEnum } from "./enums";

/** Application users */
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name"),
    role: roleEnum("role").notNull().default("user"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});
