import { getUncachableStripeClient } from './stripe-client';
import { db } from '../db';
import { sql } from 'drizzle-orm';

export class StripeService {
  async createCustomer(email: string, userId: string, metadata?: Record<string, string>) {
    const stripe = await getUncachableStripeClient();
    return await stripe.customers.create({
      email,
      metadata: { userId, ...metadata },
    });
  }

  async createCheckoutSession(
    customerId: string, 
    priceId: string, 
    successUrl: string, 
    cancelUrl: string,
    mode: 'subscription' | 'payment' = 'payment'
  ) {
    const stripe = await getUncachableStripeClient();
    return await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
  }

  async createCustomerPortalSession(customerId: string, returnUrl: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  async getProduct(productId: string) {
    try {
      const result = await db.execute(
        sql`SELECT * FROM stripe.products WHERE id = ${productId}`
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  }

  async listProducts(active = true, limit = 20, offset = 0) {
    try {
      const result = await db.execute(
        sql`SELECT * FROM stripe.products WHERE active = ${active} LIMIT ${limit} OFFSET ${offset}`
      );
      return result.rows;
    } catch (error) {
      console.error('Error listing products:', error);
      return [];
    }
  }

  async listProductsWithPrices(active = true, limit = 20, offset = 0) {
    try {
      const result = await db.execute(
        sql`
          WITH paginated_products AS (
            SELECT id, name, description, metadata, active
            FROM stripe.products
            WHERE active = ${active}
            ORDER BY id
            LIMIT ${limit} OFFSET ${offset}
          )
          SELECT 
            p.id as product_id,
            p.name as product_name,
            p.description as product_description,
            p.active as product_active,
            p.metadata as product_metadata,
            pr.id as price_id,
            pr.unit_amount,
            pr.currency,
            pr.recurring,
            pr.active as price_active,
            pr.metadata as price_metadata
          FROM paginated_products p
          LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
          ORDER BY p.id, pr.unit_amount
        `
      );
      return result.rows;
    } catch (error) {
      console.error('Error listing products with prices:', error);
      return [];
    }
  }

  async getPrice(priceId: string) {
    try {
      const result = await db.execute(
        sql`SELECT * FROM stripe.prices WHERE id = ${priceId}`
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching price:', error);
      return null;
    }
  }

  async listPrices(active = true, limit = 20, offset = 0) {
    try {
      const result = await db.execute(
        sql`SELECT * FROM stripe.prices WHERE active = ${active} LIMIT ${limit} OFFSET ${offset}`
      );
      return result.rows;
    } catch (error) {
      console.error('Error listing prices:', error);
      return [];
    }
  }

  async getPricesForProduct(productId: string) {
    try {
      const result = await db.execute(
        sql`SELECT * FROM stripe.prices WHERE product = ${productId} AND active = true`
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching prices for product:', error);
      return [];
    }
  }

  async getSubscription(subscriptionId: string) {
    try {
      const result = await db.execute(
        sql`SELECT * FROM stripe.subscriptions WHERE id = ${subscriptionId}`
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  }

  async getBalance() {
    const stripe = await getUncachableStripeClient();
    return await stripe.balance.retrieve();
  }

  async getPaymentIntent(paymentIntentId: string) {
    try {
      const result = await db.execute(
        sql`SELECT * FROM stripe.payment_intents WHERE id = ${paymentIntentId}`
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching payment intent:', error);
      return null;
    }
  }

  async listRecentPayments(limit = 20) {
    try {
      const result = await db.execute(
        sql`SELECT * FROM stripe.payment_intents ORDER BY created DESC LIMIT ${limit}`
      );
      return result.rows;
    } catch (error) {
      console.error('Error listing recent payments:', error);
      return [];
    }
  }
}

export const stripeService = new StripeService();
