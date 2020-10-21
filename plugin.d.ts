import { FastifyPluginCallback } from 'fastify';
import Stripe from 'stripe';

/**
 * @docs https://github.com/coopflow/fastify-stripe/tree/types#options
 */
export interface FastifyStripeOptions extends Omit<Stripe.StripeConfig, "appInfo"> {
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
}

export interface FastifyStripeNamedInstance {
  [name: string]: Stripe;
}

export type FastifyStripe = FastifyStripeNamedInstance & Stripe;

declare module "fastify" {
  interface FastifyInstance {
    stripe: FastifyStripe;
  }
}

export const FastifyStripePlugin: FastifyPluginCallback<FastifyStripeOptions>;
export default FastifyStripePlugin;
