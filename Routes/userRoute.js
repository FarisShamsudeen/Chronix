const express = require('express')
const router = express.Router();
const userController = require('../Controller/userController')
const userAuth = require('../Middlewares/userAuth')
const passport = require('passport');




router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/signup'}), (req,res) => {
    req.session.user = req.user;
    res.redirect('/')
} )


router.get('/download-image/:orderId', userAuth.isLoginUser, userController.downloadImage)
router.get('/download-pdf/:orderId', userAuth.isLoginUser, userController.downloadPDF)
router.post('/create-paypal-order', userAuth.isLoginUser, userController.createPaypalOrder);
router.post('/paypal/capture-order', userAuth.isLoginUser, userController.capturePaypalOrder);
router.get('/', userController.loadUserHome)
router.get('/login', userAuth.isLogoutUser, userController.loadUserLogin)
router.post('/login', userAuth.isLogoutUser, userController.loginUser)
router.get('/signup', userAuth.isLogoutUser, userController.loadUserSignup)
router.post('/signup', userAuth.isLogoutUser, userController.registerUser)
router.get('/otp', userAuth.isLogoutUser, userController.loadUserOtp)
router.post('/otp', userAuth.isLogoutUser, userController.postOtp)
router.get('/resend-otp', userAuth.isLogoutUser, userController.resendOtp)
router.get('/verifyEmail', userAuth.isLogoutUser, userController.loadUserVerifyEmail)
router.post('/verifyEmail',userAuth.isverifyingEmail, userController.verifyEmail)
router.get('/otp-reset-password', userAuth.isverifyingEmail, userAuth.emailVerified, userController.loadverifyOtpResetPassword)
router.post('/otp-reset-password', userAuth.isverifyingEmail, userAuth.emailVerified, userController.verifyOtpResetPassword)
router.get('/reset-password',userAuth.isverifyingEmail, userAuth.emailVerified, userController.loadResetPassword)
router.post('/reset-password', userAuth.isverifyingEmail, userAuth.emailVerified, userController.resetPassword)
router.get('/explore', userController.loadUserExplore)
router.get('/products', userController.getProducts);
// router.post('/filter', userAuth.isLoginUser, userAuth.isLoginUser, userController.filterProducts);
router.get('/product/:productId', userController.loadUserProduct)
router.get('/cart', userAuth.isLoginUser, userController.loadUserCart)
router.post('/cart/:userId/add/:productId', userAuth.isLoginUser, userController.addToCart)
router.post('/cart/:userId/increase/:itemId', userAuth.isLoginUser, userController.increaseQuantity);
router.post('/cart/:userId/decrease/:itemId', userAuth.isLoginUser, userController.decreaseQuantity);
router.post('/cart/:userId/remove/:itemId', userAuth.isLoginUser, userController.removeCartItem);
router.get('/checkout', userAuth.isLoginUser, userController.loadUserCheckout)
router.get('/paypalCredentials/:Email/:Password', userController.getPaypalCredentials);
router.post('/profile/:userId/checkout/addNewAddress', userAuth.isLoginUser, userController.addNewAddressCheckout);
router.post('/profile/:userId/checkout/editAddress', userAuth.isLoginUser, userController.editAddressCheckout);
router.post('/apply-coupon', userAuth.isLoginUser, userController.applyCoupon);
router.post('/remove-coupon', userAuth.isLoginUser, userController.removeCoupon);
router.post('/checkout/submitOrder', userAuth.isLoginUser, userController.submitOrder);
router.get('/paypal-success', userAuth.isLoginUser, userController.handlePaypalSuccess);
router.get('/orderSuccess', userAuth.isLoginUser, userController.orderSuccess);
router.get('/orders', userAuth.isLoginUser, userController.loadUserOrders)
router.get('/orders/invoice/:orderId', userAuth.isLoginUser, userController.loadUserInvoice)
router.post('/cancel-order/:orderId', userAuth.isLoginUser, userController.cancelOrder);
router.post('/return-order-request/:orderId', userAuth.isLoginUser, userController.returnOrderRequest);
router.get('/orderCancel', userAuth.isLoginUser, userController.orderCancel); 
router.get('/wishlist/', userAuth.isLoginUser, userController.loadUserWishlist)
router.post('/wishlist/toggleWishlistItem/:productId', userAuth.isLoginUser, userController.toggleWishlistItem);
router.post('/wishlist/removeWishlistItem/:itemId', userAuth.isLoginUser, userController.removeWishlistItem);
router.post('/wishlist/addWishlistItem/:productId', userAuth.isLoginUser, userController.addWishlistItem);
router.get('/profile', userAuth.isLoginUser, userController.loadUserProfile)
router.post('/profile/:userId/resetPasswordBySession', userAuth.isLoginUser, userController.resetPasswordBySession)
router.post('/profile/:userId/updateName', userAuth.isLoginUser, userController.updateName)
router.post('/profile/:userId/setDefault', userAuth.isLoginUser, userController.setDefaultAddress);
router.post('/profile/:userId/addNewAddress', userAuth.isLoginUser, userController.addNewAddress);
router.get('/getDistricts/:state', userAuth.isLoginUser, userController.getDistricts);
router.post('/profile/:userId/editAddress', userAuth.isLoginUser, userController.editAddress);
router.post('/profile/:userId/deleteAddress/:addressId', userAuth.isLoginUser, userController.deleteAddress);
router.get('/reviews', userAuth.isLoginUser, userController.loadUserReviews)
router.get('/wallet', userAuth.isLoginUser, userController.loadUserWallet)
router.get('/logout', userAuth.isLoginUser, userController.logoutUser)

module.exports = router