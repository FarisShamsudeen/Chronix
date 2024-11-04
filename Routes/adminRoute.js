const express = require('express')
const router = express.Router()
const adminController = require('../Controller/adminController')
const { upload } = require('../Controller/adminController');


router.get('/login', adminController.adminLogin)
router.post('/login', adminController.adminLoginPost)
router.get('/dashboard', adminController.adminDashboard)
router.get('/users', adminController.adminUsers)
router.post('/users/:userId/toggle-status', adminController.toggleUserStatus);
router.get('/orders', adminController.adminOrders)
router.get('/products', adminController.adminProducts)
router.post('/products/:productId/toggle-status', adminController.toggleProductStatus);
router.get('/products/add-product', adminController.addProductGet)
router.post('/products/add-product', upload.array('product_image', 3), adminController.addProductPost);
router.get('/products/edit-product/:productId', adminController.editProductGet);
router.post('/products/edit-product/:productId', upload.array('product_image', 3), adminController.editProductPost);
router.get('/categories', adminController.adminCategories)
router.post('/categories/:categoryId/toggle-status', adminController.toggleCategoryStatus);
router.post('/categories/add-category', adminController.addCategory);
router.post('/categories/edit-category/:id', adminController.editCategory);
router.post('/categories/delete-category/:id', adminController.deleteCategory);
router.get('/offers', adminController.adminOffers)
router.get('/payments', adminController.adminPayments)
router.get('/coupons', adminController.adminCoupons)
router.get('/profile', adminController.adminProfile)
router.get('/logout', adminController.adminLogout)


module.exports = router