import Stripe from 'stripe';

let connectionSettings: any;

async function getCredentials() {
  // Priority 1: Use environment variables/secrets if they contain live keys
  const envSecretKey = process.env.STRIPE_SECRET_KEY;
  const envPublishableKey = process.env.VITE_STRIPE_PUBLIC_KEY;
  
  // If we have live keys in environment, use them directly
  if (envSecretKey?.startsWith('sk_live_') || envPublishableKey?.startsWith('pk_live_')) {
    console.log('💳 Using LIVE Stripe keys from environment');
    return {
      publishableKey: envPublishableKey || '',
      secretKey: envSecretKey || '',
    };
  }

  // Priority 2: Try Replit connector
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (hostname && xReplitToken) {
    try {
      const connectorName = 'stripe';
      const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
      const targetEnvironment = isProduction ? 'production' : 'development';

      const url = new URL(`https://${hostname}/api/v2/connection`);
      url.searchParams.set('include_secrets', 'true');
      url.searchParams.set('connector_names', connectorName);
      url.searchParams.set('environment', targetEnvironment);

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      });

      const data = await response.json();
      connectionSettings = data.items?.[0];

      if (connectionSettings?.settings?.publishable && connectionSettings?.settings?.secret) {
        // Check if connector has live keys
        if (connectionSettings.settings.secret.startsWith('sk_live_')) {
          console.log('💳 Using LIVE Stripe keys from connector');
        } else {
          console.log('💳 Using TEST Stripe keys from connector');
        }
        return {
          publishableKey: connectionSettings.settings.publishable,
          secretKey: connectionSettings.settings.secret,
        };
      }
    } catch (error) {
      console.log('💳 Connector not available, falling back to environment variables');
    }
  }

  // Priority 3: Fall back to any environment variables
  if (envSecretKey && envPublishableKey) {
    console.log('💳 Using Stripe keys from environment variables');
    return {
      publishableKey: envPublishableKey,
      secretKey: envSecretKey,
    };
  }

  throw new Error('Stripe credentials not found. Please set STRIPE_SECRET_KEY and VITE_STRIPE_PUBLIC_KEY environment variables.');
}

export async function getUncachableStripeClient() {
  const { secretKey } = await getCredentials();

  return new Stripe(secretKey, {
    apiVersion: '2025-08-27.basil',
  });
}

export async function getStripePublishableKey() {
  const { publishableKey } = await getCredentials();
  return publishableKey;
}

export async function getStripeSecretKey() {
  const { secretKey } = await getCredentials();
  return secretKey;
}

let stripeSync: any = null;

export async function getStripeSync() {
  if (!stripeSync) {
    const { StripeSync } = await import('stripe-replit-sync');
    const secretKey = await getStripeSecretKey();

    stripeSync = new StripeSync({
      poolConfig: {
        connectionString: process.env.DATABASE_URL!,
        max: 2,
      },
      stripeSecretKey: secretKey,
    });
  }
  return stripeSync;
}

export async function isStripeConfigured(): Promise<boolean> {
  try {
    await getCredentials();
    return true;
  } catch {
    return false;
  }
}
