import { Autocomplete, TextField, Box, Chip } from '@mui/material';

interface Device {
  guid: string;
  title: string;
  zones?: string[];
}

interface DeviceSelectorProps {
  devices: Device[];
  selectedDevices: string[];
  selectedZones: string[];
  onDeviceChange: (deviceIds: string[]) => void;
  onZoneChange: (zones: string[]) => void;
}

export default function DeviceSelector({
  devices,
  selectedDevices,
  selectedZones,
  onDeviceChange,
  onZoneChange
}: DeviceSelectorProps) {
  // Extract unique zones
  const zones = Array.from(
    new Set(devices.flatMap(d => d.zones || []))
  ).sort();

  // Filter devices by selected zones
  const filteredDevices = selectedZones.length > 0
    ? devices.filter(d => d.zones?.some(z => selectedZones.includes(z)))
    : devices;

  return (
    <Box display="flex" gap={2} flexWrap="wrap">
      <Autocomplete
        multiple
        options={zones}
        value={selectedZones}
        onChange={(_, newValue) => onZoneChange(newValue)}
        renderInput={(params) => (
          <TextField {...params} label="Filter by Zone" placeholder="Select zones" size="small" />
        )}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip label={option} size="small" {...getTagProps({ index })} />
          ))
        }
        sx={{ minWidth: 250 }}
      />

      <Autocomplete
        multiple
        options={filteredDevices}
        getOptionLabel={(option) => option.title}
        value={filteredDevices.filter(d => selectedDevices.includes(d.guid))}
        onChange={(_, newValue) => onDeviceChange(newValue.map(d => d.guid))}
        renderInput={(params) => (
          <TextField {...params} label="Select Devices" placeholder="Select devices" size="small" />
        )}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip label={option.title} size="small" {...getTagProps({ index })} />
          ))
        }
        sx={{ minWidth: 300 }}
      />
    </Box>
  );
}
