var express = require('express');
var router = express.Router();

module.exports = function mount(userAPI) {

  router.get('/testbench', function (req, res, next) {
    res.render('testbench', {});
  });

  return router;
}
