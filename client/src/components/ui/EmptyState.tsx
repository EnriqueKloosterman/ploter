import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  children?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, message, children }) => (
  <div className="flex flex-col items-center justify-center gap-1.5 py-6 px-4 text-center">
    <Icon className="w-7 h-7 text-slate-600 shrink-0" />
    <p className="text-xs text-slate-500 italic">{message}</p>
    {children}
  </div>
);

export default EmptyState;
