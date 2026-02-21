import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { UserProfile } from '@/types';

const USER_STORAGE_KEY = '@ricequality_user';

export const [UserProvider, useUser] = createContextHook(() => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const queryClient = useQueryClient();

  const userQuery = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      console.log('[UserContext] Loading user profile from storage');
      const stored = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile;
        console.log('[UserContext] User loaded:', parsed.name);
        return parsed;
      }
      return null;
    },
  });

  useEffect(() => {
    if (userQuery.data !== undefined) {
      setUser(userQuery.data);
    }
  }, [userQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (profile: UserProfile) => {
      console.log('[UserContext] Saving user profile:', profile.name);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
      return profile;
    },
    onSuccess: (profile) => {
      setUser(profile);
      queryClient.setQueryData(['user-profile'], profile);
    },
  });

  const saveUser = useCallback(
    (profile: UserProfile) => {
      saveMutation.mutate(profile);
    },
    [saveMutation]
  );

  const clearUser = useCallback(async () => {
    console.log('[UserContext] Clearing user profile');
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
    queryClient.setQueryData(['user-profile'], null);
  }, [queryClient]);

  const acceptDisclaimer = useCallback(() => {
    if (user) {
      const updated = {
        ...user,
        disclaimerAccepted: true,
        disclaimerAcceptedAt: new Date().toISOString(),
      };
      saveMutation.mutate(updated);
    }
  }, [user, saveMutation]);

  return {
    user,
    isLoading: userQuery.isLoading,
    isOnboarded: !!user?.disclaimerAccepted,
    saveUser,
    clearUser,
    acceptDisclaimer,
  };
});
