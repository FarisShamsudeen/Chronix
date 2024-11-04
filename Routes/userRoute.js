const express = require('express')
const router = express.Router()
const userController = require('../Controller/userController')
const userAuth = require('../Middlewares/userAuth')
const passport = require('passport');


router.get('/auth/google', userController.googleLogin);
router.get('/google/callback', userController.googleLoginCallback);


router.get('/home', userController.loadUserHome)
router.get('/login', userController.loadUserLogin)
router.post('/login', userController.loginUser)
router.get('/signup', userController.loadUserSignup)
router.post('/signup', userController.registerUser)
router.get('/otp', userController.loadUserOtp)
router.post('/otp', userController.postOtp)
router.get('/resend-otp', userController.resendOtp)
router.get('/verifyEmail', userController.loadUserVerifyEmail)
router.post('/verifyEmail', userController.verifyEmail)
router.get('/otp-reset-password', userController.loadverifyOtpResetPassword)
router.post('/otp-reset-password', userController.verifyOtpResetPassword)
router.get('/reset-password', userController.loadResetPassword)
router.post('/reset-password', userController.resetPassword)
router.get('/explore', userController.loadUserExplore)
router.get('/product', userController.loadUserProduct)
router.get('/cart', userController.loadUserCart)
router.get('/checkout', userController.loadUserCheckout)
router.get('/orders', userController.loadUserOrders)
router.get('/wishlist', userController.loadUserWishlist)
router.get('/profile', userController.loadUserProfile)
router.get('/reviews', userController.loadUserReviews)
router.get('/wallet', userController.loadUserWallet)



module.exports = router