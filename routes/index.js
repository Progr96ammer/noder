var express = require('express');
var router = express.Router();
var registerController = require('../http/controllers/auth/registerController');
var loginController = require('../http/controllers/auth/loginController');
var passwordController = require('../http/controllers/auth/passwordController');
var emailVerifyController = require('../http/controllers/auth/emailVerifyController');
var homeController = require('../http/controllers/homeController');
var logoutController = require('../http/controllers/auth/logoutController');
var profileController = require('../http/controllers/auth/profileController');
var deleteUserController = require('../http/controllers/auth/deleteUserController');
var jwt = require('jsonwebtoken');
var Auth = require('../http/middleware/authentication');
var User = require('../models/userModel');

router.get('/', homeController.index);
router.get('/register', registerController.registerForm);
router.post('/register', Auth.rateLimiter, registerController.register);

router.get('/login', loginController.loginForm);
router.post('/login', Auth.rateLimiter, loginController.login);

router.get('/deleteUser', Auth.routeAuth, deleteUserController.deleteUserForm);
router.post('/deleteUser', Auth.routeAuth, Auth.rateLimiter, deleteUserController.deleteUser);

router.get('/profile', Auth.routeAuth, profileController.profileForm);
router.post('/profile', Auth.rateLimiter, profileController.profile);


router.get('/sendResetPassword', passwordController.sendResetPasswordForm);
router.post('/sendResetPassword', Auth.rateLimiter, passwordController.sendResetPassword);

router.get('/resetpassword/email', passwordController.resetPasswordForm);
router.post('/resetPassword', Auth.rateLimiter, passwordController.resetPassword);

router.get('/updatePassword', passwordController.updatePasswordForm);
router.post('/updatePassword', Auth.rateLimiter, passwordController.updatePassword);

router.post('/sendEmailVerify', Auth.rateLimiter, emailVerifyController.sendEmailVerifyAgain);
router.get('/verify/email', emailVerifyController.verifyEmail);

router.get('/home',Auth.routeAuth, Auth.checkEmailVerify, homeController.home);


router.post('/logout',Auth.routeAuth, logoutController.logout);

module.exports = router;
