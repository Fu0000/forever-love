import React from 'react';
import { clsx } from 'clsx';

type Props = {
  name: string;
  avatar: string;
  label?: string;
  size?: 'sm' | 'md';
  variant?: 'dark' | 'light';
  className?: string;
};

export const UserBadge: React.FC<Props> = ({
  name,
  avatar,
  label,
  size = 'sm',
  variant = 'dark',
  className,
}) => {
  const imgSize = size === 'md' ? 'w-8 h-8' : 'w-6 h-6';
  const textSize = size === 'md' ? 'text-sm' : 'text-[11px]';
  const textColor = variant === 'light' ? 'text-white' : 'text-gray-700';

  return (
    <div className={clsx('flex items-center gap-2 min-w-0', className)}>
      <div className={clsx('relative shrink-0 rounded-full bg-white', imgSize)}>
        <img
          src={avatar}
          alt={name}
          className={clsx('rounded-full object-cover border-2 border-white', imgSize)}
        />
        {label && (
          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black border border-white leading-none">
            {label}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <div className={clsx('font-black truncate', textColor, textSize)}>
          {name}
        </div>
      </div>
    </div>
  );
};
