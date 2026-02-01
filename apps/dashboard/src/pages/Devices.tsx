import { useQuery } from '@tanstack/react-query';
import { getDevices } from '../api/client';
import DeviceAccordion from '../components/DeviceAccordion';
import { CircularProgress, Typography, Container, Alert } from '@mui/material';

export default function Devices() {
  const { data: devices, isLoading, error } = useQuery({
    queryKey: ['devices'],
    queryFn: getDevices,
    refetchInterval: 10000, // Poll every 10s as fallback or alongside WS
  });

  return (
    <Container maxWidth="lg" className="py-8">
      <Typography variant="h4" component="h1" className="mb-6">
        Device Explorer
      </Typography>

      {isLoading && (
        <div className="flex justify-center p-8">
          <CircularProgress />
        </div>
      )}

      {error && (
        <Alert severity="error" className="mb-4">
          Error loading devices: {(error as Error).message}
        </Alert>
      )}

      {devices && <DeviceAccordion devices={devices} />}
    </Container>
  );
}
