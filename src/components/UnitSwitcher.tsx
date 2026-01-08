import type { UnitSystem } from '../utils/units';

interface UnitSwitcherProps {
  unitSystem: UnitSystem;
  onToggle: () => void;
}

export function UnitSwitcher({ unitSystem, onToggle }: UnitSwitcherProps) {
  const itemClass =
    'relative z-10 w-1/2 flex justify-center items-center text-xs font-bold transition-colors duration-300 select-none';
  const activeClass = 'text-white';
  const inactiveClass = 'text-blue-200/40 group-hover:text-blue-200/60';

  return (
    <div
      onClick={onToggle}
      className="group relative isolate flex h-8 w-24 cursor-pointer items-center rounded-lg border border-white/5 bg-blue-950/20 p-1 backdrop-blur-sm"
    >
      {/* Sliding Background */}
      <div
        className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded bg-white/10 shadow-sm transition-transform duration-300 ease-out ${
          unitSystem === 'imperial' ? 'translate-x-full' : 'translate-x-0'
        }`}
      />

      <div className={`${itemClass} ${unitSystem === 'metric' ? activeClass : inactiveClass}`}>
        °C
      </div>

      <div className={`${itemClass} ${unitSystem === 'imperial' ? activeClass : inactiveClass}`}>
        °F
      </div>
    </div>
  );
}
