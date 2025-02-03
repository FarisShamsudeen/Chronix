const userSchema = require('../Model/userModel')
const categorySchema = require('../Model/categoryModel')
const productSchema = require('../Model/productModel')
const orderSchema = require('../Model/orderModel')
const couponSchema = require('../Model/couponModel')
const returnRequestSchema = require('../Model/returnRequestModel')
const walletSchema = require('../Model/walletModel')
const offerSchema = require('../Model/offerModel')
const cartSchema = require('../Model/cartModel')
const bcrypt = require('bcrypt')
const saltround = 10
const mongoose = require('mongoose')
const multer = require('multer');
const path = require('path');
const moment = require('moment');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

const adminLogin = async (req, res) => {
    try {
        res.render('./Admin/login.hbs')
    } catch (error) {
        res.status(400).send(error)
    }
}

const adminLoginPost = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await userSchema.findOne({ email });

        if (!admin) {
            return res.render('./Admin/login.hbs', { message: 'Invalid Credentials' });
        }

        const validPassword = await bcrypt.compare(password, admin.password);
        if (!validPassword) {
            return res.render('./Admin/login.hbs', { message: 'Wrong Password' });
        }

        if (!admin.isAdmin) {
            return res.render('./Admin/login.hbs', { message: "You're not admin please contact the administrators" });
        }

        req.session.admin = admin;

        const redirectTo = req.session.redirectTo || '/admin/dashboard';
        delete req.session.redirectTo; 
        res.redirect(redirectTo);
    } catch (error) {
        res.render('./Admin/login.hbs', { message: 'Invalid Credentials' });
    }
}

