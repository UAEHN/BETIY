'use client';

import Image from 'next/image';
import { User } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';

type UserAvatarProps = {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
};

export const UserAvatar = ({ user, size = 'md', showName = false }: UserAvatarProps) => {
  const { user: currentAuthUser } = useAuth();
  
  const sizeMap = {
    sm: 32,
    md: 40,
    lg: 64,
  };

  const pixelSize = sizeMap[size];
  const avatarUrl = user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`;
  
  // استخدام name من auth.user_metadata إذا كان متوفراً ومطابقاً للمستخدم الحالي
  const displayName = (() => {
    // إذا كان هذا هو المستخدم الحالي، نستخدم name من المصادقة إذا كان متوفراً
    if (currentAuthUser && currentAuthUser.id === user.id && 
        currentAuthUser.authData?.user?.user_metadata) {
      // Supabase يستخدم name في user_metadata وليس display_name
      return currentAuthUser.authData.user.user_metadata.name || 
             user.name || 
             user.username || 
             'مستخدم';
    }
    // في غير ذلك، نستخدم اسم المستخدم ثم الاسم
    return user.name || user.username || 'مستخدم';
  })();

  return (
    <div className="flex items-center gap-2">
      <div className={`relative overflow-hidden rounded-full bg-gray-200`} style={{ width: pixelSize, height: pixelSize }}>
        <Image
          src={avatarUrl}
          alt={`صورة ${displayName}`}
          width={pixelSize}
          height={pixelSize}
          className="object-cover"
        />
      </div>
      {showName && (
        <span className="font-medium text-gray-900 dark:text-gray-100">{displayName}</span>
      )}
    </div>
  );
};
