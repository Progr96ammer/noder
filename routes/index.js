var express = require('express');
var router = express.Router();
var Auth = require('../http/middleware/authentication');
var homeController = require('../http/controllers/homeController');

router.get('/', homeController.index);
router.get('/home',Auth.routeAuth,Auth.checkEmailVerify, homeController.home);

module.exports = router;
