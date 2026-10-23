/**
 * schemas.mjs — runtime zod schemas mirroring src/content.config.ts
 * ESM so the CMS scripts can `import` directly in Node 22.
 */
import { z } from 'zod'

const ratingEnum = z.enum(['recommended', 'neutral', 'not-recommended'])
const tagArray = z.array(z.string())

const slugRe = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
const dateRe = /^\d{4}-\d{2}-\d{2}$/

const baseBody = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(''),
  image: z.string().optional().default(''),
  cover: z.string().optional().default(''),
  pinTop: z.number().int().nonnegative().optional().default(0),
  draft: z.boolean().optional().default(false),
  tags: tagArray.optional().default([]),
  body: z.string().optional().default(''),
})

export const blogPayload = baseBody.extend({
  slug: z.string().regex(slugRe, 'slug must be kebab-case ascii'),
  pubDate: z.string().regex(dateRe, 'pubDate must be YYYY-MM-DD'),
  slugId: z.string().min(1),
})

export const bookPayload = z.object({
  slug: z.string().regex(slugRe, 'slug must be kebab-case ascii'),
  author: z.string().min(1),
  cover: z.string().optional().default(''),
  tags: tagArray.nonempty('books must have at least one tag'),
  rating: ratingEnum,
  summary: z.string().optional().default(''),
  briefComment: z.string().optional().default(''),
  readDate: z.string().regex(dateRe).optional(),
  readTimeHours: z.number().nonnegative().optional(),
  year: z.number().int().optional(),
  pinTop: z.number().int().nonnegative().optional().default(0),
  draft: z.boolean().optional().default(false),
  body: z.string().optional().default(''),
})

export const bookReviewPayload = baseBody.extend({
  slug: z.string().regex(slugRe),
  pubDate: z.string().regex(dateRe),
  slugId: z.string().min(1),
  bookSlug: z.string().min(1, 'bookSlug required'),
  rating: ratingEnum.optional(),
})

export const columnPayload = z.object({
  slug: z.string().regex(slugRe),
  description: z.string().optional().default(''),
  icon: z.string().optional().default(''),
  image: z.string().optional().default(''),
  cover: z.string().optional().default(''),
  tags: tagArray.optional().default([]),
  pubDate: z.string().regex(dateRe).optional(),
  pinTop: z.number().int().nonnegative().optional().default(0),
  draft: z.boolean().optional().default(false),
  body: z.string().optional().default(''),
})

export const articlePayload = z.object({
  slug: z.string().regex(slugRe),
  link: z.string().url('link must be a valid URL'),
  pubDate: z.string().regex(dateRe),
  description: z.string().optional().default(''),
  image: z.string().optional().default(''),
  tags: tagArray.optional().default([]),
  pinTop: z.number().int().nonnegative().optional().default(0),
  draft: z.boolean().optional().default(false),
  body: z.string().optional().default(''),
})

export const categorySchema = z.enum(['blog', 'book', 'book-review', 'column', 'article'])

export const schemaByCategory = {
  blog: blogPayload,
  book: bookPayload,
  'book-review': bookReviewPayload,
  column: columnPayload,
  article: articlePayload,
}

/** Map category → collection directory name under src/content/ */
export const collectionDir = {
  blog: 'blog',
  book: 'books',
  'book-review': 'book-review',
  column: 'columns',
  article: 'articles',
}

export const SUPPORTED_LOCALES = ['zh-cn', 'en']
