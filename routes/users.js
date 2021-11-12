var express = require('express');
var router = express.Router();
var registerController = require('../http/controllers/auth/registerController');
var loginController = require('../http/controllers/auth/loginController');
var Auth = require('../http/middleware/authentication');
var logoutController = require('../http/controllers/auth/logoutController');
var passwordController = require('../http/controllers/auth/passwordController');
var emailVerifyController = require('../http/controllers/auth/emailVerifyController');
var profileController = require('../http/controllers/auth/profileController');
var deleteUserController = require('../http/controllers/auth/deleteUserController');
var multer  = require('multer')
let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/avatars')
    },
    filename: function (req, file, cb) {
        let extArray = file.mimetype.split("/");
        let extension = extArray[extArray.length - 1];
        cb(null, file.fieldname + '-' + Date.now()+ '.' +extension)
    }
})
const upload = multer({ storage: storage })

router.get('/register', registerController.registerForm);
router.post('/register', Auth.rateLimiter, registerController.register);

router.get('/login', loginController.loginForm);
router.post('/login', Auth.rateLimiter, loginController.login);
router.post('/logout',Auth.routeAuth, logoutController.logout);

router.get('/sendResetPassword', passwordController.sendResetPasswordForm);
router.post('/sendResetPassword', Auth.rateLimiter, passwordController.sendResetPassword);
router.get('/confirmResetPasswordForm', Auth.rateLimiter, passwordController.confirmResetPasswordForm);
router.post('/confirmResetPassword', Auth.rateLimiter, passwordController.confirmResetPassword);

router.get('/resetPassword/email', passwordController.resetPasswordForm);
router.post('/resetPassword', Auth.rateLimiter, passwordController.resetPassword);

router.post('/sendEmailVerify',Auth.routeAuth, Auth.rateLimiter, emailVerifyController.sendEmailVerifyAgain);
router.get('/emailVerifyForm/', emailVerifyController.emailVerifyForm);
router.post('/verify/email', emailVerifyController.verifyEmail);

router.get('/deleteUser', Auth.routeAuth, deleteUserController.deleteUserForm);
router.post('/deleteUser', Auth.routeAuth, Auth.rateLimiter, deleteUserController.deleteUser);

router.get('/profile', Auth.routeAuth, profileController.profileForm);
router.post('/profile',Auth.routeAuth, Auth.rateLimiter, profileController.profile);


router.get('/updatePassword',Auth.routeAuth, passwordController.updatePasswordForm);
router.post('/updatePassword',Auth.routeAuth, Auth.rateLimiter, passwordController.updatePassword);

module.exports = router;
