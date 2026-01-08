
import type { UnitSystem } from '../utils/units';

interface UnitSwitcherProps {
  unitSystem: UnitSystem;
  onToggle: () => void;
}

export function UnitSwitcher({ unitSystem, onToggle }: UnitSwitcherProps) {
  return (
    <div
      onClick={onToggle}
      className="flex items-center p-1 bg-blue-950/20 backdrop-blur-sm rounded-lg border border-white/5 isolate cursor-pointer group h-8 relative w-24"
    >
      {/* Sliding Background */}
      <div
        className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] bg-white/10 rounded shadow-sm transition-transform duration-300 ease-out ${
          unitSystem === 'imperial' ? 'translate-x-full' : 'translate-x-0'
        }`}
      />

      <div className={`relative z-10 w-1/2 flex justify-center items-center text-xs font-bold transition-colors duration-300 select-none ${
        unitSystem === 'metric' ? 'text-white' : 'text-blue-200/40 group-hover:text-blue-200/60'
      }`}>
        °C
      </div>

      <div className={`relative z-10 w-1/2 flex justify-center items-center text-xs font-bold transition-colors duration-300 select-none ${
        unitSystem === 'imperial' ? 'text-white' : 'text-blue-200/40 group-hover:text-blue-200/60'
      }`}>
        °F
      </div>
    </div>
  );
}
