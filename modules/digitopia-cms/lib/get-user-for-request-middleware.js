const debug = require('debug')('antisocial-user')
const VError = require('verror').VError
var cron = require('node-cron')
const Sequelize = require('sequelize')
const Op = Sequelize.Op

function getUserForRequestMiddleware (app) {
  const db = app.db

  function clearCookies (res, doAccessToken) {
    if (doAccessToken) {
      res.clearCookie('access-token', {
        path: '/',
        signed: true,
        httpOnly: true
      })

      res.clearCookie('logged-in', {
        path: '/'
      })
    }

    res.clearCookie('admin', {
      path: '/'
    })

    res.clearCookie('superuser', {
      path: '/'
    })

    if (process.env.STRIPE_SECRET) {
      res.clearCookie('subscriber', {
        path: '/'
      })
    }
  }

  // get token from headers or cookies and resolve the logged in user
  // if found set req.antisocialToken and req.antisocialUser for later use
  return function getUserForRequest (req, res, next) {
    var token

    if (req.cookies && req.cookies['access-token']) {
      token = req.cookies['access-token']
    }

    if (req.signedCookies && req.signedCookies['access-token']) {
      token = req.signedCookies['access-token']
    }

    if (req.body && req.body['access-token']) {
      token = req.body['access-token']
    }

    if (!token) {
      clearCookies(res, true)
      debug('getAuthenticatedUser no token in headers or cookies')
      return next()
    }

    debug('getAuthenticatedUser found token in header or cookies', token)

    db.getInstances('Token', {
      where: {
        token: token,
        type: 'access'
      }
    }, function (err, tokenInstances) {
      if (err) {
        debug('getAuthenticatedUser error finding token', err.message)
        return next()
      }
      if (!tokenInstances || tokenInstances.length !== 1) {
        clearCookies(res, true)
        debug('getAuthenticatedUser token not found', tokenInstances)

        return next()
      }

      validateToken(db, tokenInstances[0], function (err) {
        if (err) {
          clearCookies(res, true)
          return next()
        }

        db.getInstances('User', {
          where: {
            id: tokenInstances[0].userId
          },
          include: ['Roles']
        }, function (err, userInstances) {
          if (err) {
            return next()
          }
          if (!userInstances || userInstances.length !== 1) {
            return next()
          }

          req.antisocialToken = tokenInstances[0]
          req.antisocialUser = userInstances[0]

          clearCookies(res)

          if (req.antisocialUser.Roles) {
            for (let i = 0; i < req.antisocialUser.Roles.length; i++) {
              const role = req.antisocialUser.Roles[i]
              if (role.description === 'admin') {
                req.isAdmin = true
                res.cookie('admin', 1, {
                  path: '/'
                })
              }
              if (role.description === 'superuser') {
                req.isSuperUser = true
                req.isAdmin = true
                res.cookie('admin', 1, {
                  path: '/'
                })
                res.cookie('superuser', 1, {
                  path: '/'
                })
              }
            }
          }

          res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate, no-cache=Set-Cookie')
          res.header('Expires', '-1')
          res.header('Pragma', 'no-cache')

          // if we use subscriptions manage the 'subscriber' cookie
          if (process.env.STRIPE_SECRET) {
            if (req.antisocialUser.stripeStatus === 'ok') {
              res.cookie('subscriber', 1, {
                path: '/'
              })
            }
          }

          next()
        })
      })
    })
  }
}

// is the token valid?
function validateToken (db, token, cb) {
  const nowInSeconds = Math.round(new Date().getTime() / 1000)
  if (token.expires > nowInSeconds) {
    touchToken(db, token, function (err) {
      cb(err)
    })
  } else {
    debug('validateToken expired: %s %s', nowInSeconds, token.expires)
    db.deleteInstance('Token', token.id, function (err) {
      if (err) {
        return cb(new VError(err, 'token is expired'))
      }
      return cb(new VError('token is expired'))
    })
  }
}

// update lastaccess for rolling ttl
function touchToken (db, token, cb) {
  var now = Date.now()
  var accessed = new Date(token.lastaccess).getTime()
  var elapsedSeconds = (now - accessed) / 1000

  // only update once an hr.
  if (elapsedSeconds < 3600) {
    return setImmediate(cb)
  }

  debug('touchToken elapsed: %s', elapsedSeconds)

  const nowInSeconds = Math.round(new Date().getTime() / 1000)
  const expires = nowInSeconds + token.ttl

  db.updateInstance('Token', token.id, {
    lastaccess: new Date(),
    expires: expires
  }, function (err, updated) {
    if (err) {
      cb(new VError(err, 'touchToken failed'))
    }
    debug('touchToken %j', updated)
    cb()
  })
}

function expireTokens (usersAPI) {
  debug('starting token trash collection cron job')

  cron.schedule('0 */2 * * *', function () {
    const nowInSeconds = Math.round(new Date().getTime() / 1000)
    const query = {
      where: {
        expires: {
          [Op.lt]: nowInSeconds
        }
      }
    }
    debug('expireTokens query %j', query)
    usersAPI.db.getModel('Token').destroy(query)
      .then((result) => {
        debug('expireTokens %j', result)
      })
      .catch((err) => {
        debug('expireTokens error %j', err)
      })
  })
}

module.exports.getUserForRequestMiddleware = getUserForRequestMiddleware
module.exports.validateToken = validateToken
module.exports.expireTokens = expireTokens
