import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'teal' | 'indigo' | 'red' | 'gray';
  onRemove?: () => void;
}

const colorStyles = {
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  purple: 'bg-purple-100 text-purple-800',
  orange: 'bg-orange-100 text-orange-800',
  pink: 'bg-pink-100 text-pink-800',
  teal: 'bg-teal-100 text-teal-800',
  indigo: 'bg-indigo-100 text-indigo-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-100 text-gray-800',
};

export function Badge({ children, color = 'blue', onRemove }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorStyles[color]}`}
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:bg-black hover:bg-opacity-10 rounded-full p-0.5"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}

// Helper to get consistent colors based on index
const BADGE_COLORS: BadgeProps['color'][] = [
  'blue',
  'green',
  'purple',
  'orange',
  'pink',
  'teal',
  'indigo',
  'red',
];

export function getBadgeColor(index: number): BadgeProps['color'] {
  return BADGE_COLORS[index % BADGE_COLORS.length];
}
