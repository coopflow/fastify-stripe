'use strict'

const fp = require('fastify-plugin')

function fastifyStripe (fastify, options, next) {
  if (!options.api_key) {
    return next(new Error('You must provide a Stripe API key'))
  }

  const stripe = require('stripe')(options.api_key)

  stripe.setAppInfo({
    name: 'fastify-stripe',
    url: 'https://github.com/coopflow/fastify-stripe',
    version: require('./package.json').version
  })

  if (options.maxNetworkRetries) {
    stripe.setMaxNetworkRetries(options.maxNetworkRetries)
  }

  if (options.timeout) {
    stripe.setTimeout(options.timeout)
  }

  if (options.version) {
    stripe.setApiVersion(options.version)
  }

  const name = options.name
  delete options.name

  if (name) {
    if (!fastify.stripe) {
      fastify.decorate('stripe', {})
    }

    if (fastify.stripe[name]) {
      return next(new Error(`Stripe '${name}' instance name has already been registered`))
    }

    fastify.stripe[name] = stripe
  } else {
    if (fastify.stripe) {
      return next(new Error('fastify-stripe has already been registered'))
    } else {
      fastify.decorate('stripe', stripe)
    }
  }

  next()
}

module.exports = fp(fastifyStripe, {
  fastify: '>=1.1.0',
  name: 'fastify-stripe'
})
