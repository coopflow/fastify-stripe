import { config } from 'dotenv'
import Fastify from 'fastify'
import Stripe from 'stripe'
import { expectAssignable, expectNotType, expectType } from 'tsd'
import fastifyStripe, { FastifyStripeNamedInstance } from '../../plugin'

const { parsed: env } = config()

if (!env) {
  throw new Error('No environment variables defined')
}

const app = Fastify()
app.register(fastifyStripe, {
  apiKey: env.STRIPE_TEST_API_KEY,
  apiVersion: '2020-08-27'
})

app.ready(() => {
  expectAssignable<Stripe>(app.stripe)
  expectNotType<FastifyStripeNamedInstance>(app.stripe)
  expectType<Stripe.CustomersResource>(app.stripe.customers)
  expectType<Promise<Stripe.Response<Stripe.Customer>>>(
    app.stripe.customers.create({ email: 'demo@demo.tld' })
  )

  app.close()
})

const appOne = Fastify()
appOne.register(fastifyStripe, {
  apiKey: env.STRIPE_TEST_API_KEY,
  apiVersion: '2020-08-27',
  name: 'one'
})

appOne.ready(() => {
  expectAssignable<FastifyStripeNamedInstance>(appOne.stripe)
  expectNotType<Stripe>(appOne.stripe)
  expectType<Stripe>(appOne.stripe.one)
  expectType<Stripe.CustomersResource>(appOne.stripe.one.customers)
  expectType<Promise<Stripe.Response<Stripe.Customer>>>(
    appOne.stripe.one.customers.create({ email: 'demo@demo.tld' })
  )

  appOne.close()
})
