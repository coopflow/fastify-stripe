'use strict'

const { test } = require('tap')
const Fastify = require('fastify')
const fastifyStripe = require('../plugin')

require('dotenv').config()

test('fastify.stripe namespace should exist', async (t) => {
  t.plan(7)

  const fastify = Fastify()
  t.teardown(fastify.close.bind(fastify))

  await fastify.register(fastifyStripe, {
    apiKey: process.env.STRIPE_TEST_API_KEY,
    apiVersion: '2020-08-27',
    maxNetworkRetries: 3,
    timeout: 20000,
    port: 8080
  })

  await fastify.ready()

  t.ok(fastify.stripe)
  t.ok(fastify.stripe.balance)
  t.ok(fastify.stripe.customers)

  t.equal(fastify.stripe._api.maxNetworkRetries, 3)
  t.equal(fastify.stripe._api.timeout, 20000)
  t.equal(fastify.stripe._api.version, '2020-08-27')
  t.equal(fastify.stripe._api.port, 8080)
})

test('fastify.stripe.test namespace should exist', async (t) => {
  t.plan(4)

  const fastify = Fastify()
  t.teardown(fastify.close.bind(fastify))

  await fastify.register(fastifyStripe, {
    apiKey: process.env.STRIPE_TEST_API_KEY,
    name: 'test'
  })

  await fastify.ready()

  t.ok(fastify.stripe)
  t.ok(fastify.stripe.test)
  t.ok(fastify.stripe.test.balance)
  t.ok(fastify.stripe.test.customers)
})

test('fastify-stripe should create and then delete a new stripe customer with a singular Stripe instance', async (t) => {
  t.test('using callback syntax', (t) => {
    t.plan(7)

    const fastify = Fastify()
    t.teardown(fastify.close.bind(fastify))

    fastify.register(fastifyStripe, {
      apiKey: process.env.STRIPE_TEST_API_KEY,
      apiVersion: '2020-08-27',
      maxNetworkRetries: 3,
      timeout: 20000
    })

    fastify.ready((err) => {
      if (err) t.error(err)

      t.ok(fastify.stripe)
      t.ok(fastify.stripe.customers)

      fastify.stripe.customers.create({ email: 'demo@demo.tld' }, function (err, customer) {
        if (err) t.error(err)

        t.type(customer, 'object')
        t.equal(customer.object, 'customer')

        fastify.stripe.customers.del(customer.id, function (err, deletedCustomer) {
          if (err) t.error(err)

          t.type(deletedCustomer, 'object')
          t.equal(deletedCustomer.object, 'customer')
          t.equal(deletedCustomer.deleted, true)
        })
      })
    })
  })

  t.test('using Promises syntax', (t) => {
    t.plan(7)

    const fastify = Fastify()
    t.teardown(fastify.close.bind(fastify))

    fastify.register(fastifyStripe, {
      apiKey: process.env.STRIPE_TEST_API_KEY,
      apiVersion: '2020-08-27',
      maxNetworkRetries: 3,
      timeout: 20000
    })

    fastify.ready((err) => {
      if (err) t.error(err)

      t.ok(fastify.stripe)
      t.ok(fastify.stripe.customers)

      fastify.stripe.customers
        .create({ email: 'demo@demo.tld' })
        .then((customer) => {
          t.type(customer, 'object')
          t.equal(customer.object, 'customer')

          fastify.stripe.customers
            .del(customer.id)
            .then((deletedCustomer) => {
              t.type(deletedCustomer, 'object')
              t.equal(deletedCustomer.object, 'customer')
              t.equal(deletedCustomer.deleted, true)
            })
            .catch((err) => t.error(err))
        })
        .catch((err) => t.error(err))
    })
  })

  t.test('using async/await syntax', async (t) => {
    t.plan(9)

    const fastify = Fastify()
    t.teardown(fastify.close.bind(fastify))

    await fastify.register(fastifyStripe, {
      apiKey: process.env.STRIPE_TEST_API_KEY,
      apiVersion: '2020-08-27',
      maxNetworkRetries: 3,
      timeout: 20000
    })

    t.ok(fastify.stripe)
    t.ok(fastify.stripe.customers)

    fastify.get('/', async (request, reply) => {
      const customer = await fastify.stripe.customers.create({ email: 'demo@demo.tld' })
      t.type(customer, 'object')
      t.equal(customer.object, 'customer')

      const deletedCustomer = await fastify.stripe.customers.del(customer.id)
      t.type(deletedCustomer, 'object')
      t.equal(deletedCustomer.object, 'customer')
      t.equal(deletedCustomer.deleted, true)

      return { message: 'ok' }
    })

    await fastify.ready()

    const response = await fastify.inject({
      method: 'GET',
      path: '/'
    })

    t.equal(response.statusCode, 200)
    t.equal(JSON.parse(response.payload).message, 'ok')
  })
})

