# fastify-stripe

[![NPM version](https://img.shields.io/npm/v/fastify-stripe.svg?style=flat)](https://www.npmjs.com/package/fastify-stripe)
[![GitHub CI](https://github.com/coopflow/fastify-stripe/workflows/GitHub%20CI/badge.svg)](https://github.com/coopflow/fastify-stripe/actions?workflow=GitHub+CI)
[![Build Status](https://travis-ci.com/coopflow/fastify-stripe.svg?branch=master)](https://travis-ci.com/coopflow/fastify-stripe)
[![Coverage Status](https://coveralls.io/repos/github/coopflow/fastify-stripe/badge.svg?branch=master)](https://coveralls.io/github/coopflow/fastify-stripe?branch=master)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)

[Stripe Node.js Library](https://github.com/stripe/stripe-node) instance initialization and encapsulation in [fastify](https://github.com/fastify/fastify) framework.

## Install

Install the package with:
```sh
npm i stripe fastify-stripe --save
```


## Usage

The package needs to be added to your project with `register` and you must at least configure your account's secret key wich is available in your [Stripe Dashboard](https://dashboard.stripe.com/account/apikeys) then call the [Stripe](https://github.com/stripe/stripe-node) API and you are done.
```js
const fastify = require('fastify')({ logger: true })

fastify.register(require('fastify-stripe'), {
  apiKey: 'sk_test_...'
})

fastify.get('/customers/add', async (request, reply) => {
  const { stripe } = fastify
  const email = 'customer@exemple.com'

  try {
    // We create a new customer using Stripe API
    const customers = await stripe.customers.create({ email })

    reply.code(201)
    return {
      status: 'ok',
      message: `customer ${email} succesfully added`,
      customers
    }
  } catch (errors) {
    reply.code(500)
    return errors
  }
})

fastify.listen(3000, err => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})
```

and it works using `Promises` too:
```js
const fastify = require('fastify')({ logger: true })

fastify.register(require('fastify-stripe'), {
  apiKey: 'sk_test_...'
})

fastify.get('/customers/add', function (request, reply) {
  const { stripe } = fastify
  const email = 'customer@exemple.com'

  // We create a new customer using Stripe API
  stripe.customers.create({ email })
    .then(customers => {
      reply
        .code(201)
        .send({
          status: 'ok',
          message: `customer ${email} succesfully added`,
          customers
        })
    })
    .catch(errors => {
      reply
        .code(500)
        .send(errors)
    })
})

fastify.listen(3000, function (err) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})
```

### Options

* `apiKey` **[ required ]**: Your account's secret key wich is available in your [Stripe Dashboard](https://dashboard.stripe.com/account/apikeys)


* `name` **[ optional ]**: Through this option `fastify-stripe` lets you define multiple Stripe singular instances (with different options parameters if you wish) that you can later use in your application.
```js
const fastify = require('fastify')({ logger: true })

fastify
  .register(require('fastify-stripe'), {
    apiKey: 'sk_test_...',
    name: 'test',
    timeout: 240000 // in ms (this is 24 seconds)
  })
  .register(require('fastify-stripe'), {
    apiKey: 'sk_prod_...',
    name: 'prod'
  })

fastify.get('/customers/test/add', async (request, reply) => {
  const { stripe } = fastify
  const email = 'customer@exemple.com'

  try {
    // We create a new customer using the singular Stripe test instance
    // This instance has a request timeout of 4 minutes
    // and uses a Stripe test API key
    const customers = await stripe['test'].customers.create({ email })

    reply.code(201)
    return {
      status: 'ok',
      message: `customer ${email} succesfully added`,
      customers
    }
  } catch (errors) {
    reply.code(500)
    return errors
  }

fastify.get('/customers/prod/add', async (request, reply) => {
  const { stripe } = fastify
  const email = 'customer@exemple.com'

  try {
    // We create a new customer using the singular Stripe prod instance
    // This instance has the default request timeout of 2 minutes
    // and uses a Stripe production API key
    const customers = await stripe.prod.customers.create({ email })

    reply.code(201)
    return {
      status: 'ok',
      message: `customer ${email} succesfully added`,
      customers
    }
  } catch (errors) {
    reply.code(500)
    return errors
  }
})

fastify.listen(3000, err => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})
```

* `maxNetworkRetries` **[ optional ]**: Automatic network retries can be enabled with setMaxNetworkRetries. This will retry requests `n` times with exponential backoff if they fail due to an intermittent network problem. Idempotency keys are added where appropriate to prevent duplication. You can later change this on a per-request basis with the new Stripe API configuration object property [`maxNetworkRetries`](https://github.com/stripe/stripe-node#network-retries).
```js
// Retry this request once before giving up
fastify.stripe.customers.create(
  {
    email: 'customer@example.com'
  },
  {
    maxNetworkRetries: 1
  }
)
```

* `timeout` **[ optional ]**: The request timeout is configurable and must be expressed in `ms`. By default [Stripe Node.js Library](https://github.com/stripe/stripe-node) uses Node's default of 120 seconds (`{ timeout: 120000 }`). You can later change this on a per-request basis with the new Stripe API configuration object property [`timeout`](https://github.com/stripe/stripe-node#configuring-timeout).
```js
fastify.stripe.customers.create(
  {
    email: 'customer@example.com'
  },
  {
    timeout: 20000 // in ms (this is 20 seconds)
  }
)
```

* `apiVersion` **[ optional ]**: It is important for you to check what version of the Stripe REST API you're currently consuming ([via the dashboard](https://manage.stripe.com/account/apikeys)). You can explicitly set the version you wish to use like so: `{ apiVersion: '2020-08-27' }`. You can later change this on a per-request basis with the new Stripe API configuration object property [`apiVersion`](https://github.com/stripe/stripe-node/wiki/Migration-guide-for-v8#mark-all-setter-methods-as-deprecated-emit-warnings).
```js
fastify.stripe.customers.list({ apiVersion: '2020-08-27' })
```
*__Note__: You don't need to set a version explicitly. If you don't set it the Stripe REST API will use your account's default, which you can view under your dashboard (Account Settings » API Keys). Setting a version explicitly does not affect your account's default version. It'll only affect the API you consume through that singular stripe instance.*

*__Note for TypeScript users__: If you are a TypeScript user, we recommend upgrading your account's API Version to the latest version.
If you wish to remain on your account's default API version, you may pass `null` or another version instead of the latest version, and add a `@ts-ignore` comment here and anywhere the types differ between API versions.*

*You can see the other options in [Node Stripe config object initialization documentation](https://github.com/stripe/stripe-node#initialize-with-config-object).*

## Documentation

See the [Node Stripe API docs](https://stripe.com/docs/api/node#intro).

## Acknowledgements

This project is kindly sponsored by [coopflow](https://www.coopflow.com).


## License

Licensed under [MIT](https://github.com/coopflow/fastify-stripe/blob/master/LICENSE)
