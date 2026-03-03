# Available Properties Reference

## Properties Collected in InfluxDB

The following properties are available for dashboard visualization:

### Power & Energy
1. **driverInputPower** - Active input power (W)
2. **driverEnergyConsumption** - Active input energy (Wh)
3. **driverInputVoltage** - Driver input voltage (Vrms)

### Temperature
4. **driverTemperature** - Driver temperature (°C)

### Operation Time
5. **driverOperationTime** - Driver operation time (s)
6. **lampOperationTime** - Lamp operation time (s)

### Light Control
7. **lightLevel** - DALI control gear light level (%)

### Error Monitoring
8. **errorOverall** - Overall error flag (0 = OK, >0 = Error)
9. **errorBits** - Error bits
10. **errorBitsCoupler** - Error bits coupler

---

## Dashboard Metrics Mapping

### KPI Cards

1. **Total Devices**
   - Source: Device list API
   - Calculation: Count of devices

2. **Average Light Level**
   - Property: `lightLevel`
   - Calculation: Average across selected devices
   - Unit: %

3. **Total Energy Consumption**
   - Property: `driverEnergyConsumption`
   - Calculation: Sum across selected devices
   - Unit: Wh

4. **Active Errors Count**
   - Property: `errorOverall`
   - Calculation: Count of devices where value > 0
   - Display: Red if > 0, Green if 0

---

## Chart Data Sources

### Line Chart - Light Level Trends
- **Property**: `lightLevel`
- **Aggregation**: Mean over time windows
- **Unit**: %

### Bar Chart - Energy Consumption by Device
- **Property**: `driverEnergyConsumption`
- **Aggregation**: Last value per device
- **Unit**: Wh
- **Sort**: Descending by value
- **Limit**: Top 10 devices

### Pie Chart - Devices by Zone
- **Source**: Device list API (not InfluxDB)
- **Calculation**: Group devices by zone, count per zone

### Area Chart - Power Consumption Trend
- **Property**: `driverInputPower`
- **Aggregation**: Mean over time windows
- **Unit**: W

### Gauge Charts (Real-time)

1. **Driver Input Power**
   - Property: `driverInputPower`
   - Range: 0-200 W
   - Update: Every 5 seconds

2. **Driver Temperature**
   - Property: `driverTemperature`
   - Range: 0-100 °C
   - Update: Every 5 seconds

3. **Input Voltage**
   - Property: `driverInputVoltage`
   - Range: 0-300 Vrms
   - Update: Every 5 seconds

---

## Data Table Columns

| Column | Property | Unit | Format |
|--------|----------|------|--------|
| Device Name | title (from device API) | - | String |
| Zone | zones (from device API) | - | String |
| Light Level | `lightLevel` | % | Number (1 decimal) |
| Power | `driverInputPower` | W | Number (2 decimals) |
| Energy | `driverEnergyConsumption` | Wh | Number (2 decimals) |
| Voltage | `driverInputVoltage` | Vrms | Number (1 decimal) |
| Temperature | `driverTemperature` | °C | Number (1 decimal) |
| Status | `errorOverall` | - | OK / Error |

---

## Property Units Reference

| Property | Unit | Type | Range |
|----------|------|------|-------|
| lightLevel | % | Number | 0-100 |
| driverInputPower | W | Number | 0-500 |
| driverEnergyConsumption | Wh | Number | 0-∞ |
| driverInputVoltage | Vrms | Number | 0-300 |
| driverTemperature | °C | Number | -40-100 |
| driverOperationTime | s | Number | 0-∞ |
| lampOperationTime | s | Number | 0-∞ |
| errorOverall | - | Number | 0 or 1 |
| errorBits | - | String/Number | Varies |
| errorBitsCoupler | - | String/Number | Varies |

---

## Query Examples

### Get Latest Light Level for a Device
```flux
from(bucket: "dali_devices")
  |> range(start: -5m)
  |> filter(fn: (r) => r._measurement == "dali_property")
  |> filter(fn: (r) => r.device_guid == "abc-123")
  |> filter(fn: (r) => r.property == "lightLevel")
  |> filter(fn: (r) => r._field == "value_num")
  |> last()
```

### Get Average Power Across Devices
```flux
from(bucket: "dali_devices")
  |> range(start: -5m)
  |> filter(fn: (r) => r._measurement == "dali_property")
  |> filter(fn: (r) => r.property == "driverInputPower")
  |> filter(fn: (r) => r._field == "value_num")
  |> last()
  |> mean()
```

### Get Energy Consumption Trend (24h)
```flux
from(bucket: "dali_devices")
  |> range(start: -24h)
  |> filter(fn: (r) => r._measurement == "dali_property")
  |> filter(fn: (r) => r.property == "driverEnergyConsumption")
  |> filter(fn: (r) => r._field == "value_num")
  |> aggregateWindow(every: 15m, fn: mean, createEmpty: false)
```

### Count Devices with Errors
```flux
from(bucket: "dali_devices")
  |> range(start: -5m)
  |> filter(fn: (r) => r._measurement == "dali_property")
  |> filter(fn: (r) => r.property == "errorOverall")
  |> filter(fn: (r) => r._field == "value_num")
  |> last()
  |> filter(fn: (r) => r._value > 0)
  |> count()
```

---

## Dashboard Configuration

### Default Properties for Metrics API
```typescript
const DEFAULT_PROPERTIES = [
  'lightLevel',
  'driverInputPower',
  'driverEnergyConsumption',
  'driverTemperature',
  'driverInputVoltage'
];
```

### Default Properties for Data Table
```typescript
const TABLE_PROPERTIES = [
  'lightLevel',
  'driverInputPower',
  'driverEnergyConsumption',
  'driverInputVoltage',
  'driverTemperature',
  'errorOverall'
];
```

### Real-time Gauge Properties
```typescript
const GAUGE_PROPERTIES = [
  'driverInputPower',
  'driverTemperature',
  'driverInputVoltage'
];
```

---

## Notes

1. **Error Properties**: `errorBits` and `errorBitsCoupler` may contain complex data structures. Use `errorOverall` for simple error detection.

2. **Operation Time**: Both `driverOperationTime` and `lampOperationTime` are cumulative values in seconds. Convert to hours for display: `value / 3600`.

3. **Energy Consumption**: `driverEnergyConsumption` is cumulative. For period-based consumption, calculate the difference between start and end values.

4. **Light Level**: Represents the current dimming level (0-100%). Not the actual luminous flux.

5. **Voltage Range**: Typical range is 200-240 Vrms for standard AC power. Adjust gauge max value based on your region.

---

## Future Enhancements

Properties that could be added in the future:
- Power factor
- Input frequency
- Output current/voltage
- Lamp failure status
- Emergency mode/status
- Battery charge (for emergency lights)
