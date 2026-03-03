import { ToggleButtonGroup, ToggleButton } from '@mui/material';

interface TimeRangeSelectorProps {
  value: string;
  onChange: (range: string) => void;
  options?: { label: string; value: string }[];
}

const DEFAULT_OPTIONS = [
  { label: '1H', value: '1h' },
  { label: '6H', value: '6h' },
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' }
];

export default function TimeRangeSelector({
  value,
  onChange,
  options = DEFAULT_OPTIONS
}: TimeRangeSelectorProps) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, newValue) => newValue && onChange(newValue)}
      size="small"
      sx={{
        '& .MuiToggleButton-root': {
          px: 2,
          py: 0.5
        }
      }}
    >
      {options.map(option => (
        <ToggleButton key={option.value} value={option.value}>
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
