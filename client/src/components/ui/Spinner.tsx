import React from 'react';
import { LoaderCircle } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12'
} as const;

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => (
  <LoaderCircle className={`animate-spin text-accent ${SIZES[size]} ${className}`} />
);

export default Spinner;
