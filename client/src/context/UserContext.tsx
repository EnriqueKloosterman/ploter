import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from './AuthContext';

interface IGlobalTag {
  tagId: string;
  label: string;
  color: string;
}

interface UserContextType {
  tags: IGlobalTag[];
  addTag: (tag: IGlobalTag) => void;
  updateTag: (tagId: string, updates: Partial<IGlobalTag>) => void;
  removeTag: (tagId: string) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tags, setTags] = useState<IGlobalTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.authorLibrary?.globalTags) {
      setTags(user.authorLibrary.globalTags);
    }
    setIsLoading(false);
  }, [user]);

  const persistTags = useCallback(async (newTags: IGlobalTag[]) => {
    try {
      await apiFetch('/api/user/me/library/tags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags }),
      });
    } catch (err) {
      console.error('Error saving tags:', err);
    }
  }, []);

  const addTag = useCallback((tag: IGlobalTag) => {
    setTags((prev) => {
      const next = [...prev, tag];
      persistTags(next);
      return next;
    });
  }, [persistTags]);

  const updateTag = useCallback((tagId: string, updates: Partial<IGlobalTag>) => {
    setTags((prev) => {
      const next = prev.map((t) => t.tagId === tagId ? { ...t, ...updates } : t);
      persistTags(next);
      return next;
    });
  }, [persistTags]);

  const removeTag = useCallback((tagId: string) => {
    setTags((prev) => {
      const next = prev.filter((t) => t.tagId !== tagId);
      persistTags(next);
      return next;
    });
  }, [persistTags]);

  return (
    <UserContext.Provider value={{ tags, addTag, updateTag, removeTag, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within a UserProvider');
  return ctx;
};