test('fastify-stripe should create and then delete a new stripe customer with multiple named Stripe instance', (t) => {
  t.plan(16)

  const fastify = Fastify()
  t.teardown(fastify.close.bind(fastify))

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

  fastify.get('/test', (request, reply) => {
    fastify.stripe.test.customers
      .create({ email: 'demo@demo.tld' }, function (err, customer) {
        if (err) t.error(err)

        t.type(customer, 'object')
        t.equal(customer.object, 'customer')

        fastify.stripe.test.customers
          .del(customer.id, function (err, deletedCustomer) {
            if (err) t.error(err)

            t.type(deletedCustomer, 'object')
            t.equal(deletedCustomer.object, 'customer')
            t.equal(deletedCustomer.deleted, true)
          })
      })

    reply.send({ message: 'test is ok' })
  })

  fastify.get('/prod', (request, reply) => {
    fastify.stripe.prod.customers
      .create({ email: 'demo@demo.tld' })
      .then((customer) => {
        t.type(customer, 'object')
        t.equal(customer.object, 'customer')

        fastify.stripe.prod.customers
          .del(customer.id)
          .then((deletedCustomer) => {
            t.type(deletedCustomer, 'object')
            t.equal(deletedCustomer.object, 'customer')
            t.equal(deletedCustomer.deleted, true)
          })
          .catch((err) => t.error(err))
      })
      .catch((err) => t.error(err))

    reply.send({ message: 'prod is ok' })
  })

  fastify.ready((err) => {
    if (err) t.error(err)

    t.ok(fastify.stripe)
    t.ok(fastify.stripe.test.customers)

    fastify.inject({
      method: 'GET',
      path: '/test'
    }).then((response) => {
      t.equal(response.statusCode, 200)
      t.equal(JSON.parse(response.payload).message, 'test is ok')
    }).catch((err) => t.error(err))

    fastify.inject({
      method: 'GET',
      path: '/prod'
    }).then((response) => {
      t.equal(response.statusCode, 200)
      t.equal(JSON.parse(response.payload).message, 'prod is ok')
    }).catch((err) => t.error(err))
  })
})

test('fastify.stripe.test should throw with duplicate connection names', async (t) => {
  t.plan(2)

  const name = 'test'

  const fastify = Fastify()
  t.teardown(fastify.close.bind(fastify))

  fastify
    .register(fastifyStripe, {
      apiKey: process.env.STRIPE_TEST_API_KEY,
      name
    })
    .register(fastifyStripe, {
      apiKey: process.env.STRIPE_TEST_API_KEY,
      name
    })

  try {
    await fastify.ready()
  } catch (err) {
    t.ok(err)
    t.equal(err.message, `Stripe '${name}' instance name has already been registered`)
  }
})

test('fastify-stripe should throw if registered without an API key', async (t) => {
  t.plan(2)

  const fastify = Fastify()
  t.teardown(fastify.close.bind(fastify))

  fastify.register(fastifyStripe)

  try {
    await fastify.ready()
  } catch (err) {
    t.ok(err)
    t.equal(err.message, 'You must provide a Stripe API key')
  }
})

test('fastify-stripe should throw when trying to register an instance with a reserved `name` keyword', async (t) => {
  t.plan(2)

  const name = 'customers'

  const fastify = Fastify()
  t.teardown(fastify.close.bind(fastify))

  fastify.register(fastifyStripe, {
    apiKey: process.env.STRIPE_TEST_API_KEY,
    name
  })

  try {
    await fastify.ready()
  } catch (err) {
    t.ok(err)
    t.equal(err.message, `fastify-stripe '${name}' is a reserved keyword`)
  }
})

test('fastify-stripe should not throw if registered within different scopes (with and without named instances)', (t) => {
  t.plan(2)

  const fastify = Fastify()
  t.teardown(fastify.close.bind(fastify))

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

  fastify.ready((err) => {
    t.error(err)
    t.equal(err, undefined)
  })
})

test('fastify-stripe should throw when trying to register multiple instances without giving a name', async (t) => {
  t.plan(2)

  const fastify = Fastify()
  t.teardown(fastify.close.bind(fastify))

  fastify
    .register(fastifyStripe, {
      apiKey: process.env.STRIPE_TEST_API_KEY
    })
    .register(fastifyStripe, {
      apiKey: process.env.STRIPE_TEST_API_KEY
    })

  try {
    await fastify.ready()
  } catch (err) {
    t.ok(err)
    t.equal(err.message, 'fastify-stripe has already been registered')
  }
})
