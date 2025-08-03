# Stripe Webhook Setup Guide

## 🚀 After Deploying Your App

Once your app is deployed to a platform like Vercel, follow these steps to set up the real Stripe webhook:

### Step 1: Get Your Production URL
After deployment, you'll have a URL like:
- Vercel: `https://your-app.vercel.app`
- Netlify: `https://your-app.netlify.app`
- etc.

### Step 2: Create Webhook in Stripe Dashboard

1. **Go to Stripe Dashboard** → [Webhooks](https://dashboard.stripe.com/test/webhooks)
2. **Click "Add endpoint"**
3. **Enter your webhook URL**: `https://your-domain.com/api/webhooks/stripe`
4. **Select events to listen for**:
   - `checkout.session.completed`
   - `checkout.session.expired`
5. **Click "Add endpoint"**

### Step 3: Get Webhook Secret

1. **Click on your newly created webhook**
2. **Click "Reveal" next to "Signing secret"**
3. **Copy the secret** (starts with `whsec_`)

### Step 4: Update Environment Variables

Add the webhook secret to your production environment:

**For Vercel:**
```bash
vercel env add STRIPE_WEBHOOK_SECRET
# Paste your webhook secret when prompted
```

**For other platforms:**
Add `STRIPE_WEBHOOK_SECRET=whsec_your_secret_here` to your environment variables.

### Step 5: Test the Webhook

1. **Make a test booking** on your live site
2. **Complete the payment** with test card `4242 4242 4242 4242`
3. **Check your logs** for webhook confirmation
4. **Verify in Firebase** that the booking status changed to "paid"

### Step 6: Monitor Webhook

In Stripe Dashboard → Webhooks → Your endpoint:
- Check **"Recent deliveries"** to see webhook attempts
- Look for **200 status codes** (success)
- Debug any **failed deliveries** in the logs

## 🔧 Troubleshooting

### Webhook Returns 400/500 Errors:
- Check environment variables are set correctly
- Verify webhook URL is exactly: `/api/webhooks/stripe`
- Check server logs for detailed error messages

### Payments Complete But Status Stays "Pending":
- Check webhook is receiving events in Stripe Dashboard
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Check Firebase permissions allow updates

### For Local Testing (Optional):
If you want to test webhooks locally, you can use tools like:
- ngrok
- Stripe CLI (if you install it later)
- Vercel dev tunneling

## 📊 What Happens When Working:

1. Customer completes payment in Stripe
2. Stripe sends webhook to your endpoint
3. Your app verifies the webhook signature
4. Firebase booking status updates: `pending` → `paid`
5. Service status updates: `awaiting_payment` → `scheduled`