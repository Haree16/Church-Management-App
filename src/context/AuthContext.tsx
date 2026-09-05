import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Church, ChurchMember, Profile, UserRole } from '@/types/database';
import { DEMO_CHURCH, DEMO_CHURCH_2, DEMO_USERS, DemoUserOption } from '@/lib/mockData';
import { churchService, CreateChurchPayload, getStoredChurches, saveStoredChurches } from '@/services/churchService';
import { toast } from 'sonner';

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  activeChurch: Church | null;
  currentRole: UserRole | null;
  churchMember: ChurchMember | null;
  availableChurches: Church[];
  isLoading: boolean;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  switchRole: (role: UserRole) => void;
  switchChurch: (churchId: string) => void;
  createChurch: (payload: CreateChurchPayload) => Promise<Church>;
  updateChurch: (id: string, payload: Partial<Church>) => Promise<Church>;
  setDemoUser: (userOption: DemoUserOption) => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_DEMO_KEY = 'church_cms_demo_user';
const LOCAL_STORAGE_ACTIVE_CHURCH_KEY = 'church_cms_active_church_id';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeChurch, setActiveChurch] = useState<Church | null>(() => {
    const churches = getStoredChurches();
    const savedChurchId = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_ACTIVE_CHURCH_KEY) : null;
    return churches.find((c) => c.id === savedChurchId) || churches[0] || DEMO_CHURCH;
  });
  const [currentRole, setCurrentRole] = useState<UserRole | null>('church_admin');
  const [churchMember, setChurchMember] = useState<ChurchMember | null>(null);
  const [availableChurches, setAvailableChurches] = useState<Church[]>(() => getStoredChurches());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Apply a demo user directly
  const applyDemoUser = useCallback((demoUser: DemoUserOption, church?: Church) => {
    const savedChurchId = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_ACTIVE_CHURCH_KEY) : null;
    const storedList = getStoredChurches();
    const targetChurch = church || storedList.find((c) => c.id === savedChurchId) || storedList[0] || DEMO_CHURCH;

    setUser({ id: demoUser.id, email: demoUser.email });
    const userProfile: Profile = {
      id: demoUser.id,
      email: demoUser.email,
      first_name: demoUser.name.split(' ')[0] || '',
      last_name: demoUser.name.split(' ').slice(1).join(' ') || '',
      display_name: demoUser.name,
      phone: demoUser.phone,
      avatar_url: demoUser.avatar,
      is_super_admin: demoUser.role === 'super_admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setProfile(userProfile);
    setCurrentRole(demoUser.role);
    setActiveChurch(targetChurch);
    setChurchMember({
      id: `cm-${demoUser.id}`,
      church_id: targetChurch.id,
      user_id: demoUser.id,
      role: demoUser.role,
      status: 'active',
      membership_number: `GV-${demoUser.id.slice(-4)}`,
      membership_date: '2023-01-01',
      title: demoUser.title,
      notes: null,
      custom_fields: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setIsDemoMode(true);
    localStorage.setItem(LOCAL_STORAGE_DEMO_KEY, demoUser.email);
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_CHURCH_KEY, targetChurch.id);
  }, []);

  // Fetch real data from Supabase
  const loadSupabaseUserData = useCallback(async (userId: string, email: string) => {
    try {
      // 1. Fetch profile
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileErr && profileErr.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileErr);
      }

      const activeProfile: Profile = profileData || {
        id: userId,
        email: email,
        first_name: email.split('@')[0],
        last_name: '',
        display_name: email.split('@')[0],
        phone: null,
        avatar_url: null,
        is_super_admin: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfile(activeProfile);

      // 2. Fetch Church Memberships
      const { data: memberData, error: memberErr } = await supabase
        .from('church_members')
        .select('*, church:churches(*)')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (!memberErr && memberData && memberData.length > 0) {
        const dbChurches = memberData.map((m: any) => m.church).filter(Boolean);
        const localStored = getStoredChurches();
        const merged = [...dbChurches];
        localStored.forEach((lc) => {
          if (!merged.some((c) => c.id === lc.id)) merged.push(lc);
        });
        saveStoredChurches(merged);
        setAvailableChurches(merged.length ? merged : [DEMO_CHURCH]);
        
        const savedChurchId = localStorage.getItem(LOCAL_STORAGE_ACTIVE_CHURCH_KEY);
        const selectedChurch = merged.find((c) => c.id === savedChurchId) || memberData[0]?.church || merged[0] || DEMO_CHURCH;
        
        setActiveChurch(selectedChurch);
        const selectedMembership = memberData.find((m: any) => m.church_id === selectedChurch.id) || memberData[0];
        setCurrentRole(selectedMembership?.role || (activeProfile.is_super_admin ? 'super_admin' : 'church_admin'));
        setChurchMember(selectedMembership || null);
      } else {
        // Query if any church exists in Supabase
        const { data: dbChurches } = await supabase
          .from('churches')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(20);

        const localStored = getStoredChurches();
        const merged = dbChurches && dbChurches.length > 0 ? [...(dbChurches as Church[])] : [];
        localStored.forEach((lc) => {
          if (!merged.some((c) => c.id === lc.id)) merged.push(lc);
        });

        if (merged.length > 0) {
          saveStoredChurches(merged);
          setAvailableChurches(merged);
          const savedChurchId = localStorage.getItem(LOCAL_STORAGE_ACTIVE_CHURCH_KEY);
          const found = merged.find((c: any) => c.id === savedChurchId) || merged[0];
          setActiveChurch(found);
          setCurrentRole(activeProfile.is_super_admin ? 'super_admin' : 'church_admin');
        } else {
          setActiveChurch(DEMO_CHURCH);
          setCurrentRole(activeProfile.is_super_admin ? 'super_admin' : 'church_admin');
        }
      }
      setIsDemoMode(false);
    } catch (err) {
      console.error('Failed to load user data from Supabase:', err);
    }
  }, []);

  // Initialize Session
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      setIsLoading(true);
      try {
        if (isSupabaseConfigured()) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && mounted) {
            setUser({ id: session.user.id, email: session.user.email || '' });
            await loadSupabaseUserData(session.user.id, session.user.email || '');
            setIsLoading(false);
            return;
          }

          // If no active session, fetch live churches from Supabase
          const { data: dbChurches } = await supabase
            .from('churches')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(20);

          const localStored = getStoredChurches();
          const merged = dbChurches && dbChurches.length > 0 ? [...(dbChurches as Church[])] : [];
          localStored.forEach((lc) => {
            if (!merged.some((c) => c.id === lc.id)) merged.push(lc);
          });

          if (merged.length > 0 && mounted) {
            saveStoredChurches(merged);
            setAvailableChurches(merged);
            const savedChurchId = localStorage.getItem(LOCAL_STORAGE_ACTIVE_CHURCH_KEY);
            const foundChurch = merged.find((c: any) => c.id === savedChurchId) || merged[0];
            setActiveChurch(foundChurch);
            setCurrentRole('church_admin');
            setIsDemoMode(false);
            setIsLoading(false);
            return;
          }
        }

        // Check if demo user was active
        const savedDemoEmail = localStorage.getItem(LOCAL_STORAGE_DEMO_KEY);
        const demoUser = DEMO_USERS.find((u) => u.email === savedDemoEmail) || DEMO_USERS[0];
        
        const savedChurchId = localStorage.getItem(LOCAL_STORAGE_ACTIVE_CHURCH_KEY);
        const storedList = getStoredChurches();
        setAvailableChurches(storedList);
        const church = storedList.find((c) => c.id === savedChurchId) || storedList[0] || DEMO_CHURCH;
        
        if (mounted) {
          applyDemoUser(demoUser, church);
        }
      } catch (e) {
        console.error('Auth initialization error:', e);
        if (mounted) {
          applyDemoUser(DEMO_USERS[0]);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    // Listen to Supabase Auth changes if configured
    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser({ id: session.user.id, email: session.user.email || '' });
          await loadSupabaseUserData(session.user.id, session.user.email || '');
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setCurrentRole(null);
          setChurchMember(null);
          localStorage.removeItem(LOCAL_STORAGE_DEMO_KEY);
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, [applyDemoUser, loadSupabaseUserData]);

  // Login handler
  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      // 1. Check if it matches a demo account
      const matchedDemo = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (matchedDemo && (!password || password === 'password123' || !isSupabaseConfigured())) {
        applyDemoUser(matchedDemo);
        setIsLoading(false);
        toast.success(`Welcome back, ${matchedDemo.name}!`);
        return { success: true };
      }

      // 2. Otherwise authenticate via Supabase
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: password || 'password123',
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          setUser({ id: data.user.id, email: data.user.email || '' });
          await loadSupabaseUserData(data.user.id, data.user.email || '');
          setIsLoading(false);
          toast.success('Successfully logged in!');
          return { success: true };
        }
      }

      // Fallback demo match for testing
      const firstDemo = DEMO_USERS[0];
      applyDemoUser({ ...firstDemo, email });
      setIsLoading(false);
      toast.success(`Signed in as ${email}`);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Login failed. Please check credentials.' };
    }
  };

  // Logout handler
  const logout = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
      setUser(null);
      setProfile(null);
      setCurrentRole(null);
      setChurchMember(null);
      localStorage.removeItem(LOCAL_STORAGE_DEMO_KEY);
      toast.info('You have been signed out.');
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password handler
  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send recovery email.' };
    }
  };

  // Reset password handler
  const resetPassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update password.' };
    }
  };

  // Switch role directly (instant role switching for dev/demo testing)
  const switchRole = (newRole: UserRole) => {
    const matchedUser = DEMO_USERS.find((u) => u.role === newRole);
    if (matchedUser) {
      applyDemoUser(matchedUser, activeChurch || DEMO_CHURCH);
      toast.info(`Switched role to ${matchedUser.title} (${matchedUser.name})`);
    } else {
      setCurrentRole(newRole);
      toast.info(`Switched role to ${newRole}`);
    }
  };

  // Switch church tenant
  const switchChurch = (churchId: string) => {
    const found = availableChurches.find((c) => c.id === churchId) || DEMO_CHURCH;
    setActiveChurch(found);
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_CHURCH_KEY, found.id);
    toast.success(`Switched active church to ${found.name}`);
  };

  // Create a new church tenant
  const createChurch = async (payload: CreateChurchPayload): Promise<Church> => {
    setIsLoading(true);
    try {
      const newChurch = await churchService.createChurch(payload, user?.id);
      setAvailableChurches((prev) => {
        const filtered = prev.filter((c) => c.id !== newChurch.id);
        const updated = [newChurch, ...filtered];
        saveStoredChurches(updated);
        return updated;
      });
      setActiveChurch(newChurch);
      setCurrentRole('church_admin');
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_CHURCH_KEY, newChurch.id);
      return newChurch;
    } finally {
      setIsLoading(false);
    }
  };

  // Update existing church
  const updateChurch = async (id: string, payload: Partial<Church>): Promise<Church> => {
    setIsLoading(true);
    try {
      const updated = await churchService.updateChurch(id, payload);
      setAvailableChurches((prev) => {
        const updatedList = prev.map((c) => (c.id === id ? updated : c));
        saveStoredChurches(updatedList);
        return updatedList;
      });
      if (activeChurch?.id === id) {
        setActiveChurch(updated);
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_CHURCH_KEY, updated.id);
      }
      return updated;
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoUser = (userOption: DemoUserOption) => {
    applyDemoUser(userOption, activeChurch || DEMO_CHURCH);
    toast.success(`Switched to demo user: ${userOption.name} (${userOption.title})`);
  };

  const refreshUserData = async () => {
    if (user && isSupabaseConfigured()) {
      await loadSupabaseUserData(user.id, user.email);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        activeChurch,
        currentRole,
        churchMember,
        availableChurches,
        isLoading,
        isAuthenticated: !!user,
        isDemoMode,
        login,
        logout,
        forgotPassword,
        resetPassword,
        switchRole,
        switchChurch,
        createChurch,
        updateChurch,
        setDemoUser,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

const DEFAULT_AUTH_CONTEXT: AuthContextType = {
  user: null,
  profile: null,
  activeChurch: null,
  currentRole: null,
  churchMember: null,
  availableChurches: [],
  isLoading: false,
  isAuthenticated: false,
  isDemoMode: false,
  login: async () => ({ success: false }),
  logout: async () => {},
  forgotPassword: async () => ({ success: false }),
  resetPassword: async () => ({ success: false }),
  switchRole: () => {},
  switchChurch: () => {},
  createChurch: async () => ({} as any),
  updateChurch: async () => ({} as any),
  setDemoUser: () => {},
  refreshUserData: async () => {},
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  return context || DEFAULT_AUTH_CONTEXT;
}