const adminDashboard = async (req, res) => {
    try {
        const admin = req.session.admin;
        const period = req.query.period || 'monthly';  // Get period from query (e.g., 'daily', 'weekly')

        // Fetch Total Sales
        const totalSales = await orderSchema.aggregate([
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]);

        // Fetch Total Orders
        const totalOrders = await orderSchema.countDocuments();

        // Fetch Total Products
        const totalProducts = await productSchema.countDocuments();

        // Fetch Total Customers
        const totalCustomers = await userSchema.countDocuments({ isAdmin: false });

        // Revenue Analytics (group by month)
        const revenueAnalytics = await orderSchema.aggregate([
            {
                $group: {
                    _id: { $month: "$orderedOn" },
                    revenue: { $sum: "$totalAmount" },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const topCategories = await productSchema.aggregate([

            {
                $group: {
                    _id: "$category_id",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    count: -1
                }
            },
            {
                $limit: 5
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "_id",
                    foreignField: "_id",
                    as: "categoryDetails"
                }
            },
            {
                $unwind: {
                    path: "$categoryDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 0,
                    category_id: "$_id",
                    category_name: "$categoryDetails.category_name",
                    count: 1
                }
            }
        ]);



        const topProducts = await orderSchema.aggregate([
            {
                $unwind: "$items" // Deconstruct the items array
            },
            {
                $group: {
                    _id: "$items.product_id", // Group by product ID
                    totalQuantity: { $sum: "$items.quantity" } // Sum quantities for each product
                }
            },
            {
                $sort: { totalQuantity: -1 } // Sort by totalQuantity in descending order
            },
            {
                $limit: 5 // Limit to top 5 products
            },
            {
                $lookup: {
                    from: "products", // Join with the products collection
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            {
                $unwind: "$productDetails" // Flatten the joined product details
            },
            {
                $project: {
                    productName: "$productDetails.product_name",
                    totalQuantity: 1
                }
            }
        ]);


        const recentOrders = await orderSchema
            .find({})
            .sort({ orderedOn: -1 })
            .limit(5)
            .populate("items.product_id user_id");



        const lowStockProducts = await productSchema.find({ stock: { $lt: 10 } }).limit(5);

        const revenueIds = revenueAnalytics.map(item => item._id);
        const revenueItems = revenueAnalytics.map(item => item.revenue);

        const orders = await orderSchema.find().sort({ orderedOn: -1 }).populate('user_id', 'username');


        res.render('./Admin/dashboard.hbs', {
            admin,
            totalSales: totalSales[0]?.total || 0,
            totalOrders,
            totalProducts,
            totalCustomers,
            revenueAnalytics,
            topProducts,
            topCategories,
            revenueIds,
            revenueItems,
            recentOrders,
            lowStockProducts,
            selectedPeriod: period,
            orders,
        });
    } catch (error) {
        res.status(400).send(error.message);
    }
};


const filterSalesReport = async (req, res) => {
    const { filter, startDate, endDate } = req.body;
    let matchCriteria = {};

    // Define date ranges
    const today = moment().startOf('day');
    const ranges = {
        daily: { $gte: today.toDate(), $lt: today.add(1, 'day').toDate() },
        weekly: { $gte: today.startOf('week').toDate(), $lt: today.endOf('week').toDate() },
        monthly: { $gte: today.startOf('month').toDate(), $lt: today.endOf('month').toDate() },
        yearly: { $gte: today.startOf('year').toDate(), $lt: today.endOf('year').toDate() },
    };

    if (filter in ranges) {
        matchCriteria.orderedOn = ranges[filter];
    } else if (filter === 'custom' && startDate && endDate) {
        matchCriteria.orderedOn = { $gte: new Date(startDate), $lt: new Date(endDate) };
    }

    try {
        const salesData = await orderSchema.find(matchCriteria).populate('user_id').lean();
        const revenueData = await orderSchema.aggregate([
            { $match: matchCriteria },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$orderedOn' } },
                    revenue: { $sum: '$totalAmount' },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        console.log(salesData.user_id, 'are the users in filterSalesReport');
        res.json({
            salesData: salesData.map(order => ({
                user: order.user_id.username,
                totalAmount: order.totalAmount,
                discount: order.couponCode || null,
                orderStatus: order.delivery_status,
                paymentStatus: order.payment_status,
                orderedAt: moment(order.orderedOn).format('DD/MM/YYYY hh:mm A'),
            })),
            revenueData: {
                labels: revenueData.map(data => data._id),
                values: revenueData.map(data => data.revenue),
            },
        });
    } catch (error) {
        console.error('Error filtering sales report:', error);
        res.status(500).send('Internal Server Error');
    }
};


const generateReport = async (req, res) => {
    const { reportType, startDate, endDate } = req.body;

    let filter = {};

    // Filter logic based on report type
    switch (reportType) {
        case 'daily':
            filter = { createdAt: { $gte: new Date().setHours(0, 0, 0, 0) } };
            break;
        case 'weekly':
            filter = { createdAt: { $gte: new Date(new Date() - 7 * 24 * 60 * 60 * 1000) } }; // Last 7 days
            break;
        case 'monthly':
            filter = { createdAt: { $gte: new Date(new Date().setDate(1)) } }; // From start of the month
            break;
        case 'yearly':
            filter = { createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) } }; // From start of the year
            break;
        case 'custom':
            filter = { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } };
            break;
        default:
            return res.status(400).json({ message: 'Invalid report type' });
    }

    try {
        const orders = await orderSchema.find(filter)
            .populate('user', 'username')
            .sort({ createdAt: -1 })
            .exec();

        res.json({ orders });
    } catch (error) {
        res.status(500).json({ message: 'Error generating report' });
    }
};



const adminUsers = async (req, res) => {
    try {
        const admin = req.session.admin;
        const message = req.session.adminMessage;
        req.session.adminMessage = null;
        const users = await userSchema.find({ isAdmin: false })
        res.render('./Admin/users.hbs', { users, admin, message });
    } catch (error) {
        res.status(400).send(error)
    }
}

const toggleUserStatus = async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log(userId, "userId in toggleUserStatus");
        const user = await userSchema.findById(userId);
        if (user) {
            user.status = !user.status;
            await user.save();
            res.redirect('/admin/users');
        } else {
            res.json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};



const adminOrders = async (req, res) => {
    try {
        const admin = req.session.admin;
        const message = req.session.adminMessage;
        req.session.adminMessage = null;
        const orders = await orderSchema.find()
            .populate('user_id', 'username email')
            .populate('items.product_id', 'product_name currentPrice') // Populate product details
            .sort({ orderedOn: -1 }) // Sort orders in descending order of orderedOn

        res.render('./Admin/orders.hbs', { orders, admin, message });
    } catch (error) {
        res.status(400).send(error);
    }
}

const updateDeliveryStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { delivery_status } = req.body;

        const order = await orderSchema.findById(orderId);
        if (!order) return res.json({ success: false, message: 'Order not found' });

        if (delivery_status === 'Cancelled') {
            if (order.payment_method !== 'cod') {
                order.payment_status = 'Refunded';
            } else {
                order.payment_status = 'Payment Cancelled';
            }

            // Restore product stock
            for (let item of order.items) {
                await productSchema.findByIdAndUpdate(
                    item.product_id,
                    { $inc: { stock: item.quantity } }
                );
            }
        }

        if (delivery_status === 'Delivered') {
            if (order.payment_method !== 'cod') {
                order.payment_status = 'Paid';
            } else {
                order.payment_status = 'Paid';
            }

            // Restore product stock
            for (let item of order.items) {
                await productSchema.findByIdAndUpdate(
                    item.product_id,
                    { $inc: { stock: -item.quantity } }
                );
            }
        }



        await orderSchema.findByIdAndUpdate(orderId, { delivery_status, payment_status: order.payment_status });

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating delivery status:', error);
        res.json({ success: false });
    }
};

const adminReturnRequests = async (req, res) => {
    try {
        const returnRequests = await returnRequestSchema.find({ isReadMessage: false })
            .populate('user_id', 'username')
            .populate('order_id')
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            requests: returnRequests,
            unreadCount: returnRequests.length
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch return requests' });
    }
}

const adminNotifications = async (req, res) => {
    try {
        const admin = req.session.admin;
        const returnRequests = await returnRequestSchema.find()
            .sort({ isReadMessage: 1, createdAt: -1 })
            .populate('user_id', 'username')
            .populate({
                path: 'order_id',
                populate: [
                    {
                        path: 'shipping_address',
                        model: 'orders',
                        select: 'shipping_address'
                    },
                    {
                        path: 'items.product_id',
                        model: 'products',
                        select: 'product_name'
                    }
                ]
            });

        res.render('./Admin/notifications', { notifications: returnRequests, admin });
    } catch (error) {
        res.status(500).send('Failed to load notifications');
    }
}

const acceptReturnRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        console.log(`Received requestId: ${requestId}`);

        const returnRequest = await returnRequestSchema.findById(requestId).populate('order_id');
        if (!returnRequest) {
            console.error('Return request not found');
            return res.status(404).json({ success: false, message: 'Return request not found' });
        }

        await returnRequestSchema.findByIdAndUpdate(requestId, { isReadMessage: true });
        console.log(`Marked return request ${requestId} as read`);

        const order = returnRequest.order_id;
        if (!order) {
            console.error('Order associated with return request not found');
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        for (let item of order.items) {
            console.log(`Increasing stock for product ${item.product_id} by ${item.quantity}`);
            await productSchema.findByIdAndUpdate(
                item.product_id,
                { $inc: { stock: item.quantity } }
            );
        }

        await orderSchema.findByIdAndUpdate(order._id, { delivery_status: 'Returned', payment_status: 'Refunded' });
        console.log(`Updated order ${order._id} status to 'Returned'`);

        let wallet = await walletSchema.findOne({ user_id: order.user_id });
        if (!wallet) {
            console.log('User wallet not found, creating a new one....');
            wallet = await walletSchema.create({
                user_id: order.user_id,
                totalAmount: 0,
                transactions: []
            });
        }

        const refundAmount = order.totalAmount;
        console.log(`Refunding ${refundAmount} to user ${order.user_id}`);
        await walletSchema.findByIdAndUpdate(
            wallet._id,
            {
                $inc: { totalAmount: refundAmount },
                $push: {
                    transactions: {
                        amount: refundAmount,
                        type: 'credit',
                        description: 'Refund for order',
                        order_id: order._id,
                        date: Date.now()
                    }
                }
            }
        );

        res.json({ success: true, message: 'Returned the product successfully' });
    } catch (error) {
        console.error('Error accepting return request:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const rejectReturnRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const returnRequest = await returnRequestSchema.findByIdAndUpdate(requestId, { isReadMessage: true });
        if (!returnRequest) {
            console.error('Return request not found');
            return res.status(404).json({ success: false, message: 'Return request not found' });
        }


        const order = returnRequest.order_id;
        if (!order) {
            console.error('Order associated with return request not found');
            return res.status(404).json({ success: false, message: 'Order not found' });
        }


        await orderSchema.findByIdAndUpdate(order._id, { delivery_status: 'Non-Returnable' });
        res.json({ success: true, message: 'Rejected the return request successfully' });
    } catch (error) {
        console.error('Error rejecting return request:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await orderSchema.findById(orderId);
        if (!order) return res.json({ success: false, message: 'Order not found' });

        if (order.payment_method !== 'cod') {
            order.payment_status = 'Refunded';
        } else {
            order.payment_status = 'Payment Cancelled';
        }

        // Update the delivery_status to 'Cancelled'
        order.delivery_status = 'Cancelled';
        await order.save();

        // Restore product stock
        for (let item of order.items) {
            await productSchema.findByIdAndUpdate(
                item.product_id,
                { $inc: { stock: item.quantity } }
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


const adminProducts = async (req, res) => {
    try {
        const admin = req.session.admin;
        const message = req.session.adminMessage;
        req.session.adminMessage = null;
        const products = await productSchema.find().populate('category_id', 'category_name')
        res.render('./Admin/products.hbs', { products, admin, message });
    } catch (error) {
        res.status(400).send(error)
    }
}


const toggleProductStatus = async (req, res) => {
    try {
        const productId = req.params.productId;
        console.log(productId, "productId in toggleUserStatus");
        const product = await productSchema.findById(productId);
        if (product) {
            product.isActive = !product.isActive;
            await product.save();

            if (!product.isActive) {
                await cartSchema.updateMany(
                    { "items.product_id": product._id },
                    { $pull: { items: { product_id: product._id } } }
                );
            }

            res.redirect('/admin/products');
        } else {
            res.json({ success: false, message: 'Product not found' });
        }
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};


const addProductGet = async (req, res) => {
    try {
        const categories = await categorySchema.find({ isActive: true });
        res.render('./Admin/addProducts.hbs', { categories })
    } catch (error) {
        res.status(400).send(error)
    }
}

const addProductPost = async (req, res) => {
    try {
        const { product_name, category_id, currentPrice, description, stock } = req.body;

        // Manually create the specifications object from req.body fields
        const specifications = {
            dial_colour: req.body["specification.dial_colour"],
            function: req.body["specification.function"],
            movement: req.body["specification.movement"],
            band: req.body["specification.band"],
            case_material: req.body["specification.case_material"],
            hand_colour: req.body["specification.hand_colour"],
            caliber: req.body["specification.caliber"],
            dual_size: req.body["specification.dual_size"]
        };

        console.log(specifications, "specifications in addProductPost"); // Check output

        const productImages = req.files.map(file => file.path); // Get uploaded image paths

        // Check if the product name already exists
        const existingProduct = await productSchema.findOne({ product_name });
        if (existingProduct) {
            return res.status(400).send("Product name is already assigned");
        }

        // Create and save the new product
        const product = new productSchema({
            product_name,
            category_id,
            product_image: productImages,
            currentPrice,
            description,
            stock,
            specification: specifications,
            createdAt: Date.now(),
            isActive: true
        });

        await product.save();
        res.redirect('/admin/products');
    } catch (error) {
        console.error(error);
        res.status(500).send("Error adding product");
    }
};



const editProductGet = async (req, res) => {
    try {
        const productId = req.params.productId;
        console.log(productId, "productId in editProductGet");
        const product = await productSchema.findById(productId);
        console.log(product, "product in editProductGet");
        const category = await categorySchema.find();
        console.log(category, "category in editProductGet");
        res.render('./Admin/editProducts.hbs', { product, category });
    } catch (error) {
        res.status(400).send(error)
    }
}


const editProductPost = async (req, res) => {
    try {
        const productId = req.params.productId;

        console.log("Request Body:", req.body);
        console.log("Request Files:", req.files);

        // Find the product by ID
        const product = await productSchema.findById(productId);
        const category = await categorySchema.find();

        if (!product) {
            return res.render('./Admin/editProducts.hbs', { message: "Product not found" });
        }

        // Check if the product name already exists
        const existingProduct = await productSchema.findOne({ product_name: req.body.product_name, _id: { $ne: productId } });
        if (existingProduct) {
            return res.render('./Admin/editProducts.hbs', { product, category, message: "Product name is already assigned" });
        }

        // Update fields from request body
        product.product_name = req.body.product_name || product.product_name;
        product.description = req.body.description || product.description;
        product.currentPrice = req.body.currentPrice || product.currentPrice;
        product.stock = req.body.stock || product.stock;
        product.category_id = req.body.category_id || product.category_id;

        // Update specifications with optional chaining
        product.specification.dial_colour = req.body["specification.dial_colour"] || product.specification.dial_colour;
        product.specification.function = req.body["specification.function"] || product.specification.function;
        product.specification.movement = req.body["specification.movement"] || product.specification.movement;
        product.specification.band = req.body["specification.band"] || product.specification.band;
        product.specification.case_material = req.body["specification.case_material"] || product.specification.case_material;
        product.specification.hand_colour = req.body["specification.hand_colour"] || product.specification.hand_colour;
        product.specification.caliber = req.body["specification.caliber"] || product.specification.caliber;
        product.specification.dual_size = req.body["specification.dual_size"] || product.specification.dual_size;

        // Handle product images if new images are uploaded
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => file.path);
            product.product_image = newImages;  // Replace existing images with new ones
            console.log("Updated Images:", product.product_image);
        } else {
            console.log("No new images uploaded");
        }


        // Save the updated product
        await product.save();

        // Redirect or send a success response
        console.log("Product updated successfully:", product);
        res.redirect(`/admin/products`);
    } catch (error) {
        console.error("Error in editProductPost:", error);
        res.status(400).send(error);
    }
};

const updateImage = async (req, res) => {
    console.log(req.body, "req.body in updateImage");
    const { index, productId } = req.body;
    if (!req.file || index === undefined || !productId) {
        return res.status(400).json({ success: false, message: "Invalid request: missing image, index, or productId" });
    }

    try {
        const product = await productSchema.findById(productId);
        if (product && product.product_image && product.product_image[index]) {
            console.log(product, "product in updateImage");
            // Replace the image at the specified index
            product.product_image[index] = `uploads/${req.file.filename}`;
            console.log(product.product_image[index], "product.product_image[index] in updateImage");
            await product.save();
            console.log("Image updated successfully in updateImage");
        } else {
            return res.render('./Admin/editProducts.hbs', { message: "Product or image not foundProduct or image not found" });
        }
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ success: false, message: "Server error. Please try again." });
    }
};



const adminCategories = async (req, res) => {
    try {
        const admin = req.session.admin;
        const message = req.session.adminMessage;
        req.session.adminMessage = null;
        const categories = await categorySchema.find()
        res.render('./Admin/categories.hbs', { categories, admin, message });
    } catch (error) {
        res.status(400).send(error)
    }
}

const toggleCategoryStatus = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        console.log(categoryId, "categoryId in toggleUserStatus");
        const category = await categorySchema.findById(categoryId); // Ensure you are using the correct model name
        if (category) {
            category.isActive = !category.isActive; // Toggle the status
            await category.save();

            // Remove products from cart that belongs to the category
            if (!category.isActive) {
                await cartSchema.updateMany(
                    { "items.product_id": { $in: category.products } },
                    { $pull: { items: { product_id: { $in: category.products } } } }
                );
            }

            res.redirect('/admin/categories');
        } else {
            res.json({ success: false, message: 'Category not found' });
        }
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};


const addCategory = async (req, res) => {
    try {
        const { category_name, isActive } = req.body;
        const existingCategory = await categorySchema.findOne({ category_name });
        if (existingCategory) {
            return res.status(400).send({ message: "Category name already exists" });
        }
        const category = new categorySchema({ category_name, isActive })
        await category.save()
        res.redirect('/admin/categories')
    } catch (error) {
        res.status(400).send(error)
    }
}

// Controller function for editing a category
const editCategory = async (req, res) => {
    try {
        const { id } = req.params; // Retrieve category ID from URL parameter
        const { category_name, isActive } = req.body; // Get updated values from the request body
        const existingCategory = await categorySchema.findOne({ category_name });
        if (existingCategory) {
            return res.status(400).send({ message: "Category name already exists" });
        }

        // Find the category by ID and update
        await categorySchema.findByIdAndUpdate(id, { category_name, isActive });

        res.redirect('/admin/categories'); // Redirect to the categories list page after update
    } catch (error) {
        res.status(400).send(error); // Send error if something goes wrong
    }
}

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params; // Get category ID from URL parameters

        // Delete the category using the ID
        await categorySchema.findByIdAndDelete(id);

        res.redirect('/admin/categories'); // Redirect to categories list after deletion
    } catch (error) {
        res.status(400).send(error); // Send error response if something goes wrong
    }
}



const adminOffers = async (req, res) => {
    try {
        const admin = req.session.admin;
        const message = req.session.adminMessage;
        req.session.adminMessage = null;

        const productOffers = await offerSchema
            .find({ type: 'products' })
            .populate('typeId', 'product_name currentPrice product_image');

        console.log(productOffers, "are the productOffers in adminOffers");

        const categoryOffers = await offerSchema
            .find({ type: 'categories' })
            .populate('typeId', 'category_name');

        console.log(categoryOffers, "are the categoryOffers in adminOffers");

        res.render('./Admin/offers.hbs', { admin, message, productOffers, categoryOffers });
    } catch (error) {
        res.status(400).send(error);
    }
};

const getCategoriesWithoutOffers = async (req, res) => {
    try {
        const offeredCategoryIds = await offerSchema.find({ type: 'categories', isActive: true }).distinct('typeId');
        const categories = await categorySchema.find({
            _id: { $nin: offeredCategoryIds },
            isActive: true
        });
        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching categories' });
    }
}

const addCategoryOffer = async (req, res) => {
    try {
        const { categoryId, discountValue } = req.body;

        const categoryExists = await categorySchema.findById(categoryId);
        if (!categoryExists) return res.status(400).json({ error: "Category not found." });

        const newOffer = new offerSchema({
            type: 'categories',
            typeId: categoryId,
            discount: discountValue,
        });
        await newOffer.save();
        res.json({ message: 'Category offer added successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save the category offer.' });
    }
};

const getProductsWithoutOffers = async (req, res) => {
    try {
        const offeredProductIds = await offerSchema.find({ type: 'products' }).distinct('typeId');
        const productsWithoutOffers = await productSchema.find(
            { _id: { $nin: offeredProductIds }, isActive: true },
            'product_name category_id'
        );

        res.json(productsWithoutOffers);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Error fetching products');
    }
};

const addProductOffer = async (req, res) => {
    const {  discount, typeId } = req.body;
    console.log({ typeId, discount }, "are the request body in addProductOffer");

    try {
        const newOffer = new offerSchema({
            type: 'products',
            typeId,
            discount,
        });
        console.log(newOffer, "is the newOffer in addProductOffer");

        await newOffer.save();
        console.log("Offer saved successfully in addProductOffer");
        res.status(201).json({ success: true, message: 'Offer added successfully' });
    } catch (error) {
        console.error(error, "is the error in addProductOffer");
        res.status(500).json({ success: false, message: 'Error adding offer' });
    }
};

const toggleOfferStatus = async (req, res) => {
    try {
        const offerId = req.params.offerId;
        console.log(offerId, "offerId in toggleOfferStatus");
        const offer = await offerSchema.findById(offerId);
        if (offer) {
            offer.isActive = !offer.isActive;
            await offer.save();

            if (!offer.isActive) {
                if (offer.type === 'products') {
                    await cartSchema.updateMany(
                        { "items.product_id": offer.typeId },
                        { $pull: { items: { product_id: offer.typeId } } }
                    );
                } else if (offer.type === 'categories') {
                    const products = await productSchema.find({ category_id: offer.typeId }, '_id');
                    const productIds = products.map(product => product._id);
                    await cartSchema.updateMany(
                        { "items.product_id": { $in: productIds } },
                        { $pull: { items: { product_id: { $in: productIds } } } }
                    );
                }
            }

            res.redirect('/admin/offers');
        } else {
            res.json({ success: false, message: 'Offer not found' });
        }
    } catch (error) {
        res.status(400).json({ success: false, error: `${error.message} in toggleOfferStatus` });
    }
};

const updateCategoryOffer = async (req, res) => {
    console.log('updateCategoryOffer called');
    const { offerId } = req.params;
    console.log('offerId:', offerId);
    const { discount } = req.body;
    console.log('discount:', discount);

    if (!discount || isNaN(discount)) {
        console.log('Invalid discount value');
        return res.status(400).json({ success: false, message: 'Invalid discount value.' });
    }

    console.log('Attempting to update offer');
    try {
        console.log('Finding offer by ID');
        const updatedOffer = await offerSchema.findByIdAndUpdate(
            offerId,
            { discount: parseInt(discount) },
            { new: true }
        );

        console.log('updatedOffer:', updatedOffer);
        if (updatedOffer) {
            console.log('Offer updated successfully');
            res.status(200).json({ success: true, message: 'Category offer updated successfully.' });
        } else {
            console.log('Offer not found');
            res.status(404).json({ success: false, message: 'Category offer not found.' });
        }
    } catch (error) {
        console.error('Error updating category offer:', error);
        res.status(500).json({ success: false, message: 'An error occurred while updating the category offer.' });
    }
};


const updateProductOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const { discount } = req.body;

        await offerSchema.findByIdAndUpdate(id, { discount });

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.json({ success: false });
    }
}

