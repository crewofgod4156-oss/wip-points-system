import { createContext, useContext, useEffect, useState } from 'react';
import liff from '@line/liff';

const LiffContext = createContext();

export const useLiff = () => {
  const context = useContext(LiffContext);
  if (!context) {
    throw new Error('useLiff must be used within LiffProvider');
  }
  return context;
};

export const LiffProvider = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [profile, setProfile] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({ liffId: import.meta.env.VITE_LIFF_ID });
        
        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const token = liff.getAccessToken();
        setAccessToken(token);

        const userProfile = await liff.getProfile();
        setProfile(userProfile);

        setIsReady(true);
      } catch (err) {
        console.error('LIFF initialization failed', err);
        setError(err.message);
      }
    };

    initLiff();
  }, []);

  const value = {
    liff,
    isReady,
    profile,
    accessToken,
    error
  };

  return <LiffContext.Provider value={value}>{children}</LiffContext.Provider>;
};
