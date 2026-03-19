// usePesapal.js — React Native Pesapal Payment Hook
// Usage: const { initiatePayment, verifyPayment } = usePesapal();

import { useState, useCallback } from 'react';
import { Linking } from 'react-native';

const PESAPAL_API_URL = 'https://pay.pesapal.com/v3';
const BACKEND_URL = 'https://your-backend.com'; // ← replace with your backend URL

// ─── Helper: Get Pesapal OAuth Token (via your backend) ───
// NOTE: Never call Pesapal directly from the client with your consumer key/secret.
// Route token requests through your backend to keep credentials safe.
const getPesapalToken = async () => {
  const response = await fetch(`${BACKEND_URL}/api/pesapal/token`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json();
  if (!data.token) throw new Error('Failed to obtain Pesapal token');
  return data.token;
};

// ─── Helper: Query Transaction Status ───
const queryTransactionStatus = async (orderTrackingId) => {
  const token = await getPesapalToken();

  const response = await fetch(
    `${PESAPAL_API_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) throw new Error('Failed to query transaction status');
  return response.json();
};

// ─── Helper: Register IPN ───
const registerIPN = async (token, ipnCallbackUrl) => {
  const response = await fetch(`${PESAPAL_API_URL}/api/URLSetup/RegisterIPN`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: ipnCallbackUrl,
      ipn_notification_type: 'GET',
    }),
  });

  const data = await response.json();
  if (!data.ipn_id) throw new Error('IPN ID not received');
  return data.ipn_id;
};

// ─── Helper: Submit Order to Pesapal ───
const submitOrderRequest = async (token, paymentDetails) => {
  const response = await fetch(
    `${PESAPAL_API_URL}/api/Transactions/SubmitOrderRequest`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentDetails),
    }
  );

  const data = await response.json();
  if (data.status !== '200' || !data.redirect_url) {
    throw new Error(data.message || 'Failed to submit order to Pesapal');
  }
  return data.redirect_url;
};

// ─── Main Hook ───
export const usePesapal = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Initiate a Pesapal payment.
   *
   * @param {Object} params
   * @param {string} params.orderId        - Your internal order ID
   * @param {number} params.amount         - Amount in KES (integer)
   * @param {string} params.ipnCallbackUrl - Your backend IPN endpoint
   * @param {string} params.callbackUrl    - Deep link / universal link after payment
   * @param {string} params.cancelUrl      - Deep link / universal link on cancel
   * @param {Object} params.billingAddress - { email, phone, firstName, lastName, district, street, city }
   * @param {string} [params.description]  - Order description (optional)
   *
   * @returns {{ redirectUrl: string } | null}
   */
  const initiatePayment = useCallback(async ({
    orderId,
    amount,
    ipnCallbackUrl,
    callbackUrl,
    cancelUrl,
    billingAddress,
    description = 'Order Payment',
  }) => {
    setLoading(true);
    setError(null);

    try {
      const token = await getPesapalToken();

      // Register IPN with retry logic
      let ipnId = null;
      let retries = 3;

      while (retries > 0 && !ipnId) {
        try {
          ipnId = await registerIPN(token, ipnCallbackUrl);
        } catch (err) {
          retries--;
          if (retries === 0) throw new Error('Payment service unavailable. Please try again.');
          await new Promise((res) => setTimeout(res, 2000));
        }
      }

      const paymentDetails = {
        id: orderId,
        currency: 'KES',
        amount: Number(amount).toFixed(2),
        description,
        callback_url: callbackUrl,
        cancel_url: cancelUrl,
        notification_id: ipnId,
        billing_address: {
          email_address: billingAddress.email,
          phone_number: billingAddress.phone,
          first_name: billingAddress.firstName,
          last_name: billingAddress.lastName,
          line_1: billingAddress.district,
          line_2: billingAddress.street,
          city: billingAddress.city,
          country_code: 'KE',
        },
      };

      const redirectUrl = await submitOrderRequest(token, paymentDetails);

      // Open Pesapal payment page in device browser
      const canOpen = await Linking.canOpenURL(redirectUrl);
      if (canOpen) {
        await Linking.openURL(redirectUrl);
      }

      return { redirectUrl };
    } catch (err) {
      setError(err.message || 'Payment initiation failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Verify a Pesapal payment by querying the transaction status.
   *
   * @param {string} orderTrackingId - The Pesapal OrderTrackingId
   * @returns {{ status: 'Completed'|'Failed'|'Invalid'|'Pending', raw: Object }}
   */
  const verifyPayment = useCallback(async (orderTrackingId) => {
    setLoading(true);
    setError(null);

    try {
      const statusData = await queryTransactionStatus(orderTrackingId);
      const status = statusData?.payment_status_description;

      return { status, raw: statusData };
    } catch (err) {
      setError(err.message || 'Payment verification failed');
      return { status: 'Pending', raw: null }; // Treat unreachable API as still pending
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    initiatePayment,
    verifyPayment,
    loading,
    error,
  };
};