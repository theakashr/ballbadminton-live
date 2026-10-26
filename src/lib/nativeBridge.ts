import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';

/**
 * Checks whether the application is running inside a native Capacitor shell (Android / iOS)
 */
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const getPlatform = (): string => {
  return Capacitor.getPlatform();
};

/**
 * Tactile Haptic Feedback (with graceful web vibration fallback)
 */
export const nativeHaptics = {
  impact: async (style: 'light' | 'medium' | 'heavy' = 'light') => {
    try {
      if (isNativePlatform()) {
        const impactMap = {
          light: ImpactStyle.Light,
          medium: ImpactStyle.Medium,
          heavy: ImpactStyle.Heavy,
        };
        await Haptics.impact({ style: impactMap[style] });
      } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        // Fallback for modern mobile browsers
        const durationMap = { light: 10, medium: 25, heavy: 45 };
        navigator.vibrate(durationMap[style]);
      }
    } catch {
      // Ignore vibration errors when blocked by browser policy
    }
  },

  selection: async () => {
    try {
      if (isNativePlatform()) {
        await Haptics.selectionChanged();
      } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(8);
      }
    } catch {
      // Ignore
    }
  },

  notification: async (type: 'success' | 'warning' | 'error') => {
    try {
      if (isNativePlatform()) {
        const typeMap = {
          success: NotificationType.Success,
          warning: NotificationType.Warning,
          error: NotificationType.Error,
        };
        await Haptics.notification({ type: typeMap[type] });
      } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        if (type === 'success') navigator.vibrate([20, 50, 20]);
        else if (type === 'error') navigator.vibrate([40, 60, 40, 60, 40]);
        else navigator.vibrate([25, 40, 25]);
      }
    } catch {
      // Ignore
    }
  },
};

/**
 * Android Status Bar Styling based on current Theme
 */
export const updateNativeStatusBar = async (isDark: boolean) => {
  if (!isNativePlatform()) return;
  try {
    await StatusBar.setStyle({
      style: isDark ? Style.Dark : Style.Light,
    });
    await StatusBar.setBackgroundColor({
      color: isDark ? '#15131B' : '#F5F7FB',
    });
  } catch (err) {
    console.debug('StatusBar styling not supported or failed:', err);
  }
};

/**
 * Hides the Android Launch Splash Screen once the React tree has mounted
 */
export const hideSplashScreen = async () => {
  if (!isNativePlatform()) return;
  try {
    await SplashScreen.hide({
      fadeOutDuration: 300,
    });
  } catch {
    // Ignore
  }
};

/**
 * Manages the Android hardware back button
 * Returns an unregister cleanup function
 */
export const registerBackButtonListener = (onBack: () => boolean) => {
  if (!isNativePlatform()) return () => {};

  const listenerPromise = App.addListener('backButton', ({ canGoBack }) => {
    // onBack returns true if the back action was consumed (e.g. closed a modal)
    const handled = onBack();
    if (!handled && !canGoBack) {
      App.exitApp();
    }
  });

  return () => {
    listenerPromise.then(l => l.remove()).catch(() => {});
  };
};
