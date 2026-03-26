import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register Notification Categories for Interactive Actions
const registerCategories = async () => {
  await Notifications.setNotificationCategoryAsync('SIMULATION_APPROVAL', [
    {
      identifier: 'APPROVE_REBALANCE',
      buttonTitle: 'Approve Rebalance',
      options: { opensAppToForeground: false },
    },
    {
      identifier: 'REJECT_REBALANCE',
      buttonTitle: 'Reject',
      options: { opensAppToForeground: false, isDestructive: true },
    },
  ]);

  await Notifications.setNotificationCategoryAsync('RISK_ALERT', [
    {
      identifier: 'EXECUTE_HEDGE',
      buttonTitle: 'Execute Hedge',
      options: { opensAppToForeground: true },
    },
    {
      identifier: 'IGNORE_ALERT',
      buttonTitle: 'Acknowledge',
      options: { opensAppToForeground: false },
    },
  ]);
};

registerCategories();

export const notificationService = {
  /**
   * Registers the device for push notifications and stores the token in Supabase
   */
  async registerForPushNotifications(userId: string) {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('PUSH_NOTIFICATIONS_PERMISSION_DENIED');
      return null;
    }

    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      
      // Update Supabase user profile with the token
      const { error } = await supabase
        .from('user_profiles')
        .update({ push_token: token })
        .eq('id', userId);

      if (error) console.error('PUSH_TOKEN_SYNC_ERROR:', error);
      
      return token;
    } catch (e) {
      console.error('PUSH_TOKEN_GENERATION_ERROR:', e);
      return null;
    }
  },

  /**
   * Listens for incoming notifications
   */
  addNotificationListeners(onNotificationReceived: (notification: Notifications.Notification) => void, onNotificationResponse: (response: Notifications.NotificationResponse) => void) {
    const notificationListener = Notifications.addNotificationReceivedListener(onNotificationReceived);
    const responseListener = Notifications.addNotificationResponseReceivedListener(onNotificationResponse);

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }
};
