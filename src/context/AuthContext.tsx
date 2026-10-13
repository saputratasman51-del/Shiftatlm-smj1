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
  authenticatedProfile: UserProfile;
  role: 'admin' | 'staff';
  isAdmin: boolean;
  isRealAdmin: boolean;
  canSimulate: boolean;
  isSimulating: boolean;
  loading: boolean;
  isLoggedIn: boolean;
  allProfiles: UserProfile[];
  switchProfile: (profileId: string) => Promise<boolean>;
  stopSimulation: () => Promise<void>;
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
  const [authenticatedProfile, setAuthenticatedProfile] = useState<UserProfile>(() => {
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

      const storedAuthId = localStorage.getItem('shift_atlm_auth_user_id');
      const active = await dataService.getActiveUser();

      let authUser: UserProfile | undefined;
      if (storedAuthId) {
        authUser = profiles.find((p) => p.id === storedAuthId);
      }

      if (!authUser) {
        // Default to active profile or first admin profile
        authUser = active || profiles.find((p) => p.role === 'admin') || profiles[0];
        if (authUser) {
          localStorage.setItem('shift_atlm_auth_user_id', authUser.id);
        }
      }

      if (authUser) {
        setAuthenticatedProfile(authUser);

        // Security enforcement: Petugas selain admin HANYA bisa akses akunnya sendiri
        if (authUser.role !== 'admin' && active.id !== authUser.id) {
          dataService.setActiveUserId(authUser.id);
          setActiveProfile(authUser);
        } else {
          setActiveProfile(active);
        }
      } else {
        setActiveProfile(active);
      }
    } catch (err) {
      console.error('Error loading auth data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to realtime profile updates across all staff
    const unsubscribeRealtime = dataService.subscribe((event) => {
      if (event.table === 'profiles' || event.table === 'ALL') {
        loadData();
      }
    });

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
        if (session?.user) {
          const profiles = await dataService.getProfiles();
          const found = profiles.find((p) => p.id === session.user.id);
          if (found) {
            setAuthenticatedProfile(found);
            setActiveProfile(found);
            localStorage.setItem('shift_atlm_auth_user_id', found.id);
            dataService.setActiveUserId(found.id);
            setIsLoggedIn(true);
            localStorage.setItem('shift_atlm_is_logged_in', 'true');
          }
        }
      });
      return () => {
        subscription.unsubscribe();
        unsubscribeRealtime();
      };
    }

    return () => unsubscribeRealtime();
  }, []);

  const isRealAdmin = authenticatedProfile.role === 'admin';
  const canSimulate = isRealAdmin;
  const isSimulating = isRealAdmin && activeProfile.id !== authenticatedProfile.id;

  const switchProfile = async (profileId: string): Promise<boolean> => {
    // Strict RBAC: Petugas selain admin hanya bisa akses akunnya sendiri
    if (!isRealAdmin && profileId !== authenticatedProfile.id) {
      console.warn('Akses ditolak: Petugas selain admin hanya dapat mengakses akunnya sendiri.');
      return false;
    }

    dataService.setActiveUserId(profileId);
    const updated = await dataService.getActiveUser();
    setActiveProfile(updated);
    return true;
  };

  const stopSimulation = async () => {
    if (authenticatedProfile) {
      dataService.setActiveUserId(authenticatedProfile.id);
      const updated = await dataService.getActiveUser();
      setActiveProfile(updated);
    }
  };

  const login = async (identifier: string, pass: string): Promise<boolean> => {
    const user = await dataService.authenticate(identifier, pass);
    if (user) {
      setAuthenticatedProfile(user);
      setActiveProfile(user);
      localStorage.setItem('shift_atlm_auth_user_id', user.id);
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
    localStorage.removeItem('shift_atlm_auth_user_id');
  };

  const resetPassword = async (identifier: string, newPass: string): Promise<boolean> => {
    return await dataService.resetPassword(identifier, newPass);
  };

  const refreshProfiles = async () => {
    const profiles = await dataService.getProfiles();
    setAllProfiles(profiles);
    const updated = await dataService.getActiveUser();
    setActiveProfile(updated);
    const storedAuthId = localStorage.getItem('shift_atlm_auth_user_id');
    if (storedAuthId) {
      const auth = profiles.find((p) => p.id === storedAuthId);
      if (auth) setAuthenticatedProfile(auth);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        activeProfile,
        authenticatedProfile,
        role: activeProfile.role,
        isAdmin: activeProfile.role === 'admin',
        isRealAdmin,
        canSimulate,
        isSimulating,
        loading,
        isLoggedIn,
        allProfiles,
        switchProfile,
        stopSimulation,
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
