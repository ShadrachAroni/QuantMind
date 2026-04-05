import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const APP_STORE_URL = 'https://apps.apple.com/app/quantmind/id123456789';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.quantmind.app';
const BUNDLE_ID = 'com.quantmind.app';
const TEAM_ID = 'QUANTMIND_TEAM_ID'; // Placeholder

function getLandingPage(path: string) {
  const accent = "#00f5ff";
  const bg = "#020617";
  const card = "#0f172a";
  const slate100 = "#f1f5f9";
  
  // Clean path for deep linking
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const appLink = `quantmind://${cleanPath}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QuantMind Terminal | Institutional Deep Link</title>
  <style>
    body { margin:0; padding:0; background: ${bg}; font-family: -apple-system, sans-serif; color: ${slate100}; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center; overflow: hidden; }
    .container { max-width: 440px; width: 90%; padding: 48px 40px; background: ${card}; border: 1px solid rgba(0,245,255,0.3); border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,1); }
    .logo { font-size: 28px; font-weight: 900; color: ${accent}; letter-spacing: 4px; margin-bottom: 32px; text-transform: uppercase; }
    .status-bar { font-size: 11px; color: #94a3b8; font-family: ui-monospace, monospace; letter-spacing: 2px; margin-bottom: 24px; padding: 12px; background: rgba(0,0,0,0.4); border-radius: 12px; display: inline-block; width: 100%; box-sizing: border-box; }
    .btn { display: block; background: ${accent}; color: ${bg}; text-decoration: none; padding: 20px; border-radius: 14px; font-weight: 900; margin-top: 16px; font-size: 15px; letter-spacing: 1px; transition: all 0.3s; box-shadow: 0 0 20px rgba(0,245,255,0.2); }
    .btn:active { transform: scale(0.96); }
    .btn-secondary { background: transparent; border: 1px solid rgba(0,245,255,0.4); color: ${accent}; box-shadow: none; margin-top: 24px; }
    .footer { margin-top: 48px; font-size: 10px; color: #475569; text-transform: uppercase; letter-spacing: 3px; font-weight: 900; }
  </style>
  <script>
    window.onload = function() {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        // Attempt to open the app via custom scheme
        setTimeout(function() {
          window.location.href = "${appLink}";
        }, 500);
        
        // Smart fallback to store
        setTimeout(function() {
          const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
          const isAndroid = /Android/i.test(navigator.userAgent);
          
          if (document.hasFocus()) {
            if (confirm("Redirecting to App Store for secure terminal access?")) {
              if (isIOS) window.location.href = "${APP_STORE_URL}";
              else if (isAndroid) window.location.href = "${PLAY_STORE_URL}";
            }
          }
        }, 3000);
      }
    };
  </script>
</head>
<body>
  <div class="container">
    <div class="logo">QuantMind</div>
    <div class="status-bar">SECURE_LINK_PARSING: ${cleanPath.toUpperCase()}</div>
    <h1 style="margin: 0 0 16px 0; font-size: 24px; color: #fff; letter-spacing: -1px;">Opening Terminal</h1>
    <p style="font-size: 15px; line-height: 1.7; color: #94a3b8; margin-bottom: 40px; padding: 0 20px;">Initializing encrypted node connection for authorized asset management.</p>
    <a href="${appLink}" class="btn">OPEN TERMINAL</a>
    <a href="${APP_STORE_URL}" class="btn btn-secondary">DOWNLOAD MOBILE APP</a>
    <div class="footer">FX1 INSTITUTIONAL CORE</div>
  </div>
</body>
</html>`;
}

serve((req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;

  // iOS Domain Verification (Universal Links)
  if (path === '/apple-app-site-association' || path === '/.well-known/apple-app-site-association') {
    return new Response(JSON.stringify({
      applinks: {
        apps: [],
        details: [{
          appID: `${TEAM_ID}.${BUNDLE_ID}`,
          paths: ["*", "/terminal", "/risk/*", "/settings", "/operator/*", "/onboarding"]
        }]
      }
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Android Domain Verification (App Links)
  if (path === '/.well-known/assetlinks.json') {
    return new Response(JSON.stringify([{
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: BUNDLE_ID,
        sha256_cert_fingerprints: ["PLACEHOLDER_SHA256"]
      }
    }]), { headers: { 'Content-Type': 'application/json' } });
  }

  // Extract path and render landing page/shuttle
  const cleanPath = url.searchParams.get('path') || path || '/terminal';
  const html = getLandingPage(cleanPath);

  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
});
