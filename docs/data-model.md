# Data Model

## InfluxDB Schema

### Measurement: `dali_property`

Stores individual property values for devices.

**Tags:**
- `controller_name`: Name of the controller (from config)
- `controller_ip`: IP of the controller
- `device_guid`: Unique ID of the device
- `device_name`: Human readable name of the device
- `property`: Name of the property (e.g., `driverInputPower`, `lightLevel`)
- `unit`: Unit of measurement (e.g., `W`, `%`)
- `zone`: Primary zone (if applicable)

**Fields:**
- `value_num`: Numeric value (float)
- `value_str`: String value (if applicable)

**retention policy**: `monthly` (infinite duration, 4 weeks shard group duration)

## Device Metadata

Stored in memory / cache, updated on poll.

- GUID
- Type (gear, etc)
- Short Address
- Zones
- Static properties (GTIN, etc)
