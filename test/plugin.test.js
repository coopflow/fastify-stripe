'use strict'

const t = require('tap')
const test = t.test
const Fastify = require('fastify')
const fastifyStripe = require('../plugin')

require('dotenv').config()

test('fastify.stripe namespace should exist', t => {
  t.plan(8)

  const fastify = Fastify()

  fastify.register(fastifyStripe, {
    apiKey: process.env.STRIPE_TEST_API_KEY,
    maxNetworkRetries: 3,
    timeout: 20000,
    apiVersion: '2019-02-19',
    port: 8080
  })

  fastify.ready(errors => {
    t.error(errors)

    t.ok(fastify.stripe)
    t.ok(fastify.stripe.balance)
    t.ok(fastify.stripe.customers)

    t.equal(fastify.stripe._api.maxNetworkRetries, 3)
    t.equal(fastify.stripe._api.timeout, 20000)
    t.equal(fastify.stripe._api.version, '2019-02-19')
    t.equal(fastify.stripe._api.port, 8080)

    fastify.close()
  })
})

test('fastify.stripe.test namespace should exist', t => {
  t.plan(5)

  const fastify = Fastify()

  fastify.register(fastifyStripe, {
    apiKey: process.env.STRIPE_TEST_API_KEY,
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
    apiKey: process.env.STRIPE_TEST_API_KEY,
    maxNetworkRetries: 3,
    timeout: 20000,
    apiVersion: '2019-02-19'
  })

  fastify.ready(errors => {
    t.error(errors)

    t.ok(fastify.stripe)
    t.ok(fastify.stripe.customers)

    fastify.stripe.customers.create({ email: 'demo@demo.tld' }, function (err, customers) {
      if (err) {
        t.fail()
      }

      t.type(customers, 'object')
      t.equal(customers.object, 'customer')
      t.pass()
    })

    fastify.close()
  })
})

test('Should create a new stripe customer with multiple named Stripe instance', t => {
  t.plan(9)

  const fastify = Fastify()

  fastify
    .register(fastifyStripe, {
      name: 'prod',
      apiKey: process.env.STRIPE_TEST_API_KEY
    })
    .register(fastifyStripe, {
      name: 'test',
      apiKey: process.env.STRIPE_TEST_API_KEY,
      maxNetworkRetries: 3,
      timeout: 20000
    })

  fastify.ready(errors => {
    t.error(errors)

    t.ok(fastify.stripe)
    t.ok(fastify.stripe.test.customers)

    fastify.stripe.test.customers.create({ email: 'demo@demo.tld' }, function (err, customers) {
      if (err) {
        t.fail()
      }
      t.type(customers, 'object')
      t.equal(customers.object, 'customer')
      t.pass()
    })

    fastify.stripe.prod.customers.create({ email: 'demo@demo.tld' })
      .then(customers => {
        t.type(customers, 'object')
        t.equal(customers.object, 'customer')
        t.pass()
      })
      .catch(() => t.fail())

    fastify.close()
  })
})

test('fastify.stripe.test should throw with duplicate connection names', t => {
  t.plan(1)

  const fastify = Fastify()
  const name = 'test'

  fastify
    .register(fastifyStripe, {
      apiKey: process.env.STRIPE_TEST_API_KEY,
      name
    })
    .register(fastifyStripe, {
      apiKey: process.env.STRIPE_TEST_API_KEY,
      name
    })

  fastify.ready(errors => {
    t.equal(errors.message, `Stripe '${name}' instance name has already been registered`)
  })
})

test('Should throw if registered without an API key', t => {
  t.plan(1)

  const fastify = Fastify()

  fastify.register(fastifyStripe)

  fastify.ready(errors => {
    t.equal(errors.message, 'You must provide a Stripe API key')
  })
})

test('Should not throw if registered within different scopes (with and without named instances)', t => {
  t.plan(2)

  const fastify = Fastify()

  fastify.register(function scopeOne (instance, opts, next) {
    instance.register(fastifyStripe, {
      apiKey: process.env.STRIPE_TEST_API_KEY
    })

    next()
  })

  fastify.register(function scopeTwo (instance, opts, next) {
    instance.register(fastifyStripe, {
      apiKey: process.env.STRIPE_TEST_API_KEY,
      name: 'test'
    })

    instance.register(fastifyStripe, {
      apiKey: process.env.STRIPE_TEST_API_KEY,
      name: 'anotherTest'
    })

    next()
  })

  fastify.ready(errors => {
    t.error(errors)
    t.equal(errors, undefined)
  })
})

test('Should throw when trying to register multiple instances without giving a name', t => {
  t.plan(1)

  const fastify = Fastify()

  fastify
    .register(fastifyStripe, {
      apiKey: process.env.STRIPE_TEST_API_KEY
    })
    .register(fastifyStripe, {
      apiKey: process.env.STRIPE_TEST_API_KEY
    })

  fastify.ready(errors => {
    t.equal(errors.message, 'fastify-stripe has already been registered')
  })
})
