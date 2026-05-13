import { useState, useEffect } from 'react';

interface AuthState {
  url: string;
  username?: string;
  password?: string;
  rememberMe: boolean;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [auth, setAuth] = useState<AuthState>({
    url: '',
    rememberMe: false,
    isConnected: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const checkSaved = async () => {
      try {
        const saved = await window.api.lte.getSavedAuth();
        if (saved && saved.rememberMe && saved.routerUrl) {
          const success = await window.api.lte.connect(
            saved.routerUrl, 
            saved.username, 
            saved.password, 
            true
          );
          setAuth(prev => ({
            ...prev,
            url: saved.routerUrl || '',
            username: saved.username,
            password: saved.password,
            rememberMe: true,
            isConnected: success,
            isLoading: false
          }));
        } else {
          setAuth(prev => ({ ...prev, isLoading: false }));
        }
      } catch (e) {
        setAuth(prev => ({ ...prev, isLoading: false }));
      }
    };
    checkSaved();
  }, []);

  const login = async (url: string, user: string, pass: string, remember: boolean) => {
    setAuth(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const success = await window.api.lte.connect(url, user, pass, remember);
      if (success) {
        setAuth({
          url,
          username: user,
          password: pass,
          rememberMe: remember,
          isConnected: true,
          isLoading: false,
          error: null
        });
        return true;
      }
      setAuth(prev => ({ ...prev, isLoading: false, error: 'Login failed' }));
      return false;
    } catch (e: any) {
      setAuth(prev => ({ ...prev, isLoading: false, error: e.message || 'Connection error' }));
      return false;
    }
  };

  return { auth, login };
};
