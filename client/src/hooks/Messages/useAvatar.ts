import { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import { initials } from '@dicebear/collection';
import type { TUser } from 'librechat-data-provider';

const avatarCache: Record<string, string> = {};

const useAvatar = (user: TUser | undefined) => {
  return useMemo(() => {
    const { username, name } = user ?? {};
    const fullSeed = name || username;
    if (!fullSeed) {
      return '';
    }

    if (user?.avatar && user?.avatar !== '') {
      return user.avatar;
    }

    // Extract only the first letter for the seed
    const seed = fullSeed.charAt(0).toUpperCase();
    
    if (avatarCache[seed]) {
      return avatarCache[seed];
    }

    const avatar = createAvatar(initials, {
      seed,
      fontFamily: ['sans-serif'],
      backgroundColor: ['#f0f0f0'],
      fontSize: 44,
    });

    let avatarDataUri = '';
    try {
      avatarDataUri = avatar.toDataUri();
      if (avatarDataUri) {
        avatarCache[seed] = avatarDataUri;
      }
    } catch (error) {
      console.error('Failed to generate avatar:', error);
    }

    return avatarDataUri;
  }, [user]);
};

export default useAvatar;
