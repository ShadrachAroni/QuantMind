# QuantMind Subscription Tiers & Pricing

QuantMind offers several subscription tiers designed to bridge the gap between retail accessibility and institutional sophistication. Below is a breakdown of the available tiers, their costs, and included features.

## Pricing Matrix

| Tier | Monthly (USD) | Monthly (KES) | Yearly (USD) | Yearly (KES) | Target & Tagline |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Free — Explorer** | $0 | KES 0 | N/A | N/A | "Wow, this is eye-opening." |
| **Plus — Investor** | $9.99 | KES 1,499 | $99 | KES 14,850 | `PLN_emm71vstqcgpvbw` / `PLN_n3eqcfdmmwrjryi` |
| **QuantMind Pro** | $24.99 | KES 3,749 | $229 | KES 34,350 | `PLN_yktxo3jqz0dk2s0` / `PLN_riwa9c82qn37uvs` |
| **Student / Academic** | $5 | KES 750 | $49 | KES 7,350 | `PLN_f09gf986tgcf5mu` / `PLN_bhsxacwwti5xw8p` |

## 💳 Final Production Configuration (Paystack)

The following plans are live and synchronized across the Web, Mobile, and Supabase tiers.

| Tier | Billing | Paystack Plan Code | Global Pricing | KES Equivalent |
| :--- | :--- | :--- | :--- | :--- |
| **Plus** | Monthly | `PLN_emm71vstqcgpvbw` | $9.99/mo | KES 1,499 |
| **Plus** | Yearly | `PLN_n3eqcfdmmwrjryi` | $99/yr | KES 14,850 |
| **Pro** | Monthly | `PLN_yktxo3jqz0dk2s0` | $24.99/mo | KES 3,749 |
| **Pro** | Yearly | `PLN_riwa9c82qn37uvs` | $229/yr | KES 34,350 |
| **Student** | Monthly | `PLN_f09gf986tgcf5mu` | $5/mo | KES 750 |
| **Student** | Yearly | `PLN_bhsxacwwti5xw8p` | $49/yr | KES 7,350 |

---

## 🚀 Payment Methods & Platforms

Users can access the institutional-grade checkout experience on both **Web** and **Mobile** platforms.

### Supported Payment Channels:
-   **Cards**: Visa, Mastercard, AMEX (Global).
-   **Mobile Money**: **M-Pesa** (Safaricom), Airtel Money (East Africa).
-   **Digital Wallets**: **Apple Pay**, Google Pay.
-   **Direct Bank Transfer**: Optimized for local institutional transfers.
-   **USSD**: Faster checkout for mobile-first operators.

### Platform-Specific UX:
-   **Web**: Redirects to a secure Paystack checkout terminal with instant callback to the production verification node: `https://Quantmind.co.ke/api/paystack/callback`.
-   **Mobile**: Launches the Paystack interface within the native browser/webview, returning to the web-based verification node to ensure cross-platform consistency.

---

## 🛡️ System Reliability & Payment Recovery

QuantMind utilizes a multi-layered approach to ensure that every successful payment results in an immediate account upgrade, even in the event of network interruptions.

### 1. Webhook Redundancy (Server-to-Server)
Even if a user closes their browser tab immediately after paying, the **Paystack Webhook** (Supabase Edge Function) communicates directly with our servers to update the `user_profiles` and `subscriptions` tables.

### 2. Smart Retry Protocol
In the event of a declined card or gateway failure:
- **Persistence**: The system remembers the last plan the user attempted to purchase.
- **Instant Recovery**: Key dashboards display a `[RETRY_INITIALIZATION]` button that automatically returns the user to the correct checkout flow without re-selecting options.

### 3. Automated Transaction Cleanup
To maintain database performance and security, a daily background job (Cron) performs maintenance on the transaction ledger:
- **Look-back Period**: 72 Hours (Optimal window for M-Pesa/Bank processing).
- **Action**: Automatically purges "Pending" or "Failed" transactions that have been abandoned for more than 3 days.

### 4. Callback Synchronization
The Web Terminal includes a built-in 2-second synchronization buffer upon return from Paystack. This ensures the background webhook has completed its database handshake before the UI refreshes the user's session credentials.


---

## 🧪 Live Verification Demo Pages
The following pages can be used for end-to-end testing of the billing logic:

- **Plus Monthly:** [https://paystack.shop/pay/hn3m4jkf0z](https://paystack.shop/pay/hn3m4jkf0z)
- **Plus Yearly:** [https://paystack.shop/pay/6ghyg6ywn4](https://paystack.shop/pay/6ghyg6ywn4)
- **Pro Monthly:** [https://paystack.shop/pay/8-098jlqmd](https://paystack.shop/pay/8-098jlqmd)
- **Pro Yearly:** [https://paystack.shop/pay/9usfcf58tz](https://paystack.shop/pay/9usfcf58tz)
- **Student Monthly:** [https://paystack.shop/pay/09hmw0gwou](https://paystack.shop/pay/09hmw0gwou)
- **Student Yearly:** [https://paystack.shop/pay/9hsvnr1ved](https://paystack.shop/pay/9hsvnr1ved)

---

## Tier Features Detail

### 1. Free — Explorer
Ideal for those new to quantitative risk management.
- **Portfolios:** 2 Institutional Portfolios
- **Simulation:** 2,000 Simulation Paths
- **Analysis:** Basic Risk Metrics (VaR, Max Drawdown)

### 2. Plus — Investor
Designed for active investors looking for deeper insights.
- **Portfolios:** Unlimited
- **Simulation:** 10,000 Simulation Paths
- **Analysis:** Diversification Score
- **AI Access:** Standard AI Assistant Access

### 3. QuantMind Pro
Institutional-grade tools for professional-level strategy optimization.
- **Portfolios:** Unlimited
- **Simulation:** 10,000+ Simulation Paths
- **Analysis:** AI Portfolio Doctor (LLM-powered recommendations)
- **Engines:** Fat-Tail (Levy) Simulation Engines
- **Gating:** Access to mission-critical features (Backtesting, Oracle)

### 4. Student / Academic
Full feature set at a significant discount for verified students.
- **Verification:** Requires valid institutional ID
- **Simulation:** 10,000 Simulation Paths per Month
- **Exports:** Exportable PDF Reports
- **Core:** Same features as the Plus tier

---

## Billing Notes

- **Currency Support:** Primary billing is in **USD**. Local pricing for **KES** (Kenya Shillings) is provided as a reference.
- **Payment Provider:** All transactions are securely processed via **Paystack**.
- **Cancellation:** Subscriptions can be canceled at any time from the **Billing Terminal** in your dashboard.
