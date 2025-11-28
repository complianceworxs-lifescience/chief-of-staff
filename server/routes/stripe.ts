import { Router, Request, Response } from 'express';
import { stripeService } from '../services/stripe-service';
import { getStripePublishableKey, isStripeConfigured } from '../services/stripe-client';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  try {
    const configured = await isStripeConfigured();
    if (!configured) {
      res.status(503).json({
        success: false,
        status: 'not_configured',
        message: 'Stripe connector not configured'
      });
      return;
    }

    const balance = await stripeService.getBalance();
    res.json({
      success: true,
      status: 'connected',
      balance: {
        available: balance.available.map(b => ({
          amount: b.amount / 100,
          currency: b.currency.toUpperCase()
        })),
        pending: balance.pending.map(b => ({
          amount: b.amount / 100,
          currency: b.currency.toUpperCase()
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/config', async (req: Request, res: Response) => {
  try {
    const publishableKey = await getStripePublishableKey();
    res.json({
      success: true,
      publishableKey
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get Stripe config'
    });
  }
});

router.get('/products', async (req: Request, res: Response) => {
  try {
    const products = await stripeService.listProducts();
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to list products'
    });
  }
});

router.get('/products-with-prices', async (req: Request, res: Response) => {
  try {
    const rows = await stripeService.listProductsWithPrices();

    const productsMap = new Map();
    for (const row of rows as any[]) {
      if (!productsMap.has(row.product_id)) {
        productsMap.set(row.product_id, {
          id: row.product_id,
          name: row.product_name,
          description: row.product_description,
          active: row.product_active,
          metadata: row.product_metadata,
          prices: []
        });
      }
      if (row.price_id) {
        productsMap.get(row.product_id).prices.push({
          id: row.price_id,
          unit_amount: row.unit_amount,
          currency: row.currency,
          recurring: row.recurring,
          active: row.price_active,
          metadata: row.price_metadata
        });
      }
    }

    res.json({ success: true, data: Array.from(productsMap.values()) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to list products with prices'
    });
  }
});

router.get('/products/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const product = await stripeService.getProduct(productId);
    
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get product'
    });
  }
});

router.get('/products/:productId/prices', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const product = await stripeService.getProduct(productId);
    
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    const prices = await stripeService.getPricesForProduct(productId);
    res.json({ success: true, data: prices });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get prices'
    });
  }
});

router.get('/prices', async (req: Request, res: Response) => {
  try {
    const prices = await stripeService.listPrices();
    res.json({ success: true, data: prices });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to list prices'
    });
  }
});

router.post('/checkout', async (req: Request, res: Response) => {
  try {
    const { priceId, customerId, successUrl, cancelUrl, mode } = req.body;

    if (!priceId) {
      res.status(400).json({ success: false, message: 'priceId is required' });
      return;
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const session = await stripeService.createCheckoutSession(
      customerId || undefined,
      priceId,
      successUrl || `${baseUrl}/checkout/success`,
      cancelUrl || `${baseUrl}/checkout/cancel`,
      mode || 'payment'
    );

    res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create checkout session'
    });
  }
});

router.post('/customer-portal', async (req: Request, res: Response) => {
  try {
    const { customerId, returnUrl } = req.body;

    if (!customerId) {
      res.status(400).json({ success: false, message: 'customerId is required' });
      return;
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const session = await stripeService.createCustomerPortalSession(
      customerId,
      returnUrl || baseUrl
    );

    res.json({ success: true, url: session.url });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create customer portal session'
    });
  }
});

router.get('/payments/recent', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const payments = await stripeService.listRecentPayments(limit);
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to list recent payments'
    });
  }
});

router.get('/subscriptions/:subscriptionId', async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const subscription = await stripeService.getSubscription(subscriptionId);
    
    if (!subscription) {
      res.status(404).json({ success: false, message: 'Subscription not found' });
      return;
    }
    
    res.json({ success: true, data: subscription });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get subscription'
    });
  }
});

export default router;
