import { defineCollection, z } from 'astro:content'
import { glob } from "astro/loaders";

const blogCollection = defineCollection({
    loader: glob({ pattern: '**/[^_]*.md', base: "./src/content/blog" }),
    schema: z.object({
        title: z.string(),
        pubDate: z.date(),
        draft: z.boolean().optional().default(false),
        description: z.string().optional().default(''),
        image: z.string().optional().default(''),
        cover: z.string().optional().default(''),
        showCover: z.boolean().optional().default(true),
        slugId: z.string(),
        tags: z.array(z.string()).optional(),
        pinTop: z.number().optional().default(0),
    }),
})

const bookReviewCollection = defineCollection({
    loader: glob({ pattern: '**/[^_]*.md', base: "./src/content/book-review" }),
    schema: z.object({
        title: z.string(),
        pubDate: z.date(),
        draft: z.boolean().optional().default(false),
        description: z.string().optional().default(''),
        image: z.string().optional().default(''),
        cover: z.string().optional().default(''),
        showCover: z.boolean().optional().default(true),
        tags: z.array(z.string()).optional(),
        pinTop: z.number().optional().default(0),
        bookSlug: z.string(),
        rating: z.enum(['recommended', 'neutral', 'not-recommended']).optional(),
    }),
})

const specCollection = defineCollection({
    loader: glob({ pattern: '**/[^_]*.md', base: "./src/content/spec" }),
})

const booksCollection = defineCollection({
    loader: glob({ pattern: '**/[^_]*.md', base: "./src/content/books" }),
    schema: z.object({
        title: z.string(),
        author: z.string(),
        cover: z.string().optional(),
        tags: z.array(z.string()).nonempty(),
        rating: z.enum(['recommended', 'neutral', 'not-recommended']),
        summary: z.string().optional().default(''),
        briefComment: z.string().optional().default(''),
        readDate: z.date().optional(),
        readTimeHours: z.number().nonnegative().optional(),
        year: z.number().int().optional(),
        pinTop: z.number().int().optional().default(0),
        draft: z.boolean().optional().default(false),
    }),
})

const columnsCollection = defineCollection({
    loader: glob({
        pattern: '**/*.md',
        base: "./src/content/columns",
        generateId: ({ entry }) => entry.replace(/\.md$/, ''),
    }),
    schema: z.object({
        title: z.string(),
        pubDate: z.date().optional(),
        description: z.string().optional().default(''),
        icon: z.string().optional(),
        image: z.string().optional().default(''),
        cover: z.string().optional().default(''),
        showCover: z.boolean().optional().default(true),
        tags: z.array(z.string()).optional(),
        pinTop: z.number().int().optional().default(0),
        draft: z.boolean().optional().default(false),
    }),
})

const articlesCollection = defineCollection({
    loader: glob({ pattern: '**/[^_]*.md', base: "./src/content/articles" }),
    schema: z.object({
        title: z.string(),
        description: z.string().optional().default(''),
        link: z.string().url(),
        pubDate: z.date(),
        tags: z.array(z.string()).optional(),
        image: z.string().optional().default(''),
        draft: z.boolean().optional().default(false),
        pinTop: z.number().int().optional().default(0),
    }),
})

// Harness Kit：skills / commands / MCP 等智能体工具条目
const harnessCollection = defineCollection({
    loader: glob({ pattern: '**/[^_]*.md', base: "./src/content/harness" }),
    schema: z.object({
        title: z.string(),
        description: z.string().optional().default(''),
        // 类型保持开放：skill / command / agent / mcp / prompt / workflow / other
        type: z.string().optional().default('other'),
        link: z.string().optional().default(''),
        source: z.string().optional().default(''),
        author: z.string().optional().default(''),
        version: z.string().optional().default(''),
        icon: z.string().optional(),
        tags: z.array(z.string()).optional(),
        pubDate: z.date().optional(),
        pinTop: z.number().int().optional().default(0),
        draft: z.boolean().optional().default(false),
    }),
})

export const collections = {
    blog: blogCollection,
    spec: specCollection,
    books: booksCollection,
    bookReview: bookReviewCollection,
    columns: columnsCollection,
    articles: articlesCollection,
    harness: harnessCollection,
}