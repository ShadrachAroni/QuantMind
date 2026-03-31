import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications() {
  const { user } = useAuthStore();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (!user) return;

    registerForPushNotificationsAsync().then(token => {
      if (token && user.id) {
        saveTokenToDatabase(user.id, token);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener((notification: Notifications.Notification) => {
      console.log('INSTITUTIONAL_NOTIF_RECEIVED:', notification.request.content.title);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
      const { data } = response.notification.request.content;
      const actionIdentifier = response.actionIdentifier;
      
      console.log('INSTITUTIONAL_NOTIF_ACTION:', { actionIdentifier, data });

      // Handle Interactive Actions
      if (actionIdentifier === 'APPROVE_REBALANCE' && data?.simulationId) {
        supabase.from('simulations')
          .update({ is_approved: true, approved_at: new Date().toISOString() })
          .eq('id', data.simulationId)
          .then(({ error }) => {
            if (error) console.error('REMOTE_APPROVAL_ERROR:', error);
          });
      }

      if (actionIdentifier === 'EXECUTE_HEDGE' && data?.portfolioId) {
        // Navigate directly to hedging terminal or execute auto-hedge
      }

      if (data?.type === 'SIMULATION_COMPLETE' && data?.portfolioId) {
        // Deep link handling (existing logic)
      }
    });

    return () => {
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, [user]);

  return {
    notificationsEnabled: Device.isDevice,
    isExpoGo: Constants.appConfig?.extra?.expoGo ?? false,
  };
}

async function saveTokenToDatabase(userId: string, token: string) {
  try {
    const { error } = await supabase
      .from('device_tokens')
      .upsert({
        user_id: userId,
        token: token,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'token' });
    
    if (error) throw error;
  } catch (err) {
    console.error('Failed to save push token:', err);
  }
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return;
    }
    
    // Replace with your project ID from app.json
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'quantmind-app', // Matches app.json EAS project ID
    })).data;
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