const deleteCategoryOffer = async (req, res) => {
    const offerId = req.params.offerId;

    try {
        const result = await offerSchema.findByIdAndDelete(offerId);

        if (result) {
            res.status(200).json({ success: true, message: 'Category offer deleted successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Category offer not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An error occurred while deleting the category offer' });
    }
}

const deleteProductOffer = async (req, res) => {
    const offerId = req.params.offerId;

    try {
        const result = await offerSchema.findByIdAndDelete(offerId);

        if (result) {
            res.status(200).json({ success: true, message: 'Product offer deleted successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Product offer not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An error occurred while deleting the product offer' });
    }
}


const adminPayments = async (req, res) => {
    try {
        const admin = req.session.admin;
        const message = req.session.adminMessage;
        req.session.adminMessage = null;
        res.render('./Admin/payments.hbs', { message, admin });
    } catch (error) {
        res.status(400).send(error)
    }
}

const adminCoupons = async (req, res) => {
    try {
        const admin = req.session.admin;
        const message = req.session.adminMessage;
        req.session.adminMessage = null;
        const coupons = await couponSchema.find()
        res.render('./Admin/coupons.hbs', { message, admin, coupons })
    } catch (error) {
        res.status(400).send(error)
    }
}

const addCoupon = async (req, res) => {
    try {
        const { coupon_code, discount, startDate, endDate } = req.body;
        const existingCoupon = await couponSchema.findOne({ coupon_code });
        if (existingCoupon) {
            return res.status(400).send({ message: "Coupon code already exists" });
        }
        const coupon = new couponSchema({ code: coupon_code, discount, startDate, endDate })
        await coupon.save()
        res.redirect('/admin/coupons')
    } catch (error) {
        res.status(400).send(error)
    }
}

const toggleCouponStatus = async (req, res) => {
    try {
        const { couponId } = req.params;
        console.log(couponId, "is the couponId in toggleCouponStatus");
        const coupon = await couponSchema.findById(couponId);
        if (coupon) {
            coupon.status = !coupon.status;
            await coupon.save();
            res.redirect('/admin/coupons');
        } else {
            res.json({ success: false, message: 'Coupon not found' });
        }
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

const updateField = async (req, res) => {
    const { couponId } = req.params;
    const { field, value } = req.body;

    try {
        await couponSchema.findByIdAndUpdate(couponId, { [field]: value });
        res.status(200).json({ message: 'Field updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error updating field', error: err });
    }
}

const updateAllFields = async (req, res) => {
    const { couponId } = req.params;
    const updates = req.body;

    try {
        await couponSchema.findByIdAndUpdate(couponId, updates);
        res.status(200).json({ message: 'Coupon updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error updating coupon', error: err });
    }
}


const deleteCoupon = async (req, res) => {
    try {
        const { couponId } = req.params;
        console.log(couponId, "is the couponId in deleteCoupon");
        await couponSchema.findByIdAndDelete(couponId);

        res.redirect('/admin/coupons');
    } catch (error) {
        res.status(400).send(error);
    }
}

const adminProfile = async (req, res) => {
    try {
        const admin = req.session.admin;
        const message = req.session.adminMessage;
        req.session.adminMessage = null;
        res.render('./Admin/profile.hbs', { message, admin })
    } catch (error) {
        res.status(400).send(error)
    }
}

const adminLogout = async (req, res) => {
    try {
        delete req.session.admin
        res.redirect('/admin/logout');
    } catch (error) {
        res.status(400).send(error)
    }
}



module.exports = {
    upload,
    adminLoginPost,
    adminLogin,
    adminDashboard,
    filterSalesReport,
    generateReport,
    adminUsers,
    toggleUserStatus,
    adminOrders,
    updateDeliveryStatus,
    adminReturnRequests,
    adminNotifications,
    acceptReturnRequest,
    rejectReturnRequest,
    cancelOrder,
    adminProducts,
    toggleProductStatus,
    addProductGet,
    addProductPost,
    editProductGet,
    editProductPost,
    updateImage,
    adminCategories,
    toggleCategoryStatus,
    addCategory,
    editCategory,
    deleteCategory,
    adminOffers,
    getCategoriesWithoutOffers,
    addCategoryOffer,
    getProductsWithoutOffers,
    addProductOffer,
    toggleOfferStatus,
    updateCategoryOffer,
    updateProductOffer,
    deleteCategoryOffer,
    deleteProductOffer,
    adminPayments,
    adminCoupons,
    addCoupon,
    toggleCouponStatus,
    updateField,
    updateAllFields,
    deleteCoupon,
    adminProfile,
    adminLogout
}
