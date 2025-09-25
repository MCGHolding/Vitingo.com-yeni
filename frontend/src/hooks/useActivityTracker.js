import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useActivityTracker = () => {
  const { user, updateLastActivity } = useAuth();

  useEffect(() => {
    if (!user) return;

    const updateActivity = () => {
      updateLastActivity();
    };

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Update activity every 5 minutes
    const interval = setInterval(updateActivity, 5 * 60 * 1000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      clearInterval(interval);
    };
  }, [user, updateLastActivity]);
};