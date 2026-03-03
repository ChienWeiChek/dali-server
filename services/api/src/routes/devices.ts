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
            |> group(columns: ["title"])
            |> keep(columns: ["device_guid", "controller", "title"])
            |> distinct(column: "device_guid")
        `;

      const rows = await queryApi.collectRows(fluxQuery);

      return {
        devices: rows,
        source: "influxdb",
        count: rows.length,
      };
    } catch (error) {
      request.log.error({ err: error }, "Error fetching devices from InfluxDB");
      return reply
        .code(500)
        .send({ error: "Failed to fetch devices from InfluxDB" });
    }
  });

  fastify.get("/api/devices/:guid", async (request: any, reply) => {
    const { guid } = request.params;
    const { type } = request.query as { type?: string };

    // If type is 'influxdb', fetch from InfluxDB
    if (type === "influxdb") {
      try {
        const config = await loadConfig();
        const queryApi = new InfluxDB({
          url: config.influx.url,
          token: config.influx.token,
        }).getQueryApi(config.influx.org);

        const safeGuid = validateTag(guid, "guid");

        // Query to get the latest state of all properties for this device
        const fluxQuery = `
          from(bucket: "${config.influx.bucket}")
            |> range(start: -30d)
            |> filter(fn: (r) => r._measurement == "dali_property")
            |> filter(fn: (r) => r.device_guid == "${safeGuid}")
            |> pivot(rowKey:["_time", "property"], columnKey:["_field"], valueColumn:"_value")
            |> group(columns: ["property"])
            |> last()
            |> keep(columns: ["_time", "property", "value_num", "value_str", "controller", "unit", "device_guid"])
        `;

        const rows = await queryApi.collectRows(fluxQuery);

        if (rows.length === 0) {
          return reply
            .code(404)
            .send({ error: "Device not found in InfluxDB" });
        }

        return {
          guid: safeGuid,
          properties: rows,
          source: "influxdb",
        };
      } catch (error) {
        request.log.error(
          { err: error },
          "Error fetching device from InfluxDB",
        );
        return reply
          .code(500)
          .send({ error: "Failed to fetch device from InfluxDB" });
      }
    }

    // Default behavior: Try to find device in all DALI clients
    for (const client of daliClients) {
      try {
        const device = await client.getDeviceDetails(guid);
        if (device) {
          return device;
        }
      } catch (error) {
        // Continue searching in other clients
      }
    }

    // Fallback/Not found handling
    // For now keeping consistent behavior if not found, or maybe return 404
    // But since we aren't sure if getDeviceDetails throws 404 or what,
    // we'll return a 404 if not found after checking all.

    return reply.code(404).send({ error: "Device not found" });
  });
}

function validateTag(value: string, label: string): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9:_\-]+$/.test(value)) {
    throw new Error(`Invalid ${label}`);
  }
  return value;
}
