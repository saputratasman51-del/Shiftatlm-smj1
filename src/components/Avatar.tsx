import React, { useState } from 'react';
import { User } from 'lucide-react';
import { UserProfile } from '../types';

interface AvatarProps {
  profile?: UserProfile | null;
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showStatus?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-20 h-20 text-2xl',
};

export const Avatar: React.FC<AvatarProps> = ({
  profile,
  src,
  name,
  size = 'md',
  className = '',
  showStatus = false,
}) => {
  const [imageError, setImageError] = useState(false);

  const imageSrc = src || profile?.avatar_url;
  const displayName = name || profile?.full_name || 'Petugas';
  const initial = displayName.charAt(0).toUpperCase();

  const baseSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      {imageSrc && !imageError ? (
        <img
          src={imageSrc}
          alt={displayName}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className={`${baseSize} rounded-2xl object-cover border border-slate-200/80 shadow-2xs`}
        />
      ) : (
        <div
          className={`${baseSize} rounded-2xl bg-gradient-to-tr from-slate-800 to-blue-900 text-white font-bold flex items-center justify-center border border-slate-700/80 shadow-2xs`}
          title={displayName}
        >
          {initial || <User className="w-1/2 h-1/2 text-slate-300" />}
        </div>
      )}

      {showStatus && profile && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-white ${
            size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'
          } ${profile.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`}
          title={profile.is_active ? 'Aktif' : 'Nonaktif'}
        />
      )}
    </div>
  );
};
