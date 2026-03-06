

interface LevelControlProps {
  level: number;
  onChange: (level: number) => void;
  disabled?: boolean;
}

export default function LevelControl({ level, onChange, disabled = false }: LevelControlProps) {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    onChange(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      onChange(value);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="font-medium text-gray-700">Light Level</label>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            min="0"
            max="100"
            value={level}
            onChange={handleInputChange}
            disabled={disabled}
            className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
          />
          <span className="text-gray-600">%</span>
        </div>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={level}
        onChange={handleSliderChange}
        disabled={disabled}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-sm text-gray-500">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  );
}
