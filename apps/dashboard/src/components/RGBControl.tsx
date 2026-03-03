'use client';

interface RGBControlProps {
  red: number;
  green: number;
  blue: number;
  onChange: (red: number, green: number, blue: number) => void;
  disabled?: boolean;
}

interface ColorSliderProps {
  channel: 'red' | 'green' | 'blue';
  value: number;
  color: string;
  disabled: boolean;
  onSliderChange: (channel: 'red' | 'green' | 'blue', e: React.ChangeEvent<HTMLInputElement>) => void;
  onInputChange: (channel: 'red' | 'green' | 'blue', e: React.ChangeEvent<HTMLInputElement>) => void;
}

function ColorSlider({ 
  channel, 
  value, 
  color,
  disabled,
  onSliderChange,
  onInputChange
}: ColorSliderProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className={`w-4 h-4 rounded-full mr-2 bg-${color}-500`}></div>
          <span className="font-medium text-gray-700 capitalize">{channel}</span>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            min="0"
            max="255"
            value={value}
            onChange={(e) => onInputChange(channel, e)}
            disabled={disabled}
            className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
          />
          <span className="text-gray-600">(0-255)</span>
        </div>
      </div>
      <input
        type="range"
        min="0"
        max="255"
        value={value}
        onChange={(e) => onSliderChange(channel, e)}
        disabled={disabled}
        className={`w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-gray-200 to-${color}-500`}
      />
    </div>
  );
}

export default function RGBControl({ red, green, blue, onChange, disabled = false }: RGBControlProps) {
  const handleColorChange = (channel: 'red' | 'green' | 'blue', value: number) => {
    if (value < 0) value = 0;
    if (value > 255) value = 255;
    
    if (channel === 'red') onChange(value, green, blue);
    else if (channel === 'green') onChange(red, value, blue);
    else onChange(red, green, value);
  };

  const handleSliderChange = (channel: 'red' | 'green' | 'blue', e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    handleColorChange(channel, value);
  };

  const handleInputChange = (channel: 'red' | 'green' | 'blue', e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      handleColorChange(channel, value);
    }
  };

  const hexColor = `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`;
  const rgbDecimal = (red << 16) | (green << 8) | blue;

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <ColorSlider 
          channel="red" 
          value={red} 
          color="red" 
          disabled={disabled}
          onSliderChange={handleSliderChange}
          onInputChange={handleInputChange}
        />
        <ColorSlider 
          channel="green" 
          value={green} 
          color="green" 
          disabled={disabled}
          onSliderChange={handleSliderChange}
          onInputChange={handleInputChange}
        />
        <ColorSlider 
          channel="blue" 
          value={blue} 
          color="blue" 
          disabled={disabled}
          onSliderChange={handleSliderChange}
          onInputChange={handleInputChange}
        />
      </div>

      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-medium text-gray-700">Preview & Values</h4>
            <p className="text-sm text-gray-500">RGB values are sent as separate parameters</p>
          </div>
          <div 
            className="w-12 h-12 rounded border border-gray-300"
            style={{ backgroundColor: hexColor }}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-600">Hex Color</p>
            <p className="font-mono font-medium">{hexColor.toUpperCase()}</p>
          </div>
          <div>
            <p className="text-gray-600">Decimal RGB</p>
            <p className="font-mono font-medium">{rgbDecimal}</p>
          </div>
          <div>
            <p className="text-gray-600">Red</p>
            <p className="font-mono font-medium">{red}</p>
          </div>
          <div>
            <p className="text-gray-600">Green</p>
            <p className="font-mono font-medium">{green}</p>
          </div>
          <div>
            <p className="text-gray-600">Blue</p>
            <p className="font-mono font-medium">{blue}</p>
          </div>
          <div>
            <p className="text-gray-600">Format</p>
            <p className="font-mono font-medium">0xRRGGBB</p>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          <p>Note: If RGB sliders don't match calculated hex value, the API will use slider values (red, green, blue).</p>
          <p className="mt-1">Examples: Red = 0xFF0000 (16711680), Green = 0x00FF00 (65280), Blue = 0x0000FF (255)</p>
        </div>
      </div>
    </div>
  );
}
