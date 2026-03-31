const crypto = require('crypto');

// Values provided by the user in the request
const payload = {
  "zen": "Mind your words, they are important.",
  "hook_id": 603692830,
  "hook": {
    "type": "Repository",
    "id": 603692830,
    "name": "web",
    "active": true,
    "events": [
      "push"
    ],
    "config": {
      "content_type": "json",
      "insecure_ssl": "0",
      "secret": "********",
      "url": "https://qvqczzyghhgzaesiwtkj.supabase.co/functions/v1/github-webhook"
    },
    "updated_at": "2026-03-31T08:49:23Z",
    "created_at": "2026-03-31T08:49:23Z",
    "url": "https://api.github.com/repos/ShadrachAroni/QuantMind/hooks/603692830",
    "test_url": "https://api.github.com/repos/ShadrachAroni/QuantMind/hooks/603692830/test",
    "ping_url": "https://api.github.com/repos/ShadrachAroni/QuantMind/hooks/603692830/pings",
    "deliveries_url": "https://api.github.com/repos/ShadrachAroni/QuantMind/hooks/603692830/deliveries",
    "last_response": {
      "code": null,
      "status": "unused",
      "message": null
    }
  },
  "repository": {
    "id": 1151708011,
    "node_id": "R_kgDORKWraw",
    "name": "QuantMind",
    "full_name": "ShadrachAroni/QuantMind",
    "private": false,
    "owner": {
      "login": "ShadrachAroni",
      "id": 126606301,
      "node_id": "U_kgDOB4vb3Q",
      "avatar_url": "https://avatars.githubusercontent.com/u/126606301?v=4",
      "gravatar_id": "",
      "url": "https://api.github.com/users/ShadrachAroni",
      "html_url": "https://github.com/ShadrachAroni",
      "followers_url": "https://api.github.com/users/ShadrachAroni/followers",
      "following_url": "https://api.github.com/users/ShadrachAroni/following{/other_user}",
      "gists_url": "https://api.github.com/users/ShadrachAroni/gists{/gist_id}",
      "starred_url": "https://api.github.com/users/ShadrachAroni/starred{/owner}{/repo}",
      "subscriptions_url": "https://api.github.com/users/ShadrachAroni/subscriptions",
      "organizations_url": "https://api.github.com/users/ShadrachAroni/orgs",
      "repos_url": "https://api.github.com/users/ShadrachAroni/repos",
      "events_url": "https://api.github.com/users/ShadrachAroni/events{/privacy}",
      "received_events_url": "https://api.github.com/users/ShadrachAroni/received_events",
      "type": "User",
      "user_view_type": "public",
      "site_admin": false
    },
    // ... truncated in original message, using placeholders to check if it's the right logic
  }
};

// NOTE: The signature calculation depends on the EXACT RAW BYTE STRING of the payload.
// Since the user provided a JSON representation, we will try to Stringify it, but this often fails 
// if whitespace or key density is different than what GitHub sent.

const RAW_PAYLOAD_STRING = process.env.PAYLOAD_STRING || JSON.stringify(payload); 
const SECRET = process.env.QUANTMIND_GH_SECRET; 
const GITHUB_SIG_HEADER = process.env.GITHUB_SIG_HEADER || "sha256=94593e3ea2869888a800b6f40b0707ec3cb6d1306e2223b417e9d6dd2ab01dfb";

if (!SECRET) {
  console.error("❌ Error: QUANTMIND_GH_SECRET environment variable is not set.");
  process.exit(1);
}

function calculateSignature(payloadStr, secret) {
  return "sha256=" + crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
}

console.log("--- Signature Verification Test ---");
const computed = calculateSignature(RAW_PAYLOAD_STRING, SECRET);
console.log(`GITHUB HEADER: ${GITHUB_SIG_HEADER}`);
console.log(`COMPUTED (JSON.stringify): ${computed}`);

if (computed === GITHUB_SIG_HEADER) {
  console.log("✅ MATCH!");
} else {
  console.log("❌ NO MATCH (likely due to payload formatting differences)");
}
