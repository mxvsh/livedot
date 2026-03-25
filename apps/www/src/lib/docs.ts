import { getCollection, type CollectionEntry } from "astro:content";

export type DocsNavItem = {
  slug: string;
  title: string;
  description: string;
  href: string;
};

type DocsEntry = CollectionEntry<"docs">;

const sortDocs = (items: DocsEntry[]) =>
  items.sort((a, b) => {
    const orderDelta = a.data.order - b.data.order;
    return orderDelta !== 0 ? orderDelta : a.data.title.localeCompare(b.data.title);
  });

export async function getDocsNavItems() {
  const docs = sortDocs(await getCollection("docs"));

  return docs.map((doc) => ({
    id: doc.id,
    title: doc.data.title,
    description: doc.data.description,
    href: `/help/${doc.id}`,
  }));
}

export async function getDocsEntry(id: string) {
  const docs = await getCollection("docs");
  return docs.find((doc) => doc.id === id) ?? null;
}
