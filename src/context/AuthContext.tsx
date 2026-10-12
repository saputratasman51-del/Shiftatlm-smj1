/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { dataService } from '../services/dataService';

interface AuthContextType {
  activeProfile: UserProfile;
  role: 'admin' | 'staff';
  isAdmin: boolean;
  loading: boolean;
  isLoggedIn: boolean;
  allProfiles: UserProfile[];
  switchProfile: (profileId: string) => Promise<void>;
  refreshProfiles: () => Promise<void>;
  login: (identifier: string, pass: string) => Promise<boolean>;
  logout: () => void;
  resetPassword: (identifier: string, newPass: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeProfile, setActiveProfile] = useState<UserProfile>(() => {
    return {
      id: 'user-admin-1',
      full_name: 'Tasman Saputra, S.Tr.Kes',
      nip_str: '19890412 201402 1 003',
      role: 'admin',
      position: 'Kepala Instalasi Laboratorium',
      phone: '081256789012',
      is_active: true,
    };
  });
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('shift_atlm_is_logged_in') === 'true';
  });

  const loadData = async () => {
    try {
      const profiles = await dataService.getProfiles();
      setAllProfiles(profiles);

      const active = await dataService.getActiveUser();
      setActiveProfile(active);
    } catch (err) {
      console.error('Error loading auth data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
        if (session?.user) {
          const profiles = await dataService.getProfiles();
          const found = profiles.find((p) => p.id === session.user.id);
          if (found) {
            setActiveProfile(found);
            dataService.setActiveUserId(found.id);
            setIsLoggedIn(true);
            localStorage.setItem('shift_atlm_is_logged_in', 'true');
          }
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const switchProfile = async (profileId: string) => {
    dataService.setActiveUserId(profileId);
    const updated = await dataService.getActiveUser();
    setActiveProfile(updated);
  };

  const login = async (identifier: string, pass: string): Promise<boolean> => {
    const user = await dataService.authenticate(identifier, pass);
    if (user) {
      setActiveProfile(user);
      dataService.setActiveUserId(user.id);
      setIsLoggedIn(true);
      localStorage.setItem('shift_atlm_is_logged_in', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('shift_atlm_is_logged_in');
  };

  const resetPassword = async (identifier: string, newPass: string): Promise<boolean> => {
    return await dataService.resetPassword(identifier, newPass);
  };

  const refreshProfiles = async () => {
    const profiles = await dataService.getProfiles();
    setAllProfiles(profiles);
    const updated = await dataService.getActiveUser();
    setActiveProfile(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        activeProfile,
        role: activeProfile.role,
        isAdmin: activeProfile.role === 'admin',
        loading,
        isLoggedIn,
        allProfiles,
        switchProfile,
        refreshProfiles,
        login,
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
