var express = require('express');
var router = express.Router();

module.exports = function mount(app) {

  router.get('/testbench', function (req, res, next) {
    res.render('testbench', {});
  });

  return router;
}
