'use strict'

const fp = require('fastify-plugin')
const fs = require('fs')
const path = require('path')

function fastifyStripe (fastify, options, next) {
  if (!options.apiKey) {
    return next(new Error('You must provide a Stripe API key'))
  }

  const name = options.name
  delete options.name

  const config = Object.assign(
    {
      appInfo: {
        name: 'fastify-stripe',
        url: 'https://github.com/coopflow/fastify-stripe',
        version: JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'))).version
      }
    },
    options
  )
  delete config.apiKey

  const stripe = require('stripe')(options.apiKey, config)

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
  fastify: '>=2.11.0',
  name: 'fastify-stripe'
})
