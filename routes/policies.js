var express = require('express')
var router = express.Router()

module.exports = function mount (app) {
  router.get('/policies', function (req, res, next) {
    res.render('policies', {})
  })

  return router
}
