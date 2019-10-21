var express = require('express');
var router = express.Router();
const {
  getUserForRequestMiddleware
} = require('../modules/antisocial-users/lib/get-user-for-request-middleware');

module.exports = function mount(userAPI) {

  router.get('/', getUserForRequestMiddleware(userAPI), function (req, res, next) {
    res.render('index', {
      user: req.antisocialUser
    });
  });

  return router;
}
