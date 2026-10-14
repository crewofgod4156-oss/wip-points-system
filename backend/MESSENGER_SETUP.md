# Messenger slip verification

This channel only verifies slips; it does not modify the loyalty database or award points.

1. Sync the backend commit to the repository connected to Railway and deploy.
2. In the Meta developer app, configure Messenger for the intended Facebook Page and obtain a Page access token with pages_messaging permission.
3. Add these Railway variables:
   - MESSENGER_ENABLED=true
   - MESSENGER_PAGE_ID: numeric Page ID (not Page name or URL).
   - MESSENGER_PAGE_ACCESS_TOKEN: Page access token, not a user token.
   - MESSENGER_APP_SECRET: Meta app secret.
   - MESSENGER_VERIFY_TOKEN: a random secret you choose, identical in Railway and webhook setup.
   - MESSENGER_GRAPH_VERSION: the supported version shown in the Meta app, including v, for example v23.0 if supported by that app.
4. Keep SLIPOK_ENABLED=true, SLIPOK_API_KEY and SLIPOK_BRANCH_ID from the existing working integration.
5. Callback URL: https://balanced-prosperity-production-3b75.up.railway.app/api/messenger/webhook
6. Verify the callback using MESSENGER_VERIFY_TOKEN. Subscribe the Page to messages events.
7. Test by sending an image from an account permitted to test the app. Public customers require the appropriate app mode, permissions and any review required by Meta.

Do not put secrets in Git or chat. Paste them directly in Railway.

Image attachments are sent to SlipOK using its URL input. If Meta's attachment URL cannot be accessed by SlipOK, inspect the status/code log; a download-and-upload adapter may be needed. Results use the same recipient/duplicate checks as the LINE integration through log=true. Images returning 1007 or 1008 are silent. Other errors reply to the sender. Replies are RESPONSE messages triggered by incoming messages.

Webhook signatures use the exact raw body and the app secret. Echoes and unrelated Pages are ignored. Each message is deduplicated in memory for 24 hours; restarting clears this cache. Acknowledgment is immediate and processing is in the background, so container shutdown may interrupt work. This is not a durable queue.

Local tests mock external APIs and do not read or write the database:
node --test backend/src/services/slipok.test.js backend/src/services/messengerSlipok.test.js