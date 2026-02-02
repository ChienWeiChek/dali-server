import { DaliClient } from "../controllers/daliClient.js";
import { InfluxWriter } from "./influxWriter.js";
import { AppConfig } from "../types/config.js";

export class PollerService {
  private clients: DaliClient[] = [];
  private influxWriter: InfluxWriter;
  private intervalSec: number;

  constructor(config: AppConfig, influxWriter: InfluxWriter) {
    this.influxWriter = influxWriter;
    this.intervalSec = config.controllers[0]?.pollingIntervalSec || 10;

    this.clients = config.controllers.map((c) => new DaliClient(c));
  }

  start() {
    console.log(
      `Starting poller service with ${this.clients.length} controllers, interval ${this.intervalSec}s`,
    );
    this.poll(); // Initial poll
    setInterval(() => this.poll(), this.intervalSec * 1000);
  }

  private async poll() {
    await Promise.all(
      this.clients.map((client) => this.pollController(client)),
    );
  }

  private async pollController(client: DaliClient) {
    try {
      const devices = await client.getDevices();
      console.log(
        `[${client.getConfig().name}] Found ${devices.length} devices for controller`,
      );

      const batchSize = client.getConfig().batchSize || 1;
      for (let i = 0; i < devices.length; i += batchSize) {
        const batch = devices.slice(i, i + batchSize);
        console.log(
          `[${client.getConfig().name}] Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} devices)`,
        );

        await Promise.all(
          batch.map(async (device) => {
            // const propsToFetch =
            //   device.properties && Array.isArray(device.properties)
            //     ? device.properties
            //     : ["lightLevel", "driverInputPower", "errorOverall"];
            const propsToFetch = ["driverInputPower"];
            await Promise.all(
              propsToFetch.map(async (prop: string) => {
                try {
                  // console.log(`[${client.getConfig().name}]Polling ${device.guid} ${prop}`);
                  const data = await client.getProperty(device.guid, prop);
                  if (data && data.value !== undefined) {
                    await this.influxWriter.writePoint({
                      measurement: "dali_property",
                      tags: {
                        controller: client.getConfig().name,
                        device_guid: device.guid,
                        property: prop,
                        unit: data.unit || "none",
                      },
                      fields: {
                        value_num:
                          typeof data.value === "number" ? data.value : 0,
                        value_str:
                          typeof data.value === "string" ? data.value : "",
                      },
                    });
                  }
                } catch (e) {
                  // Ignore specific property fetch error
                }
              }),
            );
          }),
        );
      }
    } catch (error) {
      console.error("Error polling controller:", error);
    }
  }
}
