const userSchema = require('../Model/userModel')
const categorySchema = require('../Model/categoryModel')
const productSchema = require('../Model/productModel')
const bcrypt = require('bcrypt')
const saltround = 10
const mongoose = require('mongoose')
const multer = require('multer');
const path = require('path');

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
        const user = await userSchema.findOne({ email });

        if (!user) {
            return res.render('./Admin/login.hbs', { message: 'Invalid Credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.render('./Admin/login.hbs', { message: 'Wrong Password' });
        }

        if (!user.isAdmin) {
            return res.render('./Admin/login.hbs', { message: "You're not admin please contact the administrators" });
        }

        const username = user.username;
        req.session.user = user;
        res.redirect('/admin/dashboard');
    } catch (error) {
        res.render('./Admin/login.hbs', { message: 'Invalid Credentials' });
    }
}

const adminDashboard = async (req, res) => {
    try {
        res.render('./Admin/dashboard.hbs')
    } catch (error) {
        res.status(400).send(error)
    }
}

const adminUsers = async (req, res) => {
    try {
        const users = await userSchema.find({ isAdmin: false })
        res.render('./Admin/users.hbs', { users })
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
        res.render('./Admin/orders.hbs')
    } catch (error) {
        res.status(400).send(error)
    }
}

const adminProducts = async (req, res) => {
    try {
        const products = await productSchema.find().populate('category_id', 'category_name') // populate category_id with category_name
        res.render('./Admin/products.hbs', { products })
    } catch (error) {
        res.status(400).send(error)
    }
}


const toggleProductStatus = async (req, res) => {
    try {
        const productId = req.params.productId;
        console.log(productId, "productId in toggleUserStatus");
        const product = await productSchema.findById(productId); // Ensure you are using the correct model name
        if (product) {
            product.isActive = !product.isActive; // Toggle the status
            await product.save();
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
        const categories = await categorySchema.find();
        res.render('./Admin/addProducts.hbs', { categories })
    } catch (error) {
        res.status(400).send(error)
    }
}

const addProductPost = async (req, res) => {
    try {
        const { product_name, category_id, normalPrice, currentPrice, description, stock } = req.body;

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

        // Create and save the new product
        const product = new productSchema({
            product_name,
            category_id,
            product_image: productImages,
            normalPrice,
            currentPrice,
            description,
            stock,
            specification: specifications, // Use the constructed specifications object
            createdAt: Date.now(),
            isActive: req.body.isActive === 'on' // Convert checkbox to boolean
        });

        await product.save();
        res.redirect('/admin/products'); // Redirect to product list page
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
        const categories = await categorySchema.find();
        res.render('./Admin/editProducts.hbs', { product, categories });
    } catch (error) {
        res.status(400).send(error)
    }
}


// const editProductPost = async (req, res) => {
//     try {
//         const productId = req.params.productId;

//         // Find the product by ID
//         const product = await productSchema.findById(productId);
//         if (!product) {
//             return res.status(404).send({ message: "Product not found" });
//         }

//         // Update basic product details
//         product.product_name = req.body.product_name;
//         product.description = req.body.description;
//         product.normalPrice = req.body.normalPrice;
//         product.currentPrice = req.body.currentPrice;
//         product.stock = req.body.stock;
//         product.category_id = req.body.category_id;

//         // Update specifications
//         product.specification = {
//             dial_colour: req.body["specification.dial_colour"],
//             function: req.body["specification.function"],
//             movement: req.body["specification.movement"],
//             band: req.body["specification.band"],
//             case_material: req.body["specification.case_material"],
//             hand_colour: req.body["specification.hand_colour"],
//             caliber: req.body["specification.caliber"],
//             dual_size: req.body["specification.dual_size"],
//         };

//         // Handle product images if new images are uploaded
//         if (req.files && req.files.product_image) {
//             // Assuming req.files.product_image is an array of uploaded images
//             const newImages = req.files.product_image.map(file => file.path);
//             product.product_image = newImages;  // Replace existing images with new ones
//         }

//         // Save the updated product
//         await product.save();

//         // Redirect back to the product edit page or another appropriate page
//         res.redirect(`/admin/products/edit-product/${productId}`);
//     } catch (error) {
//         console.error("Error in editProductPost:", error);
//         res.status(400).send(error);
//     }
// };


const editProductPost = async (req, res) => {
    try {
        const productId = req.params.productId;
        
        console.log("Request Body:", req.body);
        console.log("Request Files:", req.files);

        // Find the product by ID
        const product = await productSchema.findById(productId);
        if (!product) {
            return res.status(404).send({ message: "Product not found" });
        }

        // Update fields from request body
        product.product_name = req.body.product_name || product.product_name;
        product.description = req.body.description || product.description;
        product.normalPrice = req.body.normalPrice || product.normalPrice;
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




const adminCategories = async (req, res) => {
    try {
        const categories = await categorySchema.find()
        res.render('./Admin/categories.hbs', { categories })
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
        res.render('./Admin/offers.hbs')
    } catch (error) {
        res.status(400).send(error)
    }
}

const adminPayments = async (req, res) => {
    try {
        res.render('./Admin/payments.hbs')
    } catch (error) {
        res.status(400).send(error)
    }
}

const adminCoupons = async (req, res) => {
    try {
        res.render('./Admin/coupons.hbs')
    } catch (error) {
        res.status(400).send(error)
    }
}

const adminProfile = async (req, res) => {
    try {
        res.render('./Admin/profile.hbs')
    } catch (error) {
        res.status(400).send(error)
    }
}

const adminLogout = async (req, res) => {
    try {
        req.session.destroy();
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
    adminUsers,
    toggleUserStatus,
    adminOrders,
    adminProducts,
    toggleProductStatus,
    addProductGet,
    addProductPost,
    editProductGet,
    editProductPost,
    adminCategories,
    toggleCategoryStatus,
    addCategory,
    editCategory,
    deleteCategory,
    adminOffers,
    adminPayments,
    adminCoupons,
    adminProfile,
    adminLogout
}