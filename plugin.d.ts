import { FastifyPluginCallback } from 'fastify';
import Stripe from 'stripe';

export type FastifyStripeOptions = {
  /**
   * Stripe API Key
   *
   * @docs https://stripe.com/docs/api/authentication
   * @docs https://stripe.com/docs/keys
   */
  apiKey: string;

  /**
   * fastify-stripe instance name
   */
  name?: string;
} & Omit<Stripe.StripeConfig, "appInfo">;

export type FastifyStripeNamedInstance = { [name: string]: Stripe };

declare module 'fastify' {
  interface FastifyInstance {
    stripe: FastifyStripeNamedInstance | Stripe;
  }
}

export const FastifyStripePlugin: FastifyPluginCallback<FastifyStripeOptions>;
export default FastifyStripePlugin;
