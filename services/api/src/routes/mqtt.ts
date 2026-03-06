import { FastifyInstance } from "fastify";
import { DaliClient } from "../controllers/daliClient.js";
import { MqttSettings, ProfileData } from "../types/mqtt.js";

interface MqttRoutesOptions {
  daliClients: DaliClient[];
}

export default async function mqttRoutes(
  fastify: FastifyInstance,
  options: MqttRoutesOptions,
) {
  const { daliClients } = options;

  // Helper to find client by controller name
  const findClient = (controller: string): DaliClient | undefined => {
    return daliClients.find((c) => c.getConfig().name === controller);
  };

  // Get controller information
  fastify.get("/api/mqtt/:controller/info", async (request: any, reply) => {
    const { controller } = request.params;
    const client = findClient(controller);

    if (!client) {
      return reply.code(404).send({ error: "Controller not found" });
    }

    try {
      const info = await client.getControllerInfo();
      return info;
    } catch (error: any) {
      request.log.error({ err: error }, "Error fetching controller info");
      return reply
        .code(500)
        .send({ error: error.message || "Failed to fetch controller info" });
    }
  });

  // Get MQTT status
  fastify.get("/api/mqtt/:controller/status", async (request: any, reply) => {
    const { controller } = request.params;
    const client = findClient(controller);

    if (!client) {
      return reply.code(404).send({ error: "Controller not found" });
    }

    try {
      const status = await client.getMqttStatus();
      return status;
    } catch (error: any) {
      request.log.error({ err: error }, "Error fetching MQTT status");
      return reply
        .code(500)
        .send({ error: error.message || "Failed to fetch MQTT status" });
    }
  });

  // Update MQTT settings
  fastify.put("/api/mqtt/:controller/settings", async (request: any, reply) => {
    const { controller } = request.params;
    const settings = request.body as MqttSettings;
    const client = findClient(controller);

    if (!client) {
      return reply.code(404).send({ error: "Controller not found" });
    }

    try {
      await client.updateMqttSettings(settings);
      return { success: true, message: "MQTT settings updated successfully" };
    } catch (error: any) {
      request.log.error({ err: error }, "Error updating MQTT settings");
      return reply
        .code(500)
        .send({ error: error.message || "Failed to update MQTT settings" });
    }
  });

  // Get profile list
  fastify.get("/api/mqtt/:controller/profiles", async (request: any, reply) => {
    const { controller } = request.params;
    const client = findClient(controller);

    if (!client) {
      return reply.code(404).send({ error: "Controller not found" });
    }

    try {
      const profiles = await client.getProfiles();
      const activeProfiles = await client.getActiveProfiles();

      return {
        profiles: profiles.profiles || [],
        activeProfiles: activeProfiles.profiles || [],
      };
    } catch (error: any) {
      request.log.error({ err: error }, "Error fetching profiles");
      return reply
        .code(500)
        .send({ error: error.message || "Failed to fetch profiles" });
    }
  });

  // Get profile detail
  fastify.get(
    "/api/mqtt/:controller/profiles/:profileName",
    async (request: any, reply) => {
      const { controller, profileName } = request.params;
      const client = findClient(controller);

      if (!client) {
        return reply.code(404).send({ error: "Controller not found" });
      }

      try {
        const profile = await client.getProfileDetail(profileName);
        return profile;
      } catch (error: any) {
        request.log.error({ err: error }, "Error fetching profile detail");
        return reply
          .code(500)
          .send({ error: error.message || "Failed to fetch profile detail" });
      }
    },
  );

  // Update profile
  fastify.put(
    "/api/mqtt/:controller/profiles/:profileName",
    async (request: any, reply) => {
      const { controller, profileName } = request.params;
      const data = request.body as ProfileData;
      const client = findClient(controller);

      if (!client) {
        return reply.code(404).send({ error: "Controller not found" });
      }

      try {
        await client.updateProfile(profileName, data);
        return { success: true, message: "Profile updated successfully" };
      } catch (error: any) {
        request.log.error({ err: error }, "Error updating profile");
        return reply
          .code(500)
          .send({ error: error.message || "Failed to update profile" });
      }
    },
  );

  // Activate profile
  fastify.put(
    "/api/mqtt/:controller/profiles/:profileName/activate",
    async (request: any, reply) => {
      const { controller, profileName } = request.params;
      const client = findClient(controller);

      if (!client) {
        return reply.code(404).send({ error: "Controller not found" });
      }

      try {
        await client.activateProfile(profileName);
        return { success: true, message: "Profile activated successfully" };
      } catch (error: any) {
        request.log.error({ err: error }, "Error activating profile");
        return reply
          .code(500)
          .send({ error: error.message || "Failed to activate profile" });
      }
    },
  );

  // Deactivate profile
  fastify.delete(
    "/api/mqtt/:controller/profiles/:profileName/activate",
    async (request: any, reply) => {
      const { controller, profileName } = request.params;
      const client = findClient(controller);

      if (!client) {
        return reply.code(404).send({ error: "Controller not found" });
      }

      try {
        await client.deactivateProfile(profileName);
        return { success: true, message: "Profile deactivated successfully" };
      } catch (error: any) {
        request.log.error({ err: error }, "Error deactivating profile");
        return reply
          .code(500)
          .send({ error: error.message || "Failed to deactivate profile" });
      }
    },
  );
}
