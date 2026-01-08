import type { ReactNode } from 'react';

interface FullScreenMessageProps {
  children: ReactNode;
}

export function FullScreenMessage({ children }: FullScreenMessageProps) {
  // standardized background to match the "dark" feel but consistent classes
  return (
    <div className="flex h-screen items-center justify-center bg-slate-900 p-4 text-center font-sans text-white">
      {children}
    </div>
  );
}
