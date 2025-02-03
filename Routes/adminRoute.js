const express = require('express')
const router = express.Router()
const userAuth = require('../Middlewares/userAuth')
const adminController = require('../Controller/adminController')
const { upload } = require('../Controller/adminController');
 

router.get('/', userAuth.isLogoutAdmin, adminController.adminLogin)
router.post('/login', userAuth.isLogoutAdmin, adminController.adminLoginPost)
router.get('/dashboard', userAuth.isLoginAdmin, adminController.adminDashboard)
router.post('/sales-report/filter', userAuth.isLoginAdmin, adminController.filterSalesReport);
router.get('/users', userAuth.isLoginAdmin, adminController.adminUsers)
router.post('/users/:userId/toggle-status', userAuth.isLoginAdmin, adminController.toggleUserStatus);
router.get('/orders', userAuth.isLoginAdmin, adminController.adminOrders)
router.put('/orders/:orderId/status', userAuth.isLoginAdmin, adminController.updateDeliveryStatus);
router.get('/return-requests', userAuth.isLoginAdmin, adminController.adminReturnRequests)
router.get('/all-return-requests', userAuth.isLoginAdmin, adminController.adminNotifications)
router.post('/all-return-requests/accept/:requestId', userAuth.isLoginAdmin, adminController.acceptReturnRequest);
router.post('/all-return-requests/reject/:requestId', userAuth.isLoginAdmin, adminController.rejectReturnRequest);
router.get('/products', userAuth.isLoginAdmin, adminController.adminProducts)
router.post('/products/:productId/toggle-status', userAuth.isLoginAdmin, adminController.toggleProductStatus);
router.get('/products/add-product', userAuth.isLoginAdmin, adminController.addProductGet)
router.post('/products/add-product', upload.array('product_image', 3), adminController.addProductPost);
router.get('/products/edit-product/:productId', userAuth.isLoginAdmin, adminController.editProductGet);
router.post('/products/edit-product/:productId', upload.array('product_image', 3), adminController.editProductPost);
router.post('/update-product-image', upload.single('image'), userAuth.isLoginAdmin, adminController.updateImage )
router.get('/categories', userAuth.isLoginAdmin, adminController.adminCategories)
router.post('/categories/:categoryId/toggle-status', userAuth.isLoginAdmin, adminController.toggleCategoryStatus);
router.post('/categories/add-category', userAuth.isLoginAdmin, adminController.addCategory);
router.post('/categories/edit-category/:id', userAuth.isLoginAdmin, adminController.editCategory);
router.post('/categories/delete-category/:id', userAuth.isLoginAdmin, adminController.deleteCategory);
router.get('/offers', userAuth.isLoginAdmin, adminController.adminOffers)
router.get('/offers/categories-without-offers', userAuth.isLoginAdmin, adminController.getCategoriesWithoutOffers)
router.post('/offers/add-category-offer', userAuth.isLoginAdmin, adminController.addCategoryOffer)
router.get('/offers/products-without-offers', userAuth.isLoginAdmin, adminController.getProductsWithoutOffers)
router.post('/offers/add-product-offer', userAuth.isLoginAdmin, adminController.addProductOffer)
router.post('/offers/:offerId/toggle-status', userAuth.isLoginAdmin, adminController.toggleOfferStatus);
router.post('/offers/updateCategoryOffer/:offerId', userAuth.isLoginAdmin, adminController.updateCategoryOffer);
router.post('/offers/updateProductOffer/:offerId', userAuth.isLoginAdmin, adminController.updateProductOffer);
router.delete('/offers/deleteCategoryOffer/:offerId', userAuth.isLoginAdmin, adminController.deleteCategoryOffer);
router.delete('/offers/deleteProductOffer/:offerId', userAuth.isLoginAdmin, adminController.deleteProductOffer);
router.get('/payments', userAuth.isLoginAdmin, adminController.adminPayments)
router.get('/coupons', userAuth.isLoginAdmin, adminController.adminCoupons)
router.post('/coupons/add-coupon', userAuth.isLoginAdmin, adminController.addCoupon);
router.post('/coupons/:couponId/toggle-status', userAuth.isLoginAdmin, adminController.toggleCouponStatus);
router.put('/coupons/update-field/:couponId', userAuth.isLoginAdmin, adminController.updateField);
router.put('/coupons/update/:couponId', userAuth.isLoginAdmin, adminController.updateAllFields);
router.post('/coupons/delete/:couponId', userAuth.isLoginAdmin, adminController.deleteCoupon);
router.get('/profile', userAuth.isLoginAdmin, adminController.adminProfile)
router.get('/logout', userAuth.isLoginAdmin, adminController.adminLogout)


module.exports = router