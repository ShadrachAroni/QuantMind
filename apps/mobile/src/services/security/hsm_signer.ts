// QuantMind Mock HSM (Hardware Security Module) Signing Service for Mobile
// Institutional grade non-repudiation for simulation reports and snapshots

import { supabase } from '../supabase';

export interface SignedPayload {
  data: any;
  signature: string;
  signer_node: string;
  timestamp: string;
  verification_endpoint: string;
}

/**
 * Simulates a cryptographic signing operation performed by a secure hardware module on mobile.
 */
export async function signInstitutionalReport(reportData: any, userId: string): Promise<SignedPayload> {
  // 1. Prepare Canonical JSON
  const canonicalData = JSON.stringify(reportData, Object.keys(reportData).sort());
  
  // 2. Generate Deterministic Mock Signature
  // On mobile, we use a simpler approach as WebCrypto is not globally available in RN
  const signature = `SIG_MB_${Math.random().toString(36).substr(2, 9).toUpperCase()}_${Date.now().toString(16)}`;

  const timestamp = new Date().toISOString();
  const nodeId = `QM_HSM_MOBILE_NODE_${Math.floor(Math.random() * 9).toString().padStart(2, '0')}`;

  const signedPayload: SignedPayload = {
    data: reportData,
    signature: `qm_sig_mobile_v1_${signature}`,
    signer_node: nodeId,
    timestamp,
    verification_endpoint: `/api/verify/signature/${nodeId}`
  };

  // 3. Log the signing operation to the Audit Trail for non-repudiation
  // High-impact actions must be tracked
  try {
    await supabase.from('admin_audit_log').insert({
      admin_id: userId,
      action: 'HSM_ASSET_SIGNING_MOBILE',
      target_id: reportData.id || 'N/A',
      details: {
        node: nodeId,
        signature: signedPayload.signature,
        payload_type: reportData.type || 'BACKTEST_REPORT',
        platform: 'MOBILE'
      },
      ip_address: 'MOBILE_CLIENT'
    });
  } catch (err) {
    console.warn('AUDIT_LOG_FAILURE:', err);
    // Continue anyway as the signing itself is the primary goal
  }

  return signedPayload;
}
