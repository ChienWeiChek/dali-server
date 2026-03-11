import { FastifyInstance } from "fastify";
import { InfluxDB } from "@influxdata/influxdb-client";
import { DaliClient } from "../controllers/daliClient.js";
import { loadConfig } from "../config/loader.js";

interface GroupsRoutesOptions {
  daliClients: DaliClient[];
}

export default async function groupsRoutes(
  fastify: FastifyInstance,
  options: GroupsRoutesOptions,
) {
  const { daliClients } = options;

  fastify.get("/api/groups/:controller", async (request: any, reply) => {
    const { controller } = request.params;

    // Default behavior: Try to find device in all DALI clients
    for (const client of daliClients) {
      if (client.getConfig().name !== controller) continue; // Skip clients that don't match the controller in the URL
      try {
        const groups = await client.getGroups();
        if (groups) {
          return groups;
        }
      } catch (error) {
        console.log("🚀 ~ groupsRoutes ~ error:", error);
        // Continue searching in other clients
      }
    }

    return reply.code(404).send({ error: `${controller} groups not found` });
  });
  fastify.get(
    "/api/groups/:controller/:groupId",
    async (request: any, reply) => {
      const { controller, groupId } = request.params;

      // Default behavior: Try to find device in all DALI clients
      for (const client of daliClients) {
        if (client.getConfig().name !== controller) continue; // Skip clients that don't match the controller in the URL
        try {
          const groups = await client.getGroupsDetail(groupId);
          if (groups) {
            return groups;
          }
        } catch (error) {
          console.log("🚀 ~ groupsRoutes ~ error:", error);
          // Continue searching in other clients
        }
      }

      return reply
        .code(404)
        .send({ error: `${controller} groups ${groupId} not found` });
    },
  );
  fastify.get(
    "/api/groups/:controller/:groupId/state",
    async (request: any, reply) => {
      const { controller, groupId } = request.params;

      // Default behavior: Try to find device in all DALI clients
      for (const client of daliClients) {
        if (client.getConfig().name !== controller) continue; // Skip clients that don't match the controller in the URL
        try {
          const groups = await client.getGroupState(groupId);
          if (groups) {
            return groups;
          }
        } catch (error) {
          console.log("🚀 ~ groupsRoutes ~ error:", error);
          // Continue searching in other clients
        }
      }

      return reply.code(500).send({
        error: `${controller} groups ${groupId} get state error`,
      });
    },
  );
  fastify.put(
    "/api/groups/:controller/:groupId/state",
    async (request: any, reply) => {
      const { controller, groupId } = request.params;
      const { sceneNr, ...payload } = request.body;

      // Default behavior: Try to find device in all DALI clients
      for (const client of daliClients) {
        if (client.getConfig().name !== controller) continue; // Skip clients that don't match the controller in the URL
        try {
          const groups = await client.recallScene(groupId, sceneNr, payload);
          if (groups) {
            return groups;
          }
        } catch (error) {
          console.log("🚀 ~ groupsRoutes ~ error:", error);
          // Continue searching in other clients
        }
      }

      return reply.code(500).send({
        error: `${controller} groups ${groupId} set-> ${sceneNr} error`,
      });
    },
  );
}
