import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';

interface NativeAppHandlerProps {
  onCloseMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export function NativeAppHandler({ onCloseMobileMenu, isMobileMenuOpen }: NativeAppHandlerProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Status bar & Keyboard initialization
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Configure Status Bar
    const setupStatusBar = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Light });
        if (Capacitor.getPlatform() === 'android') {
          await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
        }
      } catch (err) {
        console.warn('StatusBar not available', err);
      }
    };

    // Configure Keyboard
    const setupKeyboard = async () => {
      try {
        await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
      } catch (err) {
        console.warn('Keyboard setup not available', err);
      }
    };

    setupStatusBar();
    setupKeyboard();
  }, []);

  // Hardware Back Button listener
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backButtonListener = CapApp.addListener('backButton', ({ canGoBack }) => {
      // 1. If mobile navigation drawer is open, close it first
      if (isMobileMenuOpen && onCloseMobileMenu) {
        onCloseMobileMenu();
        return;
      }

      // 2. Check if a Radix modal/dialog is currently visible
      const openDialog = document.querySelector('[role="dialog"][data-state="open"]');
      if (openDialog) {
        const closeBtn = openDialog.querySelector('button[aria-label="Close"], button:has(.lucide-x)') as HTMLButtonElement;
        if (closeBtn) {
          closeBtn.click();
          return;
        }
      }

      // 3. If on root screens, minimize/exit app
      const rootPaths = ['/dashboard', '/login', '/'];
      if (rootPaths.includes(location.pathname) || !canGoBack) {
        CapApp.exitApp();
      } else {
        navigate(-1);
      }
    });

    return () => {
      backButtonListener.then((handler) => handler.remove());
    };
  }, [location.pathname, isMobileMenuOpen, onCloseMobileMenu, navigate]);

  return null;
}
