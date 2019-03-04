'use strict'

const t = require('tap')
const test = t.test
const Fastify = require('fastify')
const fastifyStripe = require('../plugin')

require('dotenv').config()

test('fastify.stripe namespace should exist', t => {
  t.plan(7)

  const fastify = Fastify()

  fastify.register(fastifyStripe, {
    api_key: process.env.STRIPE_TEST_API_KEY,
    maxNetworkRetries: 3,
    timeout: 20000,
    version: '2019-02-19'
  })

  fastify.ready(errors => {
    t.error(errors)

    t.ok(fastify.stripe)
    t.ok(fastify.stripe.balance)
    t.ok(fastify.stripe.customers)

    t.strictEqual(fastify.stripe._api.maxNetworkRetries, 3)
    t.strictEqual(fastify.stripe._api.timeout, 20000)
    t.strictEqual(fastify.stripe._api.version, '2019-02-19')

    fastify.close()
  })
})

test('fastify.stripe.test namespace should exist', t => {
  t.plan(5)

  const fastify = Fastify()

  fastify.register(fastifyStripe, {
    api_key: process.env.STRIPE_TEST_API_KEY,
    name: 'test'
  })

  fastify.ready(errors => {
    t.error(errors)

    t.ok(fastify.stripe)
    t.ok(fastify.stripe.test)
    t.ok(fastify.stripe.test.balance)
    t.ok(fastify.stripe.test.customers)

    fastify.close()
  })
})

test('Should create a new stripe customer with a singular Stripe instance', t => {
  t.plan(6)

  const fastify = Fastify()

  fastify.register(fastifyStripe, {
    api_key: process.env.STRIPE_TEST_API_KEY,
    maxNetworkRetries: 3,
    timeout: 20000,
    version: '2019-02-19'
  })

  fastify.ready(async errors => {
    t.error(errors)

    t.ok(fastify.stripe)
    t.ok(fastify.stripe.customers)

    try {
      const customers = await fastify.stripe.customers.create({ email: 'demo@demo.tld' })

      t.type(customers, 'object')
      t.strictEqual(customers.object, 'customer')
      t.pass()
    } catch (err) {
      t.fail()
    }

    fastify.close()
  })
})

test('Should create a new stripe customer with multiple named Stripe instance', t => {
  t.plan(9)

  const fastify = Fastify()

  fastify
    .register(fastifyStripe, {
      name: 'prod',
      api_key: process.env.STRIPE_TEST_API_KEY
    })
    .register(fastifyStripe, {
      name: 'test',
      api_key: process.env.STRIPE_TEST_API_KEY,
      maxNetworkRetries: 3,
      timeout: 20000
    })

  fastify.ready(async errors => {
    t.error(errors)

    t.ok(fastify.stripe)
    t.ok(fastify.stripe.test.customers)

    try {
      const customers = await fastify.stripe.test.customers.create({ email: 'demo@demo.tld' })

      t.type(customers, 'object')
      t.strictEqual(customers.object, 'customer')
      t.pass()
    } catch (err) {
      t.fail()
    }

    try {
      const customers = await fastify.stripe.prod.customers.create({ email: 'demo@demo.tld' })

      t.type(customers, 'object')
      t.strictEqual(customers.object, 'customer')
      t.pass()
    } catch (err) {
      t.fail()
    }

    fastify.close()
  })
})

test('fastify.stripe.test should throw with duplicate connection names', t => {
  t.plan(1)

  const fastify = Fastify()
  const name = 'test'

  fastify
    .register(fastifyStripe, {
      api_key: process.env.STRIPE_TEST_API_KEY,
      name
    })
    .register(fastifyStripe, {
      api_key: process.env.STRIPE_TEST_API_KEY,
      name
    })

  fastify.ready(errors => {
    t.is(errors.message, `Stripe '${name}' instance name as already been registered`)
  })
})

test('Should throw if registered without an API key', t => {
  t.plan(1)

  const fastify = Fastify()

  fastify.register(fastifyStripe)

  fastify.ready(errors => {
    t.is(errors.message, 'You must provide a Stripe API key')
  })
})

test('Should throw when trying to register multiple instances without giving a name', t => {
  t.plan(1)

  const fastify = Fastify()

  fastify
    .register(fastifyStripe, {
      api_key: process.env.STRIPE_TEST_API_KEY
    })
    .register(fastifyStripe, {
      api_key: process.env.STRIPE_TEST_API_KEY
    })

  fastify.ready(errors => {
    t.is(errors.message, `fastify-stripe has already been registered`)
  })
})
