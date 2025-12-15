import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';

/**
 * Custom hook to handle Android hardware back button
 * Prevents app from exiting and provides proper navigation
 */
export const useBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let listenerHandle: any = null;

    // Register hardware back button listener
    const setupListener = async () => {
      listenerHandle = await CapacitorApp.addListener('backButton', (data: { canGoBack: boolean }) => {
        const { canGoBack } = data;
        console.log('🔙 Hardware back button pressed', { 
          currentPath: location.pathname,
          canGoBack 
        });

        // Define routes that should go to home instead of exiting
        const nonHomeRoutes = ['/profile', '/upload', '/results', '/multi-results', '/processing', '/multi-processing'];
        
        if (nonHomeRoutes.some(route => location.pathname.startsWith(route))) {
          // Navigate to home page
          console.log('🏠 Navigating to home page');
          navigate('/', { replace: true });
        } else if (location.pathname === '/') {
          // On home page, show exit confirmation or exit
          console.log('🚪 Exiting app from home page');
          CapacitorApp.exitApp();
        } else if (canGoBack) {
          // Default behavior: go back
          console.log('⬅️ Going back in history');
          navigate(-1);
        } else {
          // No history, go to home
          console.log('🏠 No history, navigating to home');
          navigate('/', { replace: true });
        }
      });
    };

    setupListener();

    // Cleanup listener on unmount
    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [navigate, location.pathname]);
};
