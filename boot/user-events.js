const debug = require('debug')('antisocial-db-events')

module.exports = (app) => {
  app.userAPI.on('didRegister', (user, post, cb) => {
    debug('didRegister event user: %j', user)
    cb()
  })

  // send confirmation email
  app.userAPI.on('sendEmailConfirmation', function (user, token) {
    debug('sendEmailConfirmation event user: %j token: %j', user, token)
  })

  // send password reset email
  app.userAPI.on('sendPasswordReset', function (user, token) {
    debug('sendPasswordReset user: %j token: %j', user, token)
  })

  app.db.on('db-create', function (table, instance) {
    debug('db-create %s instance id %s', table, instance.id)
  })

  app.db.on('db-update', function (table, instance) {
    debug('db-update %s instance id %s', table, instance.id)
  })

  app.db.on('db-delete', function (table, instance) {
    debug('db-delete %s instance id %s', table, instance.id)
  })
}
