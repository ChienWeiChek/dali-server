'use client';

import RGBControl from './RGBControl';

interface RGBWControlProps {
  red: number;
  green: number;
  blue: number;
  white: number;
  onChange: (red: number, green: number, blue: number, white: number) => void;
  disabled?: boolean;
}

export default function RGBWControl({ red, green, blue, white, onChange, disabled = false }: RGBWControlProps) {
  const handleRGBChange = (newRed: number, newGreen: number, newBlue: number) => {
    onChange(newRed, newGreen, newBlue, white);
  };

  const handleWhiteChange = (newWhite: number) => {
    if (newWhite < 0) newWhite = 0;
    if (newWhite > 511) newWhite = 511;
    onChange(red, green, blue, newWhite);
  };

  const handleWhiteSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    handleWhiteChange(value);
  };

  const handleWhiteInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      handleWhiteChange(value);
    }
  };

  const getWhiteDescription = (value: number) => {
    if (value <= 255) {
      return `Modulation: ${value} (0-255 modulates white component)`;
    } else {
      return `Max White: ${value} (256-511 sets white to max 0xFF)`;
    }
  };

  return (
    <div className="space-y-6">
      <RGBControl
        red={red}
        green={green}
        blue={blue}
        onChange={handleRGBChange}
        disabled={disabled}
      />

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="font-medium text-gray-700">White Channel</label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="0"
              max="511"
              value={white}
              onChange={handleWhiteInputChange}
              disabled={disabled}
              className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
            />
            <span className="text-gray-600">(0-511)</span>
          </div>
        </div>
        
        <div className="relative">
          <input
            type="range"
            min="0"
            max="511"
            value={white}
            onChange={handleWhiteSliderChange}
            disabled={disabled}
            className="w-full h-2 bg-gradient-to-r from-gray-200 via-gray-300 to-white rounded-lg appearance-none cursor-pointer"
          />
          <div className="absolute top-0 left-0 w-full h-2 pointer-events-none">
            <div 
              className="absolute h-full bg-blue-200 opacity-50"
              style={{ width: `${(255/511)*100}%` }}
            />
          </div>
        </div>
        
        <div className="flex justify-between text-sm text-gray-500">
          <div className="text-left">
            <span>0</span>
            <div className="text-xs">Modulation</div>
          </div>
          <div className="text-center">
            <span>255</span>
            <div className="text-xs">Max Modulation</div>
          </div>
          <div className="text-right">
            <span>511</span>
            <div className="text-xs">Max White</div>
          </div>
        </div>

        <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
          <p className="text-sm font-medium text-gray-700">{getWhiteDescription(white)}</p>
          <p className="text-xs text-gray-500 mt-1">
            Values 0-255: Modulates white component like RGB channels
            <br />
            Values 256-511: Sets white component to maximum (0xFF) while RGB parts are gradually adjusted
          </p>
        </div>
      </div>
    </div>
  );
}
