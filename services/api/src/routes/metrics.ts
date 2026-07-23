import { FastifyInstance, FastifyRequest } from "fastify";
import { InfluxDB } from "@influxdata/influxdb-client";
import { loadConfig } from "../config/loader.js";
import { CacheService } from "../services/cacheService.js";
import { rangeToWindow, validateRange, parseWindowToMs, isoWeekKey, isoWeekLabel } from "../utils/influxHelpers.js";
import { localDayStr, localMonthStartStr, localMidnightUTC } from "../utils/tzHelpers.js";
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

export default async function metricsRoutes(
  fastify: FastifyInstance,
  opts: { cacheService: CacheService },
) {
  const config = await loadConfig();
  const { cacheService } = opts;
  const queryApi = new InfluxDB({
    url: config.influx.url,
    token: config.influx.token,
    timeout: 60_000, // 60 s — long-range queries (monthly, 365 d) need more than the 10 s default
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
    // Check cache
    const cacheKey = cacheService.buildQueryKey("energy-summary", {});
    const cached = cacheService.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

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
      const result = {
        total: rows.reduce((acc, row: any) => acc + (row._value || 0), 0),
        unit: "Wh",
        controller: rows.map((row: any) => ({
          controller: row.controller || "Unknown",
          totalEnergy: row._value || 0,
          unit: row.unit || "Wh",
        })),
      };

      // Cache successful response
      cacheService.set(cacheKey, result);
      return result;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: "Failed to fetch energy summary" });
    }
  });

  // Driver temperature endpoint
  fastify.get(
    "/api/devices/driver-temperature",
    async (request: any, reply) => {
      // Check cache
      const cacheKey = cacheService.buildQueryKey("driver-temperature", {});
      const cached = cacheService.get(cacheKey);
      if (cached !== undefined) {
        return cached;
      }

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
        const result = {
          avg:
            rows.length > 0
              ? (
                  rows.reduce(
                    (acc: number, row: any) => acc + (row._value || 0),
                    0,
                  ) / rows.length
                ).toFixed(2)
              : 0,
          unit: "°C",
          controller: rows.map((row: any) => ({
            controller: row.controller || "Unknown",
            totalEnergy: row._value.toFixed(2) || 0,
            unit: row.unit || "°C",
          })),
        };

        // Cache successful response
        cacheService.set(cacheKey, result);
        return result;
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

  // Historical data for all devices - temperature, voltage, power
  fastify.get(
    "/api/devices/history/aggregate",
    async (
      request: FastifyRequest<{
        Querystring: { property?: string; range?: string };
      }>,
      reply,
    ) => {
      const { property = "driverTemperature", range = "24h" } = request.query;

      // Validate property
      const validProperties = [
        "driverTemperature",
        "driverInputVoltage",
        "driverInputPower",
        "driverEnergyConsumption",
      ];
      if (!validProperties.includes(property)) {
        return reply.code(400).send({
          error: `Invalid property. Must be one of: ${validProperties.join(", ")}`,
        });
      }

      // Validate range
      const validRange = validateRange(range);
      const window = rangeToWindow(validRange);

      // Check cache
      const cacheKey = cacheService.buildQueryKey("history-aggregate", {
        property,
        range: validRange,
      });
      const cached = cacheService.get(cacheKey);
      if (cached !== undefined) {
        return cached;
      }

      try {
        // aggregateWindow buckets data into equal time intervals, then we
        // group all devices together and take the cross-device mean per bucket.
        const query = `
          from(bucket: "${config.influx.bucket}")
            |> range(start: -${validRange})
            |> filter(fn: (r) => r._measurement == "dali_property")
            |> filter(fn: (r) => r.property == "${property}")
            |> filter(fn: (r) => r._field == "value_num")
            |> aggregateWindow(every: ${window}, fn: mean, createEmpty: false)
            |> group(columns: ["_time"])
            |> mean()
            |> keep(columns: ["_time", "_value"])
            |> sort(columns: ["_time"])
        `;

        const rows = await queryApi.collectRows<{
          _time: string;
          _value: number;
        }>(query);

        const result = rows.map((row) => ({
          time: row._time,
          value: +row._value.toFixed(2),
        }));

        // Cache successful response
        cacheService.set(cacheKey, result);
        return result;
      } catch (err) {
        fastify.log.error(err);
        return reply
          .code(500)
          .send({ error: "Failed to fetch historical data" });
      }
    },
  );

  // Energy consumption by device
  fastify.get("/api/devices/energy-by-device", async (request: any, reply) => {
    const { range = "30d" } = request.query as { range?: string };
    const validRange = validateRange(range, "30d");

    // Check cache
    const cacheKey = cacheService.buildQueryKey("energy-by-device", {
      range: validRange,
    });
    const cached = cacheService.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    try {
      // driverEnergyConsumption is a cumulative counter (odometer-style).
      // difference(nonNegative: true) computes per-consecutive-point deltas,
      // skipping any negative jumps caused by counter resets.
      // sum() of those deltas == last - first within the range.
      const query = `
          from(bucket: "${config.influx.bucket}")
            |> range(start: -${validRange})
            |> filter(fn: (r) => r._measurement == "dali_property"
                    and r.property == "driverEnergyConsumption"
                    and r._field == "value_num"
                    and r.title != "Unknown")
            |> group(columns: ["device_guid", "controller", "title"])
            |> sort(columns: ["_time"])
            |> difference(nonNegative: true)
            |> sum()
            |> map(fn: (r) => ({
              r with
              _value: float(v: r._value) / 1000.0
            }))
        `;

      const rows = await queryApi.collectRows<{
        device_guid: string;
        controller: string;
        title?: string;
        _value: number;
      }>(query);

      const result = rows
        .map((row) => ({
          name: row.title
            ? `${row.controller} - ${row.title}`
            : `${row.controller} - ${row.device_guid.substring(0, 8)}`,
          value: +row._value.toFixed(2),
          unit: "kWh",
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      // Cache successful response
      cacheService.set(cacheKey, result);
      return result;
    } catch (err) {
      fastify.log.error(err);
      return reply
        .code(500)
        .send({ error: "Failed to fetch energy by device" });
    }
  });

  // Total energy consumption trend across all devices over time
  fastify.get("/api/devices/energy/trend", async (request: any, reply) => {
    const { range = "24h" } = request.query as { range?: string };
    const validRange = validateRange(range);
    const window = rangeToWindow(validRange);

    // Check cache
    const cacheKey = cacheService.buildQueryKey("energy-trend", {
      range: validRange,
    });
    const cached = cacheService.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    try {
      // Per device: bucket into windows (last), compute per-window delta.
      // Cross-device sum is done in JS to avoid InfluxDB Arrow panic on
      // cross-table aggregations (group(columns:["_time"]) |> sum()).
      // Retain device_guid so JS can do per-device gap detection before summing.
      // Dropping it via |> keep() loses the ability to detect per-device data gaps,
      // causing spikes when a device goes offline and resumes (see Option C rationale).
      const query = `
        from(bucket: "${config.influx.bucket}")
          |> range(start: -${validRange})
          |> filter(fn: (r) => r._measurement == "dali_property"
                  and r.property == "driverEnergyConsumption"
                  and r._field == "value_num")
          |> group(columns: ["device_guid"])
          |> aggregateWindow(every: ${window}, fn: max, createEmpty: true)
          |> difference(nonNegative: true)
          |> filter(fn: (r) => exists r._value)
          |> keep(columns: ["_time", "_value", "device_guid"])
      `;

      const rows = await queryApi.collectRows<{
        _time: string;
        _value: number;
        device_guid: string;
      }>(query);

      // Per-device gap detection (Option C):
      // When a device goes offline, InfluxDB fills windows with null. On resume,
      // difference() compresses all accumulated consumption into one bucket → spike.
      // Fix: group rows by device, sort by time, and zero any value where the gap
      // to the previous row exceeds 2× the aggregation window.
      const windowMs = parseWindowToMs(window);
      const maxGapMs = 2 * windowMs;

      // Build per-device sorted lists
      const byDevice: Record<string, { time: string; value: number }[]> = {};
      for (const row of rows) {
        if (!byDevice[row.device_guid]) byDevice[row.device_guid] = [];
        byDevice[row.device_guid].push({ time: row._time, value: row._value });
      }

      // Sum across devices, zeroing post-gap spikes per device
      const byTime: Record<string, number> = {};
      for (const deviceRows of Object.values(byDevice)) {
        const sorted = deviceRows.sort((a, b) => a.time.localeCompare(b.time));
        for (let i = 0; i < sorted.length; i++) {
          const gapMs =
            i === 0
              ? 0
              : new Date(sorted[i].time).getTime() -
                new Date(sorted[i - 1].time).getTime();
          // Zero this window's contribution if the preceding gap is too large —
          // the value would be a spike accumulated during the offline period.
          const value = gapMs > maxGapMs ? 0 : sorted[i].value;
          byTime[sorted[i].time] = (byTime[sorted[i].time] ?? 0) + value;
        }
      }

      const result = Object.entries(byTime)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([time, value]) => ({ time, value: +value.toFixed(4) }));

      // Cache successful response
      cacheService.set(cacheKey, result);
      return result;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: "Failed to fetch energy trend" });
    }
  });

  // Monthly energy consumption for the last 12 months — optional ?guids= zone filter
  fastify.get("/api/devices/energy/monthly", async (request: any, reply) => {
    const { guids } = request.query as { guids?: string };
    const guidFilter = buildGuidFilter(guids);

    // Check cache
    const cacheKey = cacheService.buildQueryKey("energy-monthly", {
      guids: guids || "all-devices",
    });
    const cached = cacheService.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    try {
      const query = `
        from(bucket: "${config.influx.bucket}")
          |> range(start: -365d)
          |> filter(fn: (r) => r._measurement == "dali_property"
                  and r.property == "driverEnergyConsumption"
                  and r._field == "value_num")
          ${guidFilter}
          |> group(columns: ["device_guid"])
          |> aggregateWindow(every: 1d, fn: last, createEmpty: true)
          |> difference(nonNegative: true)
          |> filter(fn: (r) => exists r._value)
          |> keep(columns: ["_time", "_value", "device_guid"])
      `;
      const rows = await queryApi.collectRows<{
        _time: string;
        _value: number;
        device_guid: string;
      }>(query);

      // Per-device gap detection: zero any 1d window where the device was offline
      // for more than a day (gap > 25h). Without this, difference() dumps all
      // accumulated offline consumption into the first bucket after resumption.
      const maxGapMs = 25 * 60 * 60 * 1000;

      const byDeviceM: Record<string, { time: string; value: number }[]> = {};
      for (const row of rows) {
        if (!byDeviceM[row.device_guid]) byDeviceM[row.device_guid] = [];
        byDeviceM[row.device_guid].push({ time: row._time, value: row._value });
      }

      const monthly: Record<string, number> = {};
      for (const deviceRows of Object.values(byDeviceM)) {
        const sorted = deviceRows.sort((a, b) => a.time.localeCompare(b.time));
        for (let i = 0; i < sorted.length; i++) {
          const gapMs =
            i === 0
              ? 0
              : new Date(sorted[i].time).getTime() -
                new Date(sorted[i - 1].time).getTime();
          const value = gapMs > maxGapMs ? 0 : sorted[i].value;
          const d = new Date(sorted[i].time);
          const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
          monthly[key] = (monthly[key] ?? 0) + value;
        }
      }

      const result = Object.entries(monthly)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => {
          const [year, month] = key.split("-").map(Number);
          const name = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
            month: "short", year: "numeric", timeZone: "UTC",
          });
          return { name, value: +(value / 1000).toFixed(3) };
        });

      // Cache successful response
      cacheService.set(cacheKey, result);
      return result;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: "Failed to fetch monthly energy" });
    }
  });

  // Weekly energy — last 12 complete ISO weeks (Mon–Sun), optional ?guids=
  fastify.get("/api/devices/energy/weekly", async (request: any, reply) => {
    const { guids } = request.query as { guids?: string };
    const guidFilter = buildGuidFilter(guids);

    // Check cache
    const cacheKey = cacheService.buildQueryKey("energy-weekly", {
      guids: guids || "all-devices",
    });
    const cached = cacheService.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    try {
      const query = `
        from(bucket: "${config.influx.bucket}")
          |> range(start: -91d)
          |> filter(fn: (r) => r._measurement == "dali_property"
                  and r.property == "driverEnergyConsumption"
                  and r._field == "value_num")
          ${guidFilter}
          |> group(columns: ["device_guid"])
          |> aggregateWindow(every: 1d, fn: last, createEmpty: true)
          |> difference(nonNegative: true)
          |> filter(fn: (r) => exists r._value)
          |> keep(columns: ["_time", "_value", "device_guid"])
      `;
      const rows = await queryApi.collectRows<{
        _time: string;
        _value: number;
        device_guid: string;
      }>(query);

      // Per-device gap detection: same as daily/monthly — zero windows that span
      // a gap larger than 1d to prevent post-offline spikes inflating weekly totals.
      const maxGapMsW = 25 * 60 * 60 * 1000;

      const byDeviceW: Record<string, { time: string; value: number }[]> = {};
      for (const row of rows) {
        if (!byDeviceW[row.device_guid]) byDeviceW[row.device_guid] = [];
        byDeviceW[row.device_guid].push({ time: row._time, value: row._value });
      }

      const weekly: Record<string, number> = {};
      for (const deviceRows of Object.values(byDeviceW)) {
        const sorted = deviceRows.sort((a, b) => a.time.localeCompare(b.time));
        for (let i = 0; i < sorted.length; i++) {
          const gapMs =
            i === 0
              ? 0
              : new Date(sorted[i].time).getTime() -
                new Date(sorted[i - 1].time).getTime();
          const value = gapMs > maxGapMsW ? 0 : sorted[i].value;
          const key = isoWeekKey(new Date(sorted[i].time));
          weekly[key] = (weekly[key] ?? 0) + value;
        }
      }

      const currentWeek = isoWeekKey(new Date());
      const result = Object.entries(weekly)
        .filter(([key]) => key !== currentWeek)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([key, value]) => ({
          name: isoWeekLabel(key),
          value: +(value / 1000).toFixed(3),
        }));

      // Cache successful response
      cacheService.set(cacheKey, result);
      return result;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: "Failed to fetch weekly energy" });
    }
  });

  // Daily energy — last 30 days, optional ?guids=
  fastify.get("/api/devices/energy/daily", async (request: any, reply) => {
    const { guids } = request.query as { guids?: string };
    const guidFilter = buildGuidFilter(guids);

    // Check cache
    const cacheKey = cacheService.buildQueryKey("energy-daily", {
      guids: guids || "all-devices",
    });
    const cached = cacheService.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    try {
      // Retain device_guid so we can do per-device gap detection before summing.
      // A 1d window means any gap > 1 day is offline time — zeroing that window
      // prevents accumulated consumption from dumping into the resumption bucket.
      const query = `
        from(bucket: "${config.influx.bucket}")
          |> range(start: -30d)
          |> filter(fn: (r) => r._measurement == "dali_property"
                  and r.property == "driverEnergyConsumption"
                  and r._field == "value_num")
          ${guidFilter}
          |> group(columns: ["device_guid"])
          |> aggregateWindow(every: 1d, fn: last, createEmpty: true)
          |> difference(nonNegative: true)
          |> filter(fn: (r) => exists r._value)
          |> keep(columns: ["_time", "_value", "device_guid"])
      `;
      const rows = await queryApi.collectRows<{
        _time: string;
        _value: number;
        device_guid: string;
      }>(query);

      // Per-device gap detection: zero any window where the preceding gap > 1d + buffer.
      // This catches devices that go offline for multiple days and resume — without this,
      // difference() compresses all offline consumption into the first window after resumption.
      const maxGapMs = 25 * 60 * 60 * 1000; // 1 day + 1 hour tolerance

      const byDevice: Record<string, { time: string; value: number }[]> = {};
      for (const row of rows) {
        if (!byDevice[row.device_guid]) byDevice[row.device_guid] = [];
        byDevice[row.device_guid].push({ time: row._time, value: row._value });
      }

      const daily: Record<string, number> = {};
      for (const deviceRows of Object.values(byDevice)) {
        const sorted = deviceRows.sort((a, b) => a.time.localeCompare(b.time));
        for (let i = 0; i < sorted.length; i++) {
          const gapMs =
            i === 0
              ? 0
              : new Date(sorted[i].time).getTime() -
                new Date(sorted[i - 1].time).getTime();
          const value = gapMs > maxGapMs ? 0 : sorted[i].value;
          const key = new Date(sorted[i].time).toISOString().slice(0, 10);
          daily[key] = (daily[key] ?? 0) + value;
        }
      }

      const result = Object.entries(daily)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => ({
          name: new Date(`${key}T00:00:00Z`).toLocaleDateString("en-US", {
            month: "short", day: "numeric", timeZone: "UTC",
          }),
          value: +(value / 1000).toFixed(3),
        }));

      // Cache successful response
      cacheService.set(cacheKey, result);
      return result;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: "Failed to fetch daily energy" });
    }
  });

  // Energy stat cards — today, yesterday, current month, last month with % change
  fastify.get("/api/devices/energy/stats", async (request: any, reply) => {
    const { tz = "UTC", guids } = request.query as { tz?: string; guids?: string };
    const guidFilter = buildGuidFilter(guids);

    // Check cache
    const cacheKey = cacheService.buildQueryKey("energy-stats", {
      tz,
      guids: guids || "all-devices",
    });
    const cached = cacheService.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const now = new Date();

    const startOfToday      = localMidnightUTC(tz, localDayStr(tz, 0));
    const startOfYesterday  = localMidnightUTC(tz, localDayStr(tz, -1));
    const startOf2DaysAgo   = localMidnightUTC(tz, localDayStr(tz, -2));
    const startOfThisMonth  = localMidnightUTC(tz, localMonthStartStr(tz, 0));
    const startOfLastMonth  = localMidnightUTC(tz, localMonthStartStr(tz, -1));
    const startOf2MonthsAgo = localMidnightUTC(tz, localMonthStartStr(tz, -2));

    const queryPeriod = async (start: Date, stop: Date, window: string): Promise<number> => {
      const q = `
        from(bucket: "${config.influx.bucket}")
          |> range(start: ${start.toISOString()}, stop: ${stop.toISOString()})
          |> filter(fn: (r) => r._measurement == "dali_property"
                  and r.property == "driverEnergyConsumption"
                  and r._field == "value_num")
          ${guidFilter}
          |> group(columns: ["device_guid"])
          |> aggregateWindow(every: ${window}, fn: last, createEmpty: true)
          |> difference(nonNegative: true)
          |> filter(fn: (r) => exists r._value)
          |> keep(columns: ["_value"])
      `;
      const rows = await queryApi.collectRows<{ _value: number }>(q);
      return rows.reduce((sum, r) => sum + (r._value ?? 0), 0);
    };

    const pct = (curr: number, prev: number): number | null =>
      prev === 0 ? null : +((( curr - prev) / prev) * 100).toFixed(1);

    try {
      const [today, yesterday, dayBefore, currentMonth, lastMonth, monthBefore] =
        await Promise.all([
          queryPeriod(startOfToday,      now,              "1h"),
          queryPeriod(startOfYesterday,  startOfToday,     "1h"),
          queryPeriod(startOf2DaysAgo,   startOfYesterday, "1h"),
          queryPeriod(startOfThisMonth,  now,              "1d"),
          queryPeriod(startOfLastMonth,  startOfThisMonth, "1d"),
          queryPeriod(startOf2MonthsAgo, startOfLastMonth, "1d"),
        ]);

      const result = {
        today:        { wh: today,        changePercent: pct(today, yesterday)   },
        yesterday:    { wh: yesterday,    changePercent: pct(yesterday, dayBefore) },
        currentMonth: { wh: currentMonth, changePercent: pct(currentMonth, lastMonth) },
        lastMonth:    { wh: lastMonth,    changePercent: pct(lastMonth, monthBefore)  },
      };

      // Cache successful response
      cacheService.set(cacheKey, result);
      return result;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: "Failed to fetch energy stats" });
    }
  });
}

// ── Shared helpers ────────────────────────────────────────────────────────────

/** Builds an optional Flux device_guid filter line from a comma-separated guids string. */
function buildGuidFilter(guids?: string): string {
  if (!guids) return "";
  const conditions = guids
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => `r.device_guid == "${id}"`);
  return conditions.length ? `|> filter(fn: (r) => ${conditions.join(" or ")})` : "";
}


