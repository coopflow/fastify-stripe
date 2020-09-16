import { FastifyPluginCallback } from 'fastify'
import Stripe from 'stripe'

interface FastifyStripeOptions extends Omit<Stripe.StripeConfig, "appInfo"> {
  apiKey: string;
  name?: string;
}

// Optionally, you can add any additional exports.
export interface FastifyStripeNamedInstance {
  (name: string): Stripe;
}

// Here we are exporting the decorator we added.
export interface FastifyStripe {
  stripe: Stripe | FastifyStripeNamedInstance;
}

// Most importantly, use declaration merging to add the custom property to the Fastify type system
declare module 'fastify' {
  interface FastifyInstance {
    stripe: FastifyStripe;
  }
}

// fastify-plugin automatically adds named export, so be sure to add also this type
// the variable name is derived from `options.name` property if `module.exports.myPlugin` is missing
export const FastifyStripePlugin: FastifyPluginCallback<FastifyStripeOptions>

// fastify-plugin automatically adds `.default` property to the exported plugin. See the note below
export default FastifyStripePlugin
