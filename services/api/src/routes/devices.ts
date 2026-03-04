import { FastifyInstance } from "fastify";
import { InfluxDB } from "@influxdata/influxdb-client";
import { DaliClient } from "../controllers/daliClient.js";
import { loadConfig } from "../config/loader.js";

interface DeviceRoutesOptions {
  daliClients: DaliClient[];
}

export default async function deviceRoutes(
  fastify: FastifyInstance,
  options: DeviceRoutesOptions,
) {
  const { daliClients } = options;

  fastify.get("/api/devices", async (request: any, reply) => {
    try {
      const config = await loadConfig();
      const queryApi = new InfluxDB({
        url: config.influx.url,
        token: config.influx.token,
      }).getQueryApi(config.influx.org);

      // Query to get all unique devices from InfluxDB
      const fluxQuery = `
          from(bucket: "${config.influx.bucket}")
            |> range(start: -30d)
            |> filter(fn: (r) => r._measurement == "dali_property")
            |> map(fn: (r) => ({ r with combined_id: r.controller + "_" + r.device_guid }))
            |> group(columns: ["controller"])
            |> distinct(column: "combined_id")
        `;

      const rows = await queryApi.collectRows<{ _value: string }>(fluxQuery);

      let liveDevices: Record<string, any> = {};
      for (const client of daliClients) {
        const devices = await client.getDevices();
        liveDevices[client.getConfig().name] = devices.filter(
          (item) =>
            item.type === "gear" ||
            item.type === "lightSensor" ||
            item.type === "motionSensor",
        ); // all live devices;
      }

      return {
        devices: rows, // from InfluxDB
        liveDevices: liveDevices,
      };
    } catch (error) {
      request.log.error({ err: error }, "Error fetching devices from InfluxDB");
      return reply
        .code(500)
        .send({ error: "Failed to fetch devices from InfluxDB" });
    }
  });

  fastify.get("/api/devices/:controller/:guid", async (request: any, reply) => {
    const { guid, controller } = request.params;

    // Default behavior: Try to find device in all DALI clients
    for (const client of daliClients) {
      if (client.getConfig().name !== controller) continue; // Skip clients that don't match the controller in the URL
      try {
        const device = await client.getDeviceDetails(guid);
        if (device) {
          return device;
        }
      } catch (error) {
        // Continue searching in other clients
      }
    }

    return reply.code(404).send({ error: "Device not found" });
  });

  fastify.get(
    "/api/devices/:controller/:guid/:property",
    async (request: any, reply) => {
      const { guid, controller, property } = request.params;

      // Default behavior: Try to find device in all DALI clients
      for (const client of daliClients) {
        if (client.getConfig().name !== controller) continue; // Skip clients that don't match the controller in the URL
        try {
          const device = await client.getProperty(guid, property);
          if (device) {
            return device;
          }
        } catch (error) {
          console.log("🚀 ~ deviceRoutes ~ error:", error);
          // Continue searching in other clients
        }
      }

      return reply.code(404).send({ error: "Device not found" });
    },
  );
  fastify.get("/api/devices/error", async (request: any, reply) => {
    let errorDevice: Record<string, any> = {};
    try {
      for (const client of daliClients) {
        const devices = await client.getError();
        errorDevice[client.getConfig().name] = devices;
      }
      return errorDevice;
    } catch (error) {
      return reply.code(404).send({ error: "Device not found" });
    }
  });
}

function validateTag(value: string, label: string): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9:_\-]+$/.test(value)) {
    throw new Error(`Invalid ${label}`);
  }
  return value;
}
