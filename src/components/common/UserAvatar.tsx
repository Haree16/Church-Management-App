import React, { useState } from 'react';
import { getAvatarColor, getInitials } from '../../utils/avatarUtils';

export interface UserAvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  shape?: 'circle' | 'rounded' | 'square';
  className?: string;
  border?: boolean | string;
  alt?: string;
  indicator?: React.ReactNode;
  maxInitials?: 1 | 2;
  onClick?: () => void;
}

const SIZE_MAP = {
  xs: { box: 'w-6 h-6 min-w-[1.5rem]', text: 'text-[10px] font-bold', rounded: 'rounded-lg' },
  sm: { box: 'w-8 h-8 min-w-[2rem]', text: 'text-xs font-bold', rounded: 'rounded-xl' },
  md: { box: 'w-10 h-10 min-w-[2.5rem]', text: 'text-sm font-extrabold', rounded: 'rounded-xl' },
  lg: { box: 'w-12 h-12 min-w-[3rem]', text: 'text-base font-extrabold', rounded: 'rounded-2xl' },
  xl: { box: 'w-14 h-14 min-w-[3.5rem]', text: 'text-lg font-black', rounded: 'rounded-2xl' },
  '2xl': { box: 'w-16 h-16 min-w-[4rem]', text: 'text-xl font-black', rounded: 'rounded-2xl' },
  '3xl': { box: 'w-20 h-20 min-w-[5rem]', text: 'text-2xl font-black', rounded: 'rounded-3xl' },
  '4xl': { box: 'w-24 h-24 min-w-[6rem]', text: 'text-3xl font-black', rounded: 'rounded-3xl' },
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  shape = 'rounded',
  className = '',
  border = false,
  alt,
  indicator,
  maxInitials = 2,
  onClick,
}) => {
  const [imgError, setImgError] = useState(false);
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;

  const shapeClass =
    shape === 'circle'
      ? 'rounded-full'
      : shape === 'square'
      ? 'rounded-lg'
      : sizeConfig.rounded;

  const borderClass =
    typeof border === 'string'
      ? border
      : border
      ? 'border-2 border-white shadow-xs'
      : '';

  const theme = getAvatarColor(name || 'User');
  const initials = getInitials(name, maxInitials);
  const hasValidImg = Boolean(avatarUrl && avatarUrl.trim() && !imgError);

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {hasValidImg ? (
        <img
          src={avatarUrl!.trim()}
          alt={alt || name || 'User Avatar'}
          onError={() => setImgError(true)}
          className={`${sizeConfig.box} ${shapeClass} ${borderClass} object-cover shrink-0 ${className}`}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className={`${sizeConfig.box} ${shapeClass} ${borderClass} ${theme.gradient} ${theme.textColor} ${theme.shadowColor} shadow-xs flex items-center justify-center tracking-wider shrink-0 transition-transform ${sizeConfig.text} ${className}`}
          title={name || undefined}
        >
          <span>{initials}</span>
        </div>
      )}

      {indicator && (
        <div className="absolute -bottom-0.5 -right-0.5 pointer-events-none">
          {indicator}
        </div>
      )}
    </div>
  );
};
