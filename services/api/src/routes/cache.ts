import { FastifyInstance } from "fastify";
import { CacheService } from "../services/cacheService.js";

export default async function cacheRoutes(
  fastify: FastifyInstance,
  opts: { cacheService: CacheService },
) {
  const { cacheService } = opts;

  // List all cache keys
  fastify.get("/api/cache/keys", async () => {
    return cacheService.keys();
  });

  // Get cache statistics
  fastify.get("/api/cache/stats", async () => {
    return cacheService.getStats();
  });

  // Get value for specific cache key
  fastify.get("/api/cache/entry", async (request: any, reply) => {
    const { key } = request.query;

    if (!key) {
      return reply.code(400).send({ error: "Query parameter 'key' is required" });
    }

    const value = cacheService.get(key);
    if (value === undefined) {
      return reply.code(404).send({ error: "Cache key not found" });
    }

    return {
      key,
      value,
      metadata: {
        remainingTtlMs: cacheService.getRemainingTTL(key),
      },
    };
  });

  // Delete specific cache entry
  fastify.delete("/api/cache/entry", async (request: any, reply) => {
    const { key } = request.query;

    if (!key) {
      return reply.code(400).send({ error: "Query parameter 'key' is required" });
    }

    const deleted = cacheService.delete(key);
    if (!deleted) {
      return reply.code(404).send({ error: "Cache key not found" });
    }

    return { success: true, key };
  });

  // Clear all cache entries
  fastify.post("/api/cache/clear", async () => {
    const clearedCount = cacheService.clear();
    return { success: true, clearedCount };
  });
}
