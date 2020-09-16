import { FastifyPluginCallback } from 'fastify'
import Stripe from 'stripe'

interface FastifyStripeOptions extends Omit<Stripe.StripeConfig, "appInfo"> {
  apiKey: string;
  name?: string;
}

export interface FastifyStripeNamedInstance {
  (name: string): Stripe;
}

export interface FastifyStripe {
  stripe: Stripe | FastifyStripeNamedInstance;
}

declare module 'fastify' {
  interface FastifyInstance {
    stripe: FastifyStripe;
  }
}

export const FastifyStripePlugin: FastifyPluginCallback<FastifyStripeOptions>
export default FastifyStripePlugin
