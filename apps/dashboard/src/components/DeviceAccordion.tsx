import { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeviceModal from './DeviceModal';

interface DeviceAccordionProps {
  devices: any[];
}

export default function DeviceAccordion({ devices }: DeviceAccordionProps) {
  const [selectedDevice, setSelectedDevice] = useState<any>(null);

  // Group by zone
  const devicesByZone = devices.reduce((acc, device) => {
    const zone = device.zone || 'Unassigned';
    if (!acc[zone]) acc[zone] = [];
    acc[zone].push(device);
    return acc;
  }, {} as Record<string, any[]>);

  const zones = Object.keys(devicesByZone).sort();

  return (
    <div className="w-full">
      {zones.map((zone) => (
        <Accordion key={zone} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">{zone}</Typography>
            <Chip 
                label={devicesByZone[zone].length} 
                size="small" 
                className="ml-2" 
                color="primary" 
                variant="outlined" 
            />
          </AccordionSummary>
          <AccordionDetails className="p-0">
            <List>
              {devicesByZone[zone].map((device: any) => (
                <ListItem key={device.guid} disablePadding>
                  <ListItemButton onClick={() => setSelectedDevice(device)}>
                    <ListItemText 
                        primary={device.title} 
                        secondary={`Addr: ${device.shortAddress ?? '-'} | Type: ${device.type ?? 'Unknown'}`} 
                    />
                    {/* Status indicator could go here */}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}

      <DeviceModal 
        open={!!selectedDevice} 
        onClose={() => setSelectedDevice(null)} 
        device={selectedDevice} 
      />
    </div>
  );
}
