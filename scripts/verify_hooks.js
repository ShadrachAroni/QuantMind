const crypto = require('crypto');
const https = require('https');

const GITHUB_SECRET = process.env.GITHUB_WEBHOOK_SECRET || "fallback_for_local_testing_only";
const PAYSTACK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET || "fallback_for_local_testing_only";

const GITHUB_URL = "qvqczzyghhgzaesiwtkj.supabase.co";
const GITHUB_PATH = "/functions/v1/github-webhook";
const PAYSTACK_PATH = "/functions/v1/paystack-webhook";

function request(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname,
      path,
      method: 'POST',
      headers: {
        ...headers,
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function run() {
  console.log("--- Starting Automated Webhook Verification ---");

  // Verify GitHub
  const githubPayload = JSON.stringify({ zen: "Verification Test" });
  const githubSig = "sha256=" + crypto.createHmac('sha256', GITHUB_SECRET).update(githubPayload).digest('hex');
  const githubResp = await request(GITHUB_URL, GITHUB_PATH, {
    'x-hub-signature-256': githubSig,
    'x-github-event': 'ping',
    'Content-Type': 'application/json'
  }, githubPayload);
  console.log(`GITHUB (${GITHUB_PATH}): [${githubResp.status}] ${githubResp.body}`);

  // Verify Paystack
  const paystackPayload = JSON.stringify({ event: "charge.success", data: { id: 123, reference: "test_ref" } });
  const paystackSig = crypto.createHmac('sha512', PAYSTACK_SECRET).update(paystackPayload).digest('hex');
  const paystackResp = await request(GITHUB_URL, PAYSTACK_PATH, {
    'x-paystack-signature': paystackSig,
    'Content-Type': 'application/json'
  }, paystackPayload);
  console.log(`PAYSTACK (${PAYSTACK_PATH}): [${paystackResp.status}] ${paystackResp.body}`);
}

run().catch(console.error);
