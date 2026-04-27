const fs = require('fs');
const path = require('path');

const simplifyMap = [
  // Authentication & Security
  { from: /\bAccess Cipher\b/gi, to: 'Password' },
  { from: /\bAuthorization cipher\b/gi, to: 'Password' },
  { from: /\bDefine New Cipher\b/gi, to: 'Set New Password' },
  { from: /\bUpdate Access Cipher\b/gi, to: 'Update Password' },
  { from: /\bVerify Cipher\b/gi, to: 'Confirm Password' },
  { from: /\bNew Access Cipher\b/gi, to: 'New Password' },
  { from: /\bVerify New Cipher\b/gi, to: 'Confirm New Password' },
  { from: /\bReset Cipher\b/gi, to: 'Reset Password' },
  { from: /\bCipher Reset\b/gi, to: 'Password Reset' },
  { from: /\bCipher mismatch\b/gi, to: 'Passwords do not match' },
  { from: /\bCipher Expired\b/gi, to: 'Password Expired' },
  { from: /\bIdentity Credentials\b/gi, to: 'Account Details' },
  { from: /\bInstitutional credentials\b/gi, to: 'Account details' },
  { from: /\bMFA_SECURITY_NODE\b/g, to: 'MFA_SECURITY_SETTINGS' },
  { from: /\bPASSWORD_NODE\b/g, to: 'PASSWORD_SETTINGS' },
  { from: /\bVerification factor\b/gi, to: 'Verification method' },
  { from: /\bAccess recovery\b/gi, to: 'Account recovery' },
  { from: /\bSecure recovery key\b/gi, to: 'Secure recovery code' },

  // System & Interface
  { from: /\bInstitutional Node\b/gi, to: 'Secure Account' },
  { from: /\bInstitutional Terminal\b/gi, to: 'Dashboard' },
  { from: /\bHome Terminal\b/gi, to: 'Home' },
  { from: /\bAccess Terminal\b/gi, to: 'Login' },
  { from: /\bEnter Terminal\b/gi, to: 'Enter App' },
  { from: /\bReturn to Terminal\b/gi, to: 'Back to Dashboard' },
  { from: /\bTerminal_Notifications\b/g, to: 'App_Notifications' },
  { from: /\bTERMINAL_INTERFACE\b/g, to: 'APP_INTERFACE' },
  { from: /\bTERMINAL_LOCALIZATION\b/g, to: 'APP_LANGUAGE' },
  { from: /\bInitializing_Portal\b/g, to: 'Loading_Dashboard' },
  { from: /\bInitialize Session\b/gi, to: 'Log In' },
  { from: /\bTerminate_Session\b/gi, to: 'Sign Out' },
  { from: /\bTERMINATE_SESSION\b/g, to: 'SIGN OUT' },
  { from: /\bIrreversible account termination\b/gi, to: 'Deleting your account' },
  { from: /\bInitialize irreversible account termination\b/gi, to: 'Start account deletion' },
  { from: /\bAccount termination\b/gi, to: 'Account deletion' },
  { from: /\bInstitutional Profile\b/gi, to: 'Your Profile' },
  { from: /\bIdentity Profile\b/gi, to: 'Profile' },
  { from: /\bInstitutional identity\b/gi, to: 'Profile' },
  { from: /\bOperational Manual\b/gi, to: 'User Guide' },
  { from: /\bOperational_Manual\b/g, to: 'User_Guide' },
  { from: /\bInstitutional Care\b/gi, to: 'Support' },
  { from: /\bInstitutional_Care\b/g, to: 'Support' },
  { from: /\bInstitutional Support\b/gi, to: 'Support' },

  // AI & Analytics
  { from: /\bCognitive_Persona\b/g, to: 'AI_Assistant_Personality' },
  { from: /\bCognitive Matrix\b/gi, to: 'AI Settings' },
  { from: /\bCognitive_Matrix\b/g, to: 'AI_Settings' },
  { from: /\bCognitive_Bandwidth\b/g, to: 'AI_Message_Limit' },
  { from: /\bCognitive Relay\b/gi, to: 'AI Connection' },
  { from: /\bCognitive_Relay\b/g, to: 'AI_Connection' },
  { from: /\bSynchronizing cognitive buffers\b/gi, to: 'Preparing AI response' },
  { from: /\bAI Oracle\b/gi, to: 'AI Assistant' },
  { from: /\bAI_Oracle\b/g, to: 'AI_Assistant' },
  { from: /\bOracle_Personality\b/gi, to: 'Assistant_Personality' },
  { from: /\bOracle\b/gi, to: 'Assistant' },
  { from: /\bORACLE\b/g, to: 'ASSISTANT' },
  { from: /\bNeural Calibration\b/gi, to: 'Personalization' },
  { from: /\bNeural Adaptation\b/gi, to: 'Learning Style' },
  { from: /\bNeural_Adaptation\b/g, to: 'Learning_Style' },
  { from: /\bStochastic\b/gi, to: 'Statistical' },
  { from: /\bSTOCHASTIC\b/g, to: 'STATISTICAL' },
  { from: /\bFat-Tail\b/gi, to: 'Risk-Heavy' },
  { from: /\bHigh-fidelity\b/gi, to: 'Advanced' },

  // Billing & Subscriptions
  { from: /\bSubscription Ledger\b/gi, to: 'Billing & Plans' },
  { from: /\bSubscription_Ledger\b/g, to: 'Billing_&_Plans' },
  { from: /\bLedger_Subscription\b/g, to: 'Billing_Subscription' },
  { from: /\bDecommission\b/gi, to: 'Cancel' },
  { from: /\bDECOMMISSION\b/g, to: 'CANCEL' },
  { from: /\bDe-provisioning\b/gi, to: 'Closing' },
  { from: /\bBilling clearance\b/gi, to: 'Billing status' },
  { from: /\bBILLING_CLEARANCE\b/g, to: 'BILLING_STATUS' },
  { from: /\bInstitutional Pro\b/gi, to: 'Professional' },
  { from: /\bInstitutional_Pro\b/g, to: 'Professional' },
  { from: /\bInstitutional tier\b/gi, to: 'Plan level' },

  // General Jargon
  { from: /\bVault_Portfolios\b/g, to: 'Portfolios' },
  { from: /\bCompute_Simulate\b/g, to: 'Simulate' },
  { from: /\bVault\b/gi, to: 'Portfolio' },
  { from: /\bVAULT\b/g, to: 'PORTFOLIO' },
  { from: /\bMarket_Station\b/g, to: 'Markets' },
  { from: /\bMarket Station\b/gi, to: 'Market Overview' },
  { from: /\bSynchronizing\b/gi, to: 'Syncing' },
  { from: /\bSYNCHRONIZING\b/g, to: 'SYNCING' },
  { from: /\bSynchronize\b/gi, to: 'Sync' },
  { from: /\bSYNCHRONIZE\b/g, to: 'SYNC' },
  { from: /\bCommit\b/gi, to: 'Save' },
  { from: /\bCOMMIT\b/g, to: 'SAVE' },
  { from: /\bHandshake\b/gi, to: 'Connection' },
  { from: /\bEstablish Connectivity\b/gi, to: 'Contact Us' },
  { from: /\bDispatched\b/gi, to: 'Sent' },
  { from: /\bDISPATCHED\b/g, to: 'SENT' },
  { from: /\bDispatch\b/gi, to: 'Send' },
  { from: /\bDISPATCH\b/g, to: 'SEND' },
  { from: /\bCalibration\b/gi, to: 'Settings' },
  { from: /\bCALIBRATION\b/g, to: 'SETTINGS' },
  { from: /\bVitals\b/gi, to: 'Metrics' },
  { from: /\bVITALS\b/g, to: 'METRICS' },
  { from: /\bInstitutional\b/gi, to: 'Secure' },
  { from: /\bINSTITUTIONAL\b/g, to: 'SECURE' },
  { from: /\bRegional Latency\b/gi, to: 'Server Location' },
  { from: /\bLow Latency\b/gi, to: 'High Speed' },
  { from: /\bLOW_LATENCY\b/g, to: 'HIGH_SPEED' },
];

function simplifyFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  console.log(`Simplifying: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  if (filePath.endsWith('i18n.ts')) {
    content = content.replace(/'([^']+)':\s*'([^']*)'/g, (match, key, value) => {
      let newValue = value;
      for (const mapping of simplifyMap) {
        newValue = newValue.replace(mapping.from, mapping.to);
      }
      return `'${key}': '${newValue}'`;
    });
  } else {
    for (const mapping of simplifyMap) {
      content = content.replace(mapping.from, mapping.to);
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

const filesToSimplify = [
  'apps/web/src/lib/i18n.ts',
  'apps/mobile/src/lib/i18n.ts',
  'supabase/functions/_shared/email.ts',
  'supabase/functions/auth-hook-email/index.ts',
  'supabase/functions/ai-chat/index.ts',
  'apps/web/src/app/api/ai/chat/route.ts',
  'apps/mobile/src/screens/main/HomeScreen.tsx',
  'apps/mobile/src/screens/main/PortfolioDoctorScreen.tsx',
];

filesToSimplify.forEach(file => {
  simplifyFile(path.resolve('c:/Projects/Quantmind Application/QuantMind', file));
});
