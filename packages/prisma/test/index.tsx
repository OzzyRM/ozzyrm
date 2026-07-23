
import path from "path";
import { PrismaParser } from "../src/index";

const parser = new PrismaParser();
const result = await parser.parse({
  orm: "prisma",
  include: [path.join(__dirname, "..", "/test/schema.prisma")],
});

console.log(JSON.stringify(result, null, 2));