'use client';

interface TemperatureControlProps {
  kelvin: number;
  mired: number;
  onChange: (kelvin: number, mired: number) => void;
  disabled?: boolean;
}

export default function TemperatureControl({ 
  kelvin, 
  mired, 
  onChange, 
  disabled = false 
}: TemperatureControlProps) {
  const minKelvin = 2700;
  const maxKelvin = 6500;

  const handleKelvinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKelvin = parseInt(e.target.value, 10);
    if (!isNaN(newKelvin) && newKelvin >= minKelvin && newKelvin <= maxKelvin) {
      const newMired = Math.round(1000000 / newKelvin);
      onChange(newKelvin, newMired);
    }
  };

  const handleKelvinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKelvin = parseInt(e.target.value, 10);
    if (!isNaN(newKelvin) && newKelvin >= minKelvin && newKelvin <= maxKelvin) {
      const newMired = Math.round(1000000 / newKelvin);
      onChange(newKelvin, newMired);
    }
  };

  const handleMiredInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMired = parseInt(e.target.value, 10);
    if (!isNaN(newMired) && newMired > 0) {
      const newKelvin = Math.round(1000000 / newMired);
      if (newKelvin >= minKelvin && newKelvin <= maxKelvin) {
        onChange(newKelvin, newMired);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="font-medium text-gray-700">Color Temperature</label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min={minKelvin}
              max={maxKelvin}
              value={kelvin}
              onChange={handleKelvinInputChange}
              disabled={disabled}
              className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
            />
            <span className="text-gray-600">K</span>
          </div>
        </div>
        <input
          type="range"
          min={minKelvin}
          max={maxKelvin}
          value={kelvin}
          onChange={handleKelvinChange}
          disabled={disabled}
          className="w-full h-2 bg-gradient-to-r from-yellow-300 to-blue-100 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-sm text-gray-500">
          <span>Warm (2700K)</span>
          <span>Neutral (4600K)</span>
          <span>Cool (6500K)</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="font-medium text-gray-700">Mired Value</label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="154"
              max="370"
              value={mired}
              onChange={handleMiredInputChange}
              disabled={disabled}
              className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
            />
            <span className="text-gray-600">mired</span>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          <p>Mired = 1,000,000 / Kelvin</p>
          <p className="mt-1">Examples: 2500K = 400 mired, 3000K = 333 mired, 4000K = 250 mired, 5000K = 200 mired</p>
        </div>
      </div>
    </div>
  );
}
