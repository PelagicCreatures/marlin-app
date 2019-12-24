const VError = require('verror').VError
const debug = require('debug')('antisocial-user')
const async = require('async')
const csrf = require('csurf')
const express = require('express')
const getAdmin = require('../lib/admin').getAdmin

const {
  validatePayload
} = require('../lib/validator-extensions')

const csrfProtection = csrf({
  cookie: {
    signed: true,
    httpOnly: true
  },
  ignoreMethods: process.env.TESTING ? ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE'] : []
})

module.exports = (usersApp) => {
  debug('mounting users API /login')

  const db = usersApp.db
  const createToken = require('../lib/create-token.js')(usersApp)
  const passwordMatch = require('../lib/password-match.js')

  usersApp.router.put('/login', express.json(), csrfProtection, function (req, res) {
    debug('/login')

    const validators = getAdmin('User').getValidations()

    const errors = validatePayload(req.body, {
      email: validators.email,
      password: {
        isPassword: true
      }
    }, {
      strict: true,
      additionalProperties: ['_csrf']
    })

    if (errors.length) {
      return res
        .status(422)
        .json({
          status: 'error',
          flashLevel: 'danger',
          flashMessage: 'Failed - invalid input.',
          errors: errors
        })
    }

    var ip = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'] : req.connection.remoteAddress

    if (Object.prototype.toString.call(ip) === '[object Array]') {
      ip = ip[0]
    } else {
      ip = ip.split(', ')[0]
    }

    async.waterfall([
      function (cb) {
        db.getInstances('User', {
          where: {
            email: req.body.email
          }
        }, function (err, userInstances) {
          if (err) {
            return cb(err)
          }

          if (!userInstances || userInstances.length !== 1) {
            return cb(new VError('user not found'))
          }

          var user = userInstances[0]
          cb(null, user)
        })
      },
      function (user, cb) {
        passwordMatch(req.body.password, user, function (err, isMatch) {
          if (err) {
            return cb(err)
          }

          if (!isMatch) {
            return cb(new VError('password mismatch'))
          }

          cb(null, user)
        })
      },
      function (user, cb) {
        createToken(user, {
          ip: ip
        }, function (err, token) {
          cb(err, user, token)
        })
      }
    ], function (err, user, token) {
      if (err) {
        return res.status(401).json({
          status: 'error',
          flashLevel: 'danger',
          flashMessage: 'Login failed',
          errors: [err.message]
        })
      }

      // if we use subscriptions manage the 'subscriber' cookie
      if (process.env.STRIPE_SECRET) {
        if (user.stripeStatus === 'ok') {
          res.cookie('subscriber', 1, {
            path: '/'
          })
        } else {
          if (req.cookies.subscriber) {
            res.clearCookie('subscriber', {
              path: '/'
            })
          }
        }
      }

      res.cookie('access-token', token.token, {
        path: '/',
        maxAge: token.ttl * 1000,
        signed: true,
        httpOnly: true
      })
        .cookie('logged-in', 1, {
          path: '/',
          maxAge: token.ttl * 1000
        })
        .send({
          status: 'ok',
          flashLevel: 'success',
          flashMessage: 'Hello Again!',
          didLogin: true,
          result: {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            validated: user.validated
          }
        })
    })
  })
}
