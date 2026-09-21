# Pioneer Emergency Account Protection Guide
**Published under Project Bazaar / Bazaar Republic (PiOS)**

If you suspect your 24-word passphrase was entered on a phishing site or exposed, follow this operational guide before your locked balance unlocks or migrates.

---

### 1. Do Not Compete in a Manual Speed Race
Automated sweeper bots run continuously on cloud servers and submit transactions in milliseconds. You cannot out-click an automated script on unlock day.

### 2. Prepare an Isolated Secondary Signer
- **Option A (Security Circle):** Ask a trusted Security Circle contact for their public wallet address (`G...`).
- **Option B (Self-Sovereign Cold Key):** Generate a brand new, uncompromised wallet key on a clean device.

### 3. Fortify the Account Ahead of Time
Do not wait for unlock day. While your balance is still locked, submit a `SetOptions` transaction from your account:
- Set your **Master Key Weight** to `1`.
- Add your **Guardian Key** with a weight of `1`.
- Set **Low, Medium, and High Thresholds** to `2`.

*Outcome:* The hacker's bot can no longer move funds alone. Any unauthorized payment attempt is rejected by consensus with `op_bad_auth`.

### 4. Co-Sign Recovery & Neutralize the Leaked Key
1. When your tokens unlock, co-sign a single payment with both keys to transfer funds to your clean recovery wallet.
2. Submit a final `SetOptions` transaction setting `masterWeight: 0`.
3. Your old seed phrase is permanently disabled, while your account history remains secure.
