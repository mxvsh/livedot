import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const docs = defineCollection({
  loader: glob({
    pattern: "docs/*.md",
    base: "./src/content",
    generateId: ({ entry }) => entry.replace(/^docs\//, "").replace(/\.md$/, ""),
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number().default(999),
  }),
});

export const collections = {
  docs,
};
