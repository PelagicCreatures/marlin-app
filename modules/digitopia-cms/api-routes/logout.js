const debug = require('debug')('antisocial-user')

const {
  getUserForRequestMiddleware
} = require('../lib/get-user-for-request-middleware')

module.exports = (usersApp) => {
  debug('mounting users API /logout')

  const db = usersApp.db

  usersApp.router.delete('/logout', getUserForRequestMiddleware(usersApp), function (req, res) {
    debug('/logout')

    var currentUser = req.antisocialUser
    if (!currentUser) {
      return res.status(401).json({
        status: 'error',
        errors: ['must be logged in']
      })
    }

    db.deleteInstance('Token', req.antisocialToken.id, function (err) {
      if (err) {
        return res.status(500).json({
          status: 'error',
          errors: [err.message]
        })
      }

      if (process.env.STRIPE_SECRET) {
        if (currentUser.stripeStatus === 'ok') {
          res.clearCookie('subscriber', {
            path: '/'
          })
        }
      }

      res.clearCookie('access-token', {
        path: '/',
        signed: true,
        httpOnly: true
      })
        .clearCookie('logged-in', {
          path: '/'
        })
        .send({
          status: 'ok',
          flashLevel: 'info',
          flashMessage: 'Bye.',
          didLogout: true
        })
    })
  })
}
