import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  color?: string;
  loading?: boolean;
}

export default function StatCard({
  title,
  value,
  unit,
  icon,
  trend,
  color,
  loading
}: StatCardProps) {
  return (
    <Card
      sx={{
        height: '100%',
        bgcolor: color ? `${color}10` : 'background.paper',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            {loading ? (
              <CircularProgress size={24} sx={{ mt: 1 }} />
            ) : (
              <Typography
                variant="h4"
                component="div"
                sx={{ color: color, fontWeight: 'bold', mt: 1 }}
              >
                {value}
                {unit && (
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{ ml: 0.5, fontSize: '0.875rem' }}
                  >
                    {unit}
                  </Typography>
                )}
              </Typography>
            )}
            {trend && !loading && (
              <Box display="flex" alignItems="center" mt={1}>
                {trend.direction === 'up' ? (
                  <TrendingUp fontSize="small" color="success" />
                ) : (
                  <TrendingDown fontSize="small" color="error" />
                )}
                <Typography
                  variant="caption"
                  ml={0.5}
                  color={trend.direction === 'up' ? 'success.main' : 'error.main'}
                >
                  {trend.value}%
                </Typography>
              </Box>
            )}
          </Box>
          {icon && (
            <Box
              sx={{
                color: color || 'primary.main',
                opacity: 0.7,
                fontSize: '2.5rem'
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
