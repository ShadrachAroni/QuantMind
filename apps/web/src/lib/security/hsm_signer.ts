// QuantMind Mock HSM (Hardware Security Module) Signing Service
// Institutional grade non-repudiation for simulation reports and snapshots

import { createClient } from '@/lib/supabase';

export interface SignedPayload {
  data: any;
  signature: string;
  signer_node: string;
  timestamp: string;
  verification_endpoint: string;
}

/**
 * Simulates a cryptographic signing operation performed by a secure hardware module.
 * In a real institutional deployment, this would communicate with an AWS HSM or Azure Key Vault Managed HSM via a secure network enclave.
 */
export async function signInstitutionalReport(reportData: any, userId: string): Promise<SignedPayload> {
  // 1. Prepare Canonical JSON
  const canonicalData = JSON.stringify(reportData, Object.keys(reportData).sort());
  
  // 2. Generate Deterministic Mock Signature (HMAC-like for simulation)
  // In production, this would use RS256 or Ed25519 with a key residing ONLY inside the HSM
  const encoder = new TextEncoder();
  const dataUint8 = encoder.encode(canonicalData + userId + Date.now());
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const timestamp = new Date().toISOString();
  const nodeId = `QM_HSM_NODE_${Math.floor(Math.random() * 99).toString().padStart(2, '0')}`;

  const signedPayload: SignedPayload = {
    data: reportData,
    signature: `qm_sig_v1_${signature}`,
    signer_node: nodeId,
    timestamp,
    verification_endpoint: `/api/verify/signature/${nodeId}`
  };

  // 3. Log the signing operation to the Audit Trail for non-repudiation
  const supabase = createClient();
  await supabase.from('admin_audit_log').insert({
    admin_id: userId, // Assuming user also has admin role for high-impact actions in this context
    action: 'HSM_ASSET_SIGNING',
    target_id: reportData.id || 'N/A',
    details: {
      node: nodeId,
      signature: signedPayload.signature,
      payload_type: reportData.type || 'REPORT'
    },
    ip_address: 'INTERNAL_PROXY'
  });

  return signedPayload;
}
