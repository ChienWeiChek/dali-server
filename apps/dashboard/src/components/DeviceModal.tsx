import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';

interface DeviceModalProps {
  open: boolean;
  onClose: () => void;
  device: any;
}

export default function DeviceModal({ open, onClose, device }: DeviceModalProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  if (!device) return null;

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={onClose}
      aria-labelledby="device-dialog-title"
    >
      <DialogTitle id="device-dialog-title">
        {device.title}
      </DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" gutterBottom>
          Details
        </Typography>
        <List>
          <ListItem>
            <ListItemText primary="GUID" secondary={device.guid} />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText primary="Zone" secondary={device.zone || 'N/A'} />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText primary="Type" secondary={device.type || 'Unknown'} />
          </ListItem>
        </List>
        
        <Typography variant="subtitle1" className="mt-4" gutterBottom>
          Properties
        </Typography>
        <div className="grid grid-cols-2 gap-2">
            {device.properties && Object.entries(device.properties).map(([key, value]) => (
                <div key={key} className="p-2 border rounded">
                    <Typography variant="caption" color="textSecondary">{key}</Typography>
                    <Typography variant="body1">{String(value)}</Typography>
                </div>
            ))}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} autoFocus>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
