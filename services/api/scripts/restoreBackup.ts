import fs from "fs";
import readline from "readline";
import path from "path";
import { InfluxWriter } from "../src/services/influxWriter.js";
import { loadConfig } from "../src/config/loader.js";

async function restore() {
  try {
    console.log("Loading configuration...");
    const config = await loadConfig();

    console.log(
      `Initializing InfluxWriter (URL: ${config.influx.url}, Bucket: ${config.influx.bucket})...`,
    );
    const influxWriter = new InfluxWriter(config.influx);

    // Check health before starting
    const health = await influxWriter.checkHealth();
    if (health.status !== "healthy") {
      console.error(`InfluxDB unhealthy: ${health.message}`);
      process.exit(1);
    }
    console.log("InfluxDB connection established.");

    // Path to CSV file - relative to services/api directory (project root)
    // The CSV is in the workspace root, which is two levels up from services/api
    const csvPath = path.resolve(
      process.cwd(),
      "../../Data.csv",
    );

    console.log(`Reading CSV from: ${csvPath}`);

    if (!fs.existsSync(csvPath)) {
      console.error(`CSV file not found at ${csvPath}`);
      process.exit(1);
    }

    const fileStream = fs.createReadStream(csvPath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let headerMap: Record<string, number> | null = null;
    let count = 0;
    let skipped = 0;

    console.log("Starting import...");

    for await (const line of rl) {
      if (!line.trim()) continue;

      // Simple CSV parsing handling quotes
      const row: string[] = [];
      let current = "";
      let inQuote = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuote = !inQuote;
        } else if (char === "," && !inQuote) {
          row.push(cleanField(current));
          current = "";
        } else {
          current += char;
        }
      }
      row.push(cleanField(current)); // Push the last field

      if (!headerMap) {
        // Parse header
        headerMap = {};
        row.forEach((col, index) => {
          if (headerMap) headerMap[col] = index;
        });
        console.log("Headers found:", Object.keys(headerMap));

        const requiredHeaders = [
          "time",
          "dali_property.category",
          "dali_property.value_num",
        ];
        const missing = requiredHeaders.filter(
          (h) => !headerMap!.hasOwnProperty(h),
        );
        if (missing.length > 0) {
          console.error("Missing required headers:", missing);
          process.exit(1);
        }
        continue;
      }

      try {
        const timeStr = row[headerMap["time"]];
        if (!timeStr) {
          skipped++;
          continue;
        }

        const category = row[headerMap["dali_property.category"]] || "";
        const controller = row[headerMap["dali_property.controller"]] || "";
        const guid = row[headerMap["dali_property.device_guid"]] || "";
        const property = row[headerMap["dali_property.property"]] || "";
        const title = row[headerMap["dali_property.title"]] || "";
        const unit = row[headerMap["dali_property.unit"]] || "";
        const valueNumStr = row[headerMap["dali_property.value_num"]];

        const value = parseFloat(valueNumStr);
        if (isNaN(value)) {
          skipped++;
          continue;
        }

        const timestamp = new Date(timeStr);
        if (isNaN(timestamp.getTime())) {
          console.warn(`Invalid timestamp: ${timeStr}`);
          skipped++;
          continue;
        }
        const dataToWrite = {
          // Only include tags that have values to prevent undefined/null errors
          // ...(controller && { controller }),
          controller:"jocedali2",
          ...(guid && { device_guid: guid }),
          ...(property && { property }),
          ...(unit && { unit }),
          ...(title && { title }),
        };
        await influxWriter.writePoint({
          measurement: "dali_property",
          tags: dataToWrite,
          fields: {
            value_num: value,
          },
          timestamp: timestamp,
        });

        count++;
        if (count % 1000 === 0) {
          console.log(`Processed ${count} records...`);
        }
      } catch (e) {
        console.warn("Error processing line:", e);
        skipped++;
      }
    }

    console.log(`Import finished. Processed: ${count}, Skipped: ${skipped}`);

    console.log("Flushing remaining data...");
    await influxWriter.dispose();
    console.log("Done.");
  } catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
  }
}

function cleanField(field: string): string {
  if (field.startsWith('"') && field.endsWith('"')) {
    return field.substring(1, field.length - 1);
  }
  return field;
}

restore();
