import { FastifyInstance } from "fastify";
import { InfluxDB } from "@influxdata/influxdb-client";
import { loadConfig } from "../config/loader.js";
import { validateRange, rangeToWindow, CUMULATIVE_PROPERTIES } from "../utils/influxHelpers.js";

export default async function historyRoutes(fastify: FastifyInstance) {
  const config = await loadConfig();
  const queryApi = new InfluxDB({
    url: config.influx.url,
    token: config.influx.token,
  }).getQueryApi(config.influx.org);

  fastify.get(
    "/api/devices/:controller/:guid/history",
    async (request: any, reply) => {
      const { guid, controller } = request.params;
      const { property, range = "24h" } = request.query as any;

      const controllerName = config.controllers.find(
        (c) => c.name === controller,
      )?.username; // Assuming username is unique and identifies the controller
      
      if (!controllerName) {
        return reply.code(404).send({ error: "Controller not found" });
      }
      if (!property) {
        return reply.code(400).send({ error: "Property is required" });
      }

      const safeGuid = validateTag(guid, "guid");
      const safeProperty = validateTag(property, "property");
      const safeRange = validateRange(range);
      const window = rangeToWindow(safeRange);
      const isCumulative = CUMULATIVE_PROPERTIES.has(safeProperty);

      // Cumulative properties (energy, operation time) are odometer-style counters.
      // last() per window preserves the counter shape, then difference() converts
      // consecutive bucket values into per-window deltas (actual consumption).
      const fluxQuery = isCumulative
        ? `
      from(bucket: "${config.influx.bucket}")
        |> range(start: -${safeRange})
        |> filter(fn: (r) => r._measurement == "dali_property")
        |> filter(fn: (r) => r.device_guid == "${safeGuid}" and r.property == "${safeProperty}" and r.controller == "${controllerName}")
        |> filter(fn: (r) => r._field == "value_num")
        |> aggregateWindow(every: ${window}, fn: max, createEmpty: true)
        |> difference(nonNegative: true)
        |> filter(fn: (r) => exists r._value)
        |> map(fn: (r) => ({r with _time: string(v: r._time), value_num: r._value}))
        |> keep(columns: ["_time", "value_num", "unit", "device_guid", "property"])
        |> sort(columns: ["_time"])
    `
        : `
      from(bucket: "${config.influx.bucket}")
        |> range(start: -${safeRange})
        |> filter(fn: (r) => r._measurement == "dali_property")
        |> filter(fn: (r) => r.device_guid == "${safeGuid}" and r.property == "${safeProperty}" and r.controller == "${controllerName}")
        |> filter(fn: (r) => r._field == "value_num")
        |> aggregateWindow(every: ${window}, fn: mean, createEmpty: false)
        |> map(fn: (r) => ({r with _time: string(v: r._time), value_num: r._value}))
        |> keep(columns: ["_time", "value_num", "unit", "device_guid", "property"])
        |> sort(columns: ["_time"])
    `;

      try {
        const rows = await queryApi.collectRows(fluxQuery);
        return rows;
      } catch (err) {
        request.log.error(err);
        return reply.code(500).send({ error: "Database error" });
      }
    },
  );
}

function validateTag(value: string, label: string): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9:_\-]+$/.test(value)) {
    throw new Error(`Invalid ${label}`);
  }
  return value;
}

