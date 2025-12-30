import { z } from 'zod';
import { insertArticleSchema, insertUserSchema, articles, users } from './schema.js';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  users: {
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>().nullable(),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/user',
      input: insertUserSchema.partial(),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/users/:username',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    follow: {
      method: 'POST' as const,
      path: '/api/users/:id/follow',
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
  },
  articles: {
    list: {
      method: 'GET' as const,
      path: '/api/articles',
      input: z.object({
        view: z.enum(['public', 'feed', 'mine', 'bookmarks']).optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof articles.$inferSelect & { author: typeof users.$inferSelect, likeCount: number, isLiked: boolean }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/articles/:id',
      responses: {
        200: z.custom<typeof articles.$inferSelect & { author: typeof users.$inferSelect }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/articles',
      input: insertArticleSchema.omit({ authorId: true }),
      responses: {
        201: z.custom<typeof articles.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/articles/:id',
      input: insertArticleSchema.partial(),
      responses: {
        200: z.custom<typeof articles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/articles/:id',
      responses: {
        204: z.void(),
      },
    },
    like: {
      method: 'POST' as const,
      path: '/api/articles/:id/like',
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
    bookmark: {
      method: 'POST' as const,
      path: '/api/articles/:id/bookmark',
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
    view: {
      method: 'POST' as const,
      path: '/api/articles/:id/view',
      responses: {
        200: z.void(),
      },
    },
    translate: {
      method: 'POST' as const,
      path: '/api/articles/:id/translate',
      input: z.object({
        targetLanguage: z.string(),
      }),
      responses: {
        200: z.object({ translatedContent: z.array(z.any()) }),
      },
    },
    report: {
      method: 'POST' as const,
      path: '/api/articles/:id/report',
      input: z.object({
        reason: z.string(),
      }),
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
  },
  comments: {
    list: {
      method: 'GET' as const,
      path: '/api/articles/:articleId/comments',
      responses: {
        200: z.array(z.custom<any>()), // Simplification to avoid circular imports or complex schema replication
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/articles/:articleId/comments',
      input: z.object({
        content: z.string().min(1),
        parentId: z.number().optional(),
      }),
      responses: {
        201: z.custom<any>(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/comments/:id',
      responses: {
        204: z.void(),
      },
    },
  },
  upload: {
    create: {
      method: 'POST' as const,
      path: '/api/upload',
      // input is FormData
      responses: {
        200: z.object({ url: z.string() }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
