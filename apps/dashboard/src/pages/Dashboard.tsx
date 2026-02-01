import { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography, Card, CardContent } from '@mui/material';
import RealTimeGauge from '../components/charts/RealTimeGauge';
import HistoryChart from '../components/charts/HistoryChart';

export default function Dashboard() {
  const [lightLevel, setLightLevel] = useState(0);
  const [power, setPower] = useState(0);
  const [history, setHistory] = useState<{ time: string; value: number }[]>([]);

  // Mock data update
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const time = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
      const newPower = Math.random() * 50 + 10;
      
      setLightLevel(Math.random() * 100);
      setPower(newPower);
      
      setHistory(prev => {
        const next = [...prev, { time, value: newPower }];
        if (next.length > 20) next.shift();
        return next;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Container maxWidth="lg" className="py-8">
      <Typography variant="h4" component="h1" className="mb-6">
        System Overview
      </Typography>

      <Grid container spacing={4}>
        {/* Summary Cards */}
        <Grid item xs={12} md={4}>
          <Card className="h-full bg-blue-50">
            <CardContent>
              <Typography variant="h6" color="textSecondary">Active Devices</Typography>
              <Typography variant="h3">24</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card className="h-full bg-green-50">
            <CardContent>
              <Typography variant="h6" color="textSecondary">Total Power</Typography>
              <Typography variant="h3">{Math.round(power * 24)} W</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card className="h-full bg-red-50">
            <CardContent>
              <Typography variant="h6" color="textSecondary">Errors</Typography>
              <Typography variant="h3" color="error">0</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Real-time Gauges */}
        <Grid item xs={12} md={6}>
          <Paper className="p-4 h-full">
            <RealTimeGauge title="Avg Light Level" value={Math.round(lightLevel)} unit="%" />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper className="p-4 h-full">
            <RealTimeGauge title="Avg Driver Power" value={Math.round(power)} unit="W" max={100} />
          </Paper>
        </Grid>

        {/* History Chart */}
        <Grid item xs={12}>
          <Paper className="p-4">
            <HistoryChart title="Power Consumption Trend (Live)" data={history} />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
