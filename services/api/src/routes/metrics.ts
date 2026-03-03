import { FastifyInstance, FastifyRequest } from "fastify";
import { InfluxDB } from "@influxdata/influxdb-client";
import { loadConfig } from "../config/loader.js";
interface Row {
  controller: string;
  property: string;
  _value: number;
  unit: string;
}
interface PropertyValue {
  value: number | string;
  unit: string;
}
interface ControllerData {
  controller: string;
  [property: string]: PropertyValue | string;
}
interface Result {
  avg: Record<string, PropertyValue>;
  controller: ControllerData[];
}

export default async function metricsRoutes(fastify: FastifyInstance) {
  const config = await loadConfig();
  const queryApi = new InfluxDB({
    url: config.influx.url,
    token: config.influx.token,
  }).getQueryApi(config.influx.org);

  // Aggregate metrics endpoint TOD
  fastify.get("/api/devices/metrics/aggregate", async (request: any, reply) => {
    const {
      deviceIds,
      zones,
      properties = "lightLevel,driverInputPower,driverEnergyConsumption,driverTemperature",
    } = request.query;

    try {
      // Build device filter
      let deviceFilter = "";
      if (deviceIds) {
        const ids = deviceIds
          .split(",")
          .map((id: string) => `r.device_guid == "${id}"`)
          .join(" or ");
        deviceFilter = `|> filter(fn: (r) => ${ids})`;
      }

      const propertyList = properties.split(",");
      const results: any = {};

      // Fetch average light level
      if (propertyList.includes("lightLevel")) {
        const lightLevelQuery = `
          from(bucket: "${config.influx.bucket}")
            |> range(start: -5m)
            |> filter(fn: (r) => r._measurement == "dali_property")
            |> filter(fn: (r) => r.property == "lightLevel")
            |> filter(fn: (r) => r._field == "value_num")
            ${deviceFilter}
            |> last()
            |> mean()
        `;
        try {
          const rows = (await queryApi.collectRows(lightLevelQuery)) as any[];
          results.avgLightLevel =
            rows.length > 0 && rows[0]._value !== undefined
              ? rows[0]._value
              : 0;
        } catch (err: any) {
          fastify.log.warn({ err }, "Failed to fetch avgLightLevel");
          results.avgLightLevel = 0;
        }
      }

      // Fetch total energy
      if (propertyList.includes("driverEnergyConsumption")) {
        const energyQuery = `
          from(bucket: "${config.influx.bucket}")
            |> range(start: -5m)
            |> filter(fn: (r) => r._measurement == "dali_property")
            |> filter(fn: (r) => r.property == "driverEnergyConsumption")
            |> filter(fn: (r) => r._field == "value_num")
            ${deviceFilter}
            |> last()
            |> sum()
        `;
        try {
          const rows = (await queryApi.collectRows(energyQuery)) as any[];
          results.totalEnergy =
            rows.length > 0 && rows[0]._value !== undefined
              ? rows[0]._value
              : 0;
        } catch (err: any) {
          fastify.log.warn({ err }, "Failed to fetch totalEnergy");
          results.totalEnergy = 0;
        }
      }

      // Fetch average power
      if (propertyList.includes("driverInputPower")) {
        const powerQuery = `
          from(bucket: "${config.influx.bucket}")
            |> range(start: -5m)
            |> filter(fn: (r) => r._measurement == "dali_property")
            |> filter(fn: (r) => r.property == "driverInputPower")
            |> filter(fn: (r) => r._field == "value_num")
            ${deviceFilter}
            |> last()
            |> mean()
        `;
        try {
          const rows = (await queryApi.collectRows(powerQuery)) as any[];
          results.avgPower =
            rows.length > 0 && rows[0]._value !== undefined
              ? rows[0]._value
              : 0;
        } catch (err: any) {
          fastify.log.warn({ err }, "Failed to fetch avgPower");
          results.avgPower = 0;
        }
      }

      // Fetch error count
      const errorQuery = `
        from(bucket: "${config.influx.bucket}")
          |> range(start: -5m)
          |> filter(fn: (r) => r._measurement == "dali_property")
          |> filter(fn: (r) => r.property == "errorOverall")
          |> filter(fn: (r) => r._field == "value_num")
          ${deviceFilter}
          |> last()
          |> filter(fn: (r) => r._value > 0)
          |> count()
      `;
      try {
        const errorRows = (await queryApi.collectRows(errorQuery)) as any[];
        results.errorCount =
          errorRows.length > 0 && errorRows[0]._value !== undefined
            ? errorRows[0]._value
            : 0;
      } catch (err: any) {
        fastify.log.warn({ err }, "Failed to fetch errorCount");
        results.errorCount = 0;
      }

      // Count unique devices
      const deviceCountQuery = `
        from(bucket: "${config.influx.bucket}")
          |> range(start: -5m)
          |> filter(fn: (r) => r._measurement == "dali_property")
          ${deviceFilter}
          |> last()
          |> group(columns: ["device_guid"])
          |> count()
          |> group()
          |> count()
      `;
      try {
        const deviceRows = (await queryApi.collectRows(
          deviceCountQuery,
        )) as any[];
        results.deviceCount =
          deviceRows.length > 0 && deviceRows[0]._value !== undefined
            ? deviceRows[0]._value
            : 0;
      } catch (err: any) {
        fastify.log.warn({ err }, "Failed to fetch deviceCount");
        results.deviceCount = 0;
      }

      return results;
    } catch (err) {
      fastify.log.error(err);
      return reply
        .code(500)
        .send({ error: "Failed to fetch aggregate metrics" });
    }
  });

  // Energy summary endpoint
  fastify.get("/api/devices/energy-summary", async (request: any, reply) => {
    try {
      const query = `
        from(bucket: "${config.influx.bucket}")
          |> range(start:-30d)
          |> filter(fn: (r) => r._measurement == "dali_property")
          |> filter(fn: (r) => r.property == "driverEnergyConsumption")
          |> group(columns: ["device_guid", "controller", "unit"])
          |> keep(columns: ["controller", "device_guid","_value","unit"])  
          |> last()
          |> group(columns: ["controller"])
          |> sum(column: "_value")
          |> keep(columns: ["controller", "_value", "unit"])
      `;

      const rows = await queryApi.collectRows(query);
      return {
        total: rows.reduce((acc, row: any) => acc + (row._value || 0), 0),
        unit: "Wh",
        controller: rows.map((row: any) => ({
          controller: row.controller || "Unknown",
          totalEnergy: row._value || 0,
          unit: row.unit || "Wh",
        })),
      };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: "Failed to fetch energy summary" });
    }
  });

  // Driver temperature endpoint
  fastify.get(
    "/api/devices/driver-temperature",
    async (request: any, reply) => {
      try {
        const query = `
        from(bucket: "${config.influx.bucket}")
          |> range(start:-30d)
          |> filter(fn: (r) => r._measurement == "dali_property")
          |> filter(fn: (r) => r.property == "driverTemperature")
          |> keep(columns: ["controller","_value","unit","property"])  
          |> mean()
      `;

        const rows = await queryApi.collectRows(query);
        return {
          avg:
            rows.length > 0
              ? (rows.reduce(
                  (acc: number, row: any) => acc + (row._value || 0),
                  0,
                ) / rows.length).toFixed(2)
              : 0,
          unit: "°C",
          controller: rows.map((row: any) => ({
            controller: row.controller || "Unknown",
            totalEnergy: row._value.toFixed(2) || 0,
            unit: row.unit || "°C",
          })),
        };
      } catch (err) {
        fastify.log.error(err);
        return reply
          .code(500)
          .send({ error: "Failed to fetch energy summary" });
      }
    },
  );
  // Real-time data endpoint
  fastify.get(
    "/api/devices/real-time-data",
    async (
      request: FastifyRequest<{ Querystring: { ["type[]"]?: string[] } }>,
      reply,
    ) => {
      const type = request.query["type[]"]; 
      // Normalize to array
      const types = Array.isArray(type) ? type : type ? [type] : [];

      try {
        const fluxFilter = types.length
          ? types.map((t) => `r.property == "${t}"`).join(" or ")
          : // default fallback
            `r.property == "driverTemperature" or r.property == "driverInputPower" or r.property == "driverInputVoltage"`;
        const query = `
          from(bucket: "${config.influx.bucket}")
            |> range(start: -30d)
            |> filter(fn: (r) => r._measurement == "dali_property")
            |> filter(fn: (r) => ${fluxFilter})
            |> group(columns: ["unit", "controller", "property"])
            |> keep(columns: ["controller", "_value", "unit", "property"])
            |> last()
        `;

        const rows: Row[] = await queryApi.collectRows<Row>(query);
        const result: Result = { avg: {}, controller: [] };
        const byCtrl: Record<string, ControllerData> = {};
        const byProp: Record<string, { values: number[]; unit: string }> = {};
        for (const { controller, property, _value, unit } of rows) {
          (byCtrl[controller] ??= { controller })[property] = {
            value: _value,
            unit,
          };
          (byProp[property] ??= { values: [], unit }).values.push(_value);
        }
        for (const [prop, { values, unit }] of Object.entries(byProp)) {
          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          result.avg[prop] = { value: +avg.toFixed(2), unit };
        }
        result.controller = Object.values(byCtrl);

        return result;
      } catch (err) {
        fastify.log.error(err);
        return reply
          .code(500)
          .send({ error: "Failed to fetch real time data" });
      }
    },
  );

  // Latest properties endpoint
  fastify.get(
    "/api/devices/:guid/properties/latest",
    async (request: any, reply) => {
      const { guid } = request.params;
      const {
        properties = "lightLevel,driverInputPower,driverEnergyConsumption,driverTemperature,driverInputVoltage",
      } = request.query;

      try {
        const propertyList = properties
          .split(",")
          .map((p: string) => `r.property == "${p.trim()}"`)
          .join(" or ");

        const query = `
        from(bucket: "${config.influx.bucket}")
          |> range(start: -5m)
          |> filter(fn: (r) => r._measurement == "dali_property")
          |> filter(fn: (r) => r.device_guid == "${guid}")
          |> filter(fn: (r) => ${propertyList})
          |> filter(fn: (r) => r._field == "value_num")
          |> last()
          |> pivot(rowKey:["_time"], columnKey: ["property"], valueColumn: "_value")
      `;

        const rows = (await queryApi.collectRows(query)) as any[];
        if (rows.length === 0) {
          return reply.code(404).send({ error: "No data found for device" });
        }

        const row = rows[0] as any;
        const result: any = {
          deviceGuid: guid,
          title: row.title || "Unknown",
          timestamp: row._time,
          properties: {},
        };

        properties.split(",").forEach((prop: string) => {
          const propName = prop.trim();
          if (row[propName] !== undefined) {
            result.properties[propName] = {
              value: row[propName],
              unit: row.unit || "",
            };
          }
        });

        return result;
      } catch (err) {
        fastify.log.error(err);
        return reply
          .code(500)
          .send({ error: "Failed to fetch latest properties" });
      }
    },
  );
}
