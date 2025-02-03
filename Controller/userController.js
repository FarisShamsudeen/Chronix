const userSchema = require('../Model/userModel')
const productSchema = require('../Model/productModel')
const categorySchema = require('../Model/categoryModel')
const cartSchema = require('../Model/cartModel')
const addressSchema = require('../Model/addressModel')
const placeSchema = require('../Model/placeModel')
const orderSchema = require('../Model/orderModel')
const returnRequestSchema = require('../Model/returnRequestModel')
const wishlistSchema = require('../Model/wishlistModel')
const couponSchema = require('../Model/couponModel')
const walletSchema = require('../Model/walletModel')
const offerSchema = require('../Model/offerModel')
const bcrypt = require('bcrypt')
const saltround = 10
const passport = require('../Config/passport');
require('dotenv').config();
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const { client } = require('../services/paypal');
const paypal = require('@paypal/checkout-server-sdk');
const ip = require('ip');
const localhost = 'localhost';
const hbs = require('handlebars');
const mongoose = require('mongoose');

const fs = require('fs');
const nodeHtmlToImage = require('node-html-to-image');
const path = require('path');
const PDFDocument = require('pdfkit');

const loadUserInvoice = async (req, res) => {
    console.log('loadUserInvoice called');
    console.log('req:', req);
    console.log('res:', res);
    try {
        console.log('Fetching order with id:', req.params.orderId);
        const orderId = req.params.orderId;
        const populatedOrder = await orderSchema.findById(orderId)
            .populate('user_id', 'username email') // Populating user info
            .populate('items.product_id', 'product_name currentPrice'); // Populating product info
        console.log('Populated order:', populatedOrder);
        const user = populatedOrder.user_id;
        console.log('User:', user);
        const items = populatedOrder.items;
        console.log('Items:', items);
        const shippingAddress = populatedOrder.shipping_address;
        console.log('Shipping address:', shippingAddress);
        const paymentDetails = populatedOrder.payment_details;
        console.log('Payment details:', paymentDetails);
        const formattedDate = new Date(populatedOrder.orderedOn).toLocaleString();
        console.log('Formatted date:', formattedDate);

        console.log('Rendering invoice page');
        res.render('./User/invoice.hbs', { user, items, shippingAddress, paymentDetails, formattedDate, populatedOrder });
    } catch (error) {
        console.log('Error generating invoice page:', error);
        throw error;
    }
};

const generateInvoiceImage = async (order) => {
    try {
        // Populate order with related data
        const populatedOrder = await orderSchema.findById(order._id)
            .populate('user_id', 'username email') // Populating user info
            .populate('items.product_id', 'product_name currentPrice'); // Populating product info

        const user = populatedOrder.user_id;
        const items = populatedOrder.items;
        const shippingAddress = populatedOrder.shipping_address;
        const paymentDetails = populatedOrder.payment_details;
        const formattedDate = new Date(populatedOrder.orderedOn).toLocaleString();
        const logoBuffer = fs.readFileSync(path.join(__dirname, '../Public/Images/Logo/main_logo_without_bg.webp'));
        const base64Logo = logoBuffer.toString('base64');


        // Define your HTML template, use the order data dynamically
        const htmlTemplate = `
          <html>
            <head>
              <style>
                body {
                  font-family: 'Helvetica Neue', Arial, sans-serif;
                  color: #fff;
                  background-color: #000;
                  padding: 40px;
                  margin: 0;
                }
                .invoice {
                  max-width: 800px;
                  margin: auto;
                  padding: 30px;
                  background-color: #333;
                  border-radius: 8px;
                  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
                  text-align: left;
                }
                .invoice-header {
                  text-align: center;
                  margin-bottom: 20px;
                }
                h1 {
                  font-size: 36px;
                  color: #FFD700; /* Yellow */
                  margin-bottom: 10px;
                }
                .invoice-details {
                  font-size: 16px;
                  margin-bottom: 20px;
                }
                .invoice-details p {
                  margin: 6px 0;
                }
                .invoice-footer {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-top: 30px;
                  border-top: 1px solid #555;
                  padding-top: 15px;
                }
                .footer-left {
                  font-size: 14px;
                  color: #aaa;
                }
                .footer-right {
                  font-size: 18px;
                  font-weight: bold;
                  color: #FFD700; /* Yellow */
                }
                .invoice-details strong {
                  font-weight: 600;
                }
                .order-items {
                  margin-top: 20px;
                  border-top: 1px solid #555;
                  padding-top: 15px;
                }
                .order-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 10px;
                }
                .order-table th, .order-table td {
                  padding: 10px;
                  text-align: left;
                  border-bottom: 1px solid #444;
                }
                .order-table th {
                  background-color: #555; /* Blue Gray Shade */
                  font-weight: bold;
                }
                .order-item img {
                  width: 50px;
                  height: 50px;
                  object-fit: cover;
                  margin-right: 10px;
                }
                .company-logo {
                  height: 250px;
                  object-fit: contain;
                }
              </style>
            </head>
            <body>
              <div class="invoice">
                <div class="invoice-header">
                  <img class="company-logo" src="data:image/webp;base64, ${base64Logo}" alt="Logo"/>
                  <h1>Invoice</h1>
                  <p>${formattedDate}</p>
                </div>
                
                <div class="invoice-details">
                  <p><strong>Order ID:</strong> ${populatedOrder._id}</p>
                  <p><strong>Customer:</strong> ${user.username}</p>
                  <p><strong>Email:</strong> ${user.email}</p>
                  <p><strong>Shipping Address:</strong></p>
                  <p>${shippingAddress.flatNo}, ${shippingAddress.area}, ${shippingAddress.townCity}, ${shippingAddress.state}, ${shippingAddress.pincode}</p>
                  <p><strong>Phone:</strong> ${shippingAddress.phoneNumber}</p>
                  <p><strong>Payment Method:</strong> ${populatedOrder.payment_method}</p>
                  <p><strong>Payment Status:</strong> ${populatedOrder.payment_status}</p>
                  <p><strong>Delivery Status:</strong> ${populatedOrder.delivery_status}</p>
                  <p><strong>Coupon Code:</strong> ${populatedOrder.couponCode || 'N/A'}</p>
                  </div>
                  
                <div class="order-items">
                  <h3>Items:</h3>
                  <table class="order-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${items.map(item => `
                        <tr class="order-item">
                          <td><strong>${item.product_id.product_name}</strong></td>
                          <td>$${item.product_id.currentPrice}</td>
                          <td>${item.quantity}</td>
                          <td>$${item.quantity * item.product_id.currentPrice}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
                
                <div class="invoice-footer">
                  <div class="footer-left">
                    <p>Thank you for shopping with us!</p>
                  </div>
                  <div class="footer-right">
                    <p>Total: ${populatedOrder.totalAmount}</p>
                  </div>
                </div>
                  <p><strong>Tax (10%) is included in the total amount</p>
              </div>
                  <p>*This is a computer generated invoice and does not require any signature</p>
            </body>
          </html>
        `;

        // Generate the image and return the path
        const outputPath = path.join(__dirname, 'invoice.png');
        await nodeHtmlToImage({
            output: outputPath,
            html: htmlTemplate,
            puppeteerArgs: {
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });

        console.log(`Invoice image created at: ${outputPath}`);
        return outputPath;
    } catch (error) {
        console.error('Error generating invoice image:', error);
        throw error;
    }
};



const downloadImage = async (req, res) => {
    try {
        // Fetch order details
        const order = await orderSchema.findById(req.params.orderId);

        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Format date for filename
        const date = new Date(order.orderedOn);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hour = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
        const formattedDate = `${day}-${month}-${year}_${hour}-${minutes}_${ampm}`;

        // Generate invoice image
        const filePath = await generateInvoiceImage(order);

        // Serve the image directly or send it as PDF after conversion
        res.download(filePath, `Invoice_${order._id}_${formattedDate}.png`, (err) => {
            if (err) {
                console.error('Error sending invoice:', err);
                res.status(500).send('Error sending invoice');
            } else {
                // Optionally delete the image after sending to the user
                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error('Error deleting the image:', unlinkErr);
                    } else {
                        console.log('Invoice image deleted after sending.');
                    }
                });
            }
        });
    } catch (error) {
        console.error('Error fetching order or generating invoice:', error);
        res.status(500).send('Error fetching order or generating invoice');
    }
};


// Function to generate PDF from the order data
const generateInvoicePDF = async (order, res) => {
    try {
        const doc = new PDFDocument({
            size: 'A4',
            margin: 40,
        });

        const filePath = path.resolve(__dirname, '../invoices/invoice.pdf');
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // Add company logo
        doc.image(path.resolve(__dirname, '../Public/Images/Logo/main_logo_without_bg.png'), {
            fit: [150, 150],
            align: 'center',
            valign: 'center',
        });

        // Set background color for the document
        doc.rect(0, 0, 610, 850).fill('#000000');

        doc.fontSize(42)
            .fillColor('#FFCC00')
            .font('Times-Roman')
            .text('CHRONIX', { align: 'center' });

        doc.fontSize(14)
            .fillColor('#888888')
            .font('Helvetica')
            .text('Embrace the luxury', { align: 'center' });

        doc.fontSize(32)
            .fillColor('#00c3c3')
            .moveDown()
            .font('Courier-Bold')
            .text('Invoice', { align: 'center' });

        // Order Date and ID
        doc.fontSize(12)
            .moveDown(1)
            .fillColor('#FFFFFF')
            .text('Order Date: ' + new Date(order.orderedOn).toLocaleDateString(), { align: 'center' })
            .text('Order ID: ' + order._id, { align: 'center' })
            .moveDown(1);

        // Customer Details (from populated user_id)
        doc.text('Customer: ' + order.user_id.username);
        doc.text('Email: ' + order.user_id.email);
        doc.moveDown(1);

        // Shipping Address
        const address = order.shipping_address;
        doc.text('Shipping Address:');
        doc.text(`${address.flatNo}, ${address.area}`);
        doc.text(`${address.townCity}, ${address.state}, ${address.pincode}`);
        doc.text(`Phone: ${address.phoneNumber}`);
        doc.moveDown(1);

        // Payment and Delivery Details
        doc.text('Payment Method: ' + order.payment_method);
        doc.text('Payment Status: ' + order.payment_status);
        doc.text('Delivery Status: ' + order.delivery_status);
        if (order.couponCode) doc.text('Coupon Code: ' + order.couponCode);
        doc.moveDown(3);

        // Dynamic Table for Order Items
        const items = order.items;

        // Draw table rectangle
        const tableTop = doc.y;
        const tableLeft = 60;
        const tableWidth = 500;
        const rowHeight = 20;

        // Draw the outer rectangle
        doc.rect(tableLeft, tableTop - 5, tableWidth, (items.length + 1) * rowHeight + 5)
            .strokeColor('#FFFFFF')
            .lineWidth(1)
            .stroke();

        // Table Header
        doc.fontSize(12).fillColor('#FFFFFF')
            .text('Product', tableLeft + 10, tableTop)
            .text('Price', tableLeft + 150, tableTop)
            .text('Quantity', tableLeft + 300, tableTop)
            .text('Total', tableLeft + 400, tableTop);

        // Draw header underline
        doc.moveTo(tableLeft, tableTop + rowHeight)
            .lineTo(tableLeft + tableWidth, tableTop + rowHeight)
            .strokeColor('#FFFFFF')
            .lineWidth(1)
            .stroke();

        let yPos = tableTop + rowHeight + 5;

        items.forEach(function (item) {
            const product = item.product_id; // Populated product details
            doc.fontSize(12).fillColor('#FFFFFF')
                .text(product.product_name, tableLeft + 10, yPos)
                .text(item.price.toFixed(2), tableLeft + 150, yPos)
                .text(item.quantity, tableLeft + 300, yPos)
                .text((item.price * item.quantity).toFixed(2), tableLeft + 400, yPos);

            // Draw row underline
            doc.moveTo(tableLeft, yPos + rowHeight - 5)
                .lineTo(tableLeft + tableWidth, yPos + rowHeight - 5)
                .strokeColor('#FFFFFF')
                .lineWidth(0.5)
                .stroke();

            yPos += rowHeight;
        });

        // Total Section
        doc.moveDown(7);
        doc.fontSize(14).fillColor('#2ecc71')
            .text('Total:', { align: 'right' })
            .text(order.totalAmount.toFixed(2), { align: 'center' })
            .moveDown(2);

        // Footer Message
        // doc.fontSize(7).fillColor('#FFFFFF')
        //     .text('Thank you for shopping with us!', { align: 'left' })
        //     .moveDown(2)
        //     .text('Tax (10%) is included in the total amount', { align: 'center' })
        //     .moveDown(2)
        //     .text('*This is a computer generated invoice and does not require any signature.', { align: 'center' });

        // Finalize the PDF document
        doc.end();

        // Handle file cleanup after sending the PDF
        writeStream.on('finish', () => {
            res.download(filePath, (err) => {
                if (err) {
                    console.error('Error sending PDF:', err);
                    res.status(500).send('Error sending PDF');
                }

                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error('Error deleting file:', err);
                    }
                });
            });
        });

    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).send('Error generating invoice');
    }
};


// Function to handle the PDF download request
const downloadPDF = async (req, res) => {
    try {
        const order = await orderSchema
            .findById(req.params.orderId)
            .populate('user_id')
            .populate('items.product_id');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        await generateInvoicePDF(order, res);
    } catch (error) {
        console.error('Error in downloadPDF:', error.message);
        res.status(500).send('Error downloading invoice');
    }
};




const createPaypalOrder = async (req, res) => {
    console.log('Request received for PayPal order creation');
    console.log('Request body:', req.body);
    console.log('User session:', req.session);
    try {
        const user = req.session.user;
        console.log('User:', user);
        const { total, shippingAddress, selectedAddressId } = req.body;
        console.log('Total:', total);
        console.log('Shipping address:', shippingAddress);
        console.log('Selected address ID:', selectedAddressId);

        // Store the selected address ID in the session for later use
        req.session.selectedAddressId = selectedAddressId;
        console.log('Updated session:', req.session);

        if (!total || total <= 0) {
            req.session.userMessage = 'Invalid payment amount';
            console.log('Invalid payment amount');
            console.log('this is the total ', total);
            return res.status(400).json({ error: 'Invalid payment amount' });
        }

        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: "USD",
                        value: total,
                    },
                    shipping: {
                        address: {
                            address_line_1: shippingAddress.address_line_1,
                            address_line_2: shippingAddress.address_line_2,
                            admin_area_2: shippingAddress.admin_area_2,
                            admin_area_1: shippingAddress.admin_area_1,
                            postal_code: shippingAddress.postal_code,
                            country_code: shippingAddress.country_code,
                        },
                    },
                },
            ],
            application_context: {
                return_url: `https://chronix.website/paypal-success`,
                cancel_url: `https://chronix.website/cart/${user._id}`,
            },
        });

        console.log('Request body:', request.requestBody);

        const order = await client.execute(request);
        console.log('Order result:', order.result);
        res.json({ id: order.result.id });
    } catch (error) {
        console.error("Error creating PayPal order:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
};

const handlePaypalSuccess = async (req, res) => {
    console.log('handlePaypalSuccess called');
    try {
        const { token } = req.query;
        const userId = req.session.user._id;
        const selectedAddressId = req.session.selectedAddressId;

        console.log('Fetching order details using token:', token);
        const captureRequest = new paypal.orders.OrdersCaptureRequest(token);
        captureRequest.requestBody({});
        const capture = await client.execute(captureRequest);

        console.log('Capture result:', capture.result);

        if (capture.result.status === "COMPLETED") {
            console.log('Order completed');

            const cart = await cartSchema.findOne({ user_id: userId }).populate('items.product_id').lean();
            console.log('Cart details:', cart);

            if (!cart || !cart.items || cart.items.length === 0) {
                throw new Error("Cart is empty");
            }

            // Calculate total amount from cart items
            const totalAmount = cart.items.reduce((sum, item) => {
                console.log('Calculating total for item:', item);
                return sum + (item.product_id.currentPrice * item.quantity);
            }, 0);

            console.log('Total amount:', totalAmount);

            // Fetch the selected address using the stored ID
            const userAddress = await addressSchema.findOne(
                { "addresses._id": selectedAddressId },
                { "addresses.$": 1 }
            ).lean();

            if (!userAddress || !userAddress.addresses.length) {
                throw new Error("Address not found");
            }

            console.log('Selected address:', userAddress.addresses[0]);

            // Get capture payment details
            const paymentCapture = capture.result.purchase_units[0].payments.captures[0];
            console.log('Payment Capture Details:', paymentCapture);

            // Create order with the correct address
            const order = new orderSchema({
                user_id: userId,
                items: cart.items.map(item => ({
                    product_id: item.product_id._id,
                    quantity: item.quantity,
                    price: item.product_id.currentPrice,
                })),
                totalAmount: totalAmount, // Use calculated total from cart
                payment_method: "PayPal",
                payment_details: {
                    transactionId: paymentCapture.id,
                    status: paymentCapture.status
                },
                shipping_address: userAddress.addresses[0],
                payment_status: "Paid",
                delivery_status: 'Pending'
            });

            console.log('Order to be saved:', order);

            // Save the order
            await order.save();

            console.log('Order saved');

            // Update product stock and clear cart
            for (const item of cart.items) {
                try {
                    console.log('Updating stock for product:', item.product_id._id);
                    await productSchema.updateOne(
                        { _id: item.product_id._id },
                        { $inc: { stock: -item.quantity } }
                    );
                    console.log(`Updated stock for product ${item.product_id._id}`);
                } catch (stockError) {
                    console.error('Error updating stock:', stockError);
                    // Continue with the loop even if one update fails
                }
            }

            console.log('Cart items updated');

            // Delete the cart
            await cartSchema.deleteOne({ user_id: userId });

            console.log('Cart deleted');

            // Clear the stored address ID from session
            delete req.session.selectedAddressId;

            return res.redirect('/orderSuccess');
        } else {
            console.log('Payment not completed:', capture.result.status);
            req.session.userMessage = "Payment Failed. Please try again.";
            return res.redirect('/checkout');
        }
    } catch (error) {
        console.error("Error handling PayPal success:", error);
        req.session.userMessage = "An error occurred during payment processing.";
        res.redirect(`/cart/${req.session.user._id}`);
    }
};



const capturePaypalOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        const userId = req.session.user._id;

        // Fetch and verify order status
        const orderDetailsRequest = new paypal.orders.OrdersGetRequest(orderId);
        const orderDetails = await client.execute(orderDetailsRequest);

        if (orderDetails.result.status !== "APPROVED") {
            req.session.userMessage = "Payment not approved. Try again.";
            return res.redirect('/checkout');
        }

        // Capture the payment
        const captureRequest = new paypal.orders.OrdersCaptureRequest(orderId);
        captureRequest.requestBody({});
        const captureResponse = await client.execute(captureRequest);

        // Reduce product stock
        const cart = await cartSchema.findOne({ user_id: userId }).populate('items.product_id');
        for (let item of cart.items) {
            await productSchema.updateOne(
                { _id: item.product_id._id },
                { $inc: { stock: -item.quantity } }
            );
        }

        // Create and save the order
        await orderSchema.create({
            user_id: userId,
            items: cart.items.map(item => ({
                product_id: item.product_id._id,
                quantity: item.quantity,
                price: item.product_id.currentPrice,
            })),
            totalAmount: captureResponse.result.purchase_units[0].amount.value,
            payment_method: "PayPal",
            shipping_address: captureResponse.result.purchase_units[0].shipping.address,
            payment_status: "Success",
        });

        // Clear the cart
        await cartSchema.deleteOne({ user_id: userId });

        res.redirect('/orderSuccess');
    } catch (error) {
        console.error("Error capturing PayPal order:", error);
        req.session.userMessage = "Payment capture failed. Try again.";
        res.redirect('/checkout');
    }
};





function generateOtp() {
    return otpGenerator.generate(4, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
        expiry: '5m' // 30 minutes
    });
}

function sendOtpEmail(email, otp) {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // or 'STARTTLS'
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD
        },
    });


    const mailOptions = {
        from: 'Chronix Team < ' + process.env.EMAIL + ' >',
        to: email,
        subject: 'Chronix Email Verification Code',
        html: `
           <body style="font-family: 'Georgia', serif; background-color: #000000; padding: 30px; color: #FFFFFF;">
            <div style="max-width: 600px; margin: auto; background-color: #000000; padding: 20px; border: 1px solid #CCCCCC; border-radius: 10px;">
              <div style="text-align: center;">
                <img src="cid:logo" style="width: 200px; height: 80px; object-fit: contain;" alt="Chronix Logo">
              </div>
              <h2 style="color: #D4AF37; font-size: 28px; text-align: center; border-bottom: 1px solid #555; padding-bottom: 10px; margin-bottom: 20px;">Chronix OTP Verification</h2>
              <p style="color: #CCCCCC; font-size: 16px;">Thank you for choosing Chronix! Use the OTP below to complete your verification.</p>
              <p style="text-align: center; font-size: 40px; color: #FFD700; margin: 20px 0; font-weight: bolder; letter-spacing: 2px;">${otp}</p>
              <p style="color: #FF6347; font-size: 14px; text-align: center; font-weight: bold;">DO NOT share this OTP with anyone for your security.</p>
              <p style="color: #CCCCCC; font-size: 16px; text-align: center;">This OTP is valid for <strong>5 minutes</strong>.</p>
              <div style="margin-top: 30px; border-top: 1px solid #555; padding-top: 20px; text-align: center;">
                <p style="color: #D4AF37; font-size: 14px;">If you didn’t request this OTP, please ignore this email or update your password for security.</p>
                <p style="color: #CCCCCC; font-size: 14px; margin-top: 10px;">Best regards,<br> The Chronix Team</p>
              </div>
            </div>
          </body>

        `,
        attachments: [
            {
                filename: 'favicon_without_bg.webp',
                path: __dirname + '/../Public/Images/Logo/favicon_without_bg.webp',
                cid: 'logo'
            }
        ]
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}


// function verifyOtp(email, otp) {
//     console.log(typeof otp, "| typeof otp verifyOtp before storedOTP");
//     console.log(otp, "| otp in verifyOtp before storedOTP");
//     console.log(email, otp, "| email, otp entered in verifyOtp");
//     console.log(req.session.otp, "| req.session.otp in verifyOtp before storedOTP");
//     const storedOtp = req.session.otp;
//     console.log(storedOtp, "| storedOtp");
//     console.log(otp, "otp");
//     console.log(storedOtp === otp, "| storedOtp === otp");
//     return storedOtp === otp;
// }

const loadUserLogin = async (req, res) => {
    try {
        res.render('./User/login.hbs')
    } catch (error) {
        res.status(400).send(error)
    }
}

const loginUser = async (req, res) => {
    try {
        console.log('Login attempt started');
        const { email, password } = req.body;
        console.log(`Received email: ${email}`);
        console.log(`Received password: ${password}`);

        const user = await userSchema.findOne({ email });
        console.log('User fetched from database:', user);

        let wishlist = await wishlistSchema.findOne({ user_id: user._id })
            .populate({
                path: 'items.product_id',
                select: 'product_name product_image currentPrice stock description specification'
            })
            .lean();
        console.log('Wishlist fetched:', wishlist);

        if (!wishlist || wishlist.items.length === 0) {
            console.log('Wishlist is empty or not found');
        }

        if (!user) {
            console.log('User not found');
            return res.render('./User/login.hbs', { message: 'Invalid Credentials' });
        }

        console.log('Password validation started');
        const validPassword = await bcrypt.compare(password, user.password);
        console.log('Password validation result:', validPassword);

        if (!validPassword) {
            console.log('Password is incorrect');
            return res.render('./User/login.hbs', { message: 'Wrong Password' });
        }

        if (user.isAdmin) {
            console.log('User is an admin, redirecting to admin login');
            return res.redirect('/admin');
        }

        if (user.status === false) {
            console.log('User account is blocked');
            return res.render('./User/login.hbs', { message: 'Your account is blocked. Please contact the administrators' });
        }

        req.session.user = user;
        console.log('User session updated:', req.session.user);

        const redirectTo = req.session.returnTo || '/';
        console.log('Redirecting to:', redirectTo);
        delete req.session.returnTo;
        res.redirect(redirectTo);
    } catch (error) {
        console.error('Error during login attempt:', error);
        res.render('./User/login.hbs', { message: 'Invalid Credentials' });
    }
};


const loadUserSignup = async (req, res) => {
    try {
        req.session.newUser = null;
        console.log(req.session.newUser, "req.session.newUser in loadUserSignup");
        res.render('./User/signup.hbs')
    } catch (error) {
        res.status(400).send(error)
    }
}

const registerUser = async (req, res) => {
    console.log("registerUser is entered");
    try {
        console.log(req.body, "req.body in registerUser");
        const { email, username, password, confirmPassword, isAdmin, googleId, profile, status } = req.body;
        console.log(email, username, password, confirmPassword, "variables in registerUser");
        req.session.email = email;
        console.log(req.session.email, "req.session.email in registerUser");

        // Initialize newUser in session
        req.session.newUser = null;

        // If registering with Google, check for existing user by Google ID
        if (googleId) {
            console.log(googleId, "googleId in registerUser");
            const existingUser = await userSchema.findOne({ googleId: profile.id });
            console.log(existingUser, "existingUser in registerUser");
            if (existingUser) {
                console.log("existingUser in registerUser");
                existingUser.email = email;
                console.log(existingUser.email, "existingUser.email in registerUser");
                existingUser.username = username;
                console.log(existingUser.username, "existingUser.username in registerUser");
                await existingUser.save();
                console.log("existingUser saved in registerUser");
                return res.redirect('/');
            } else {
                console.log("No existingUser in registerUser");
                req.session.newUser = new userSchema({
                    email,
                    username,
                    googleId: profile.id,
                });
                console.log(req.session.newUser, "req.session.newUser in registerUser");
                return res.redirect('/');
            }
        }

        // For standard registration flow
        if (!email || !username || !password || !confirmPassword) {
            console.log("One of the fields is empty in registerUser");
            return res.render('./User/signup.hbs', { message: 'All fields are required' });
        }

        // if (username.match(/^\s+/)) {
        //     return res.render('./User/signup.hbs', { message: 'Name should not have leading spaces' });
        // }

        if (password !== confirmPassword) {
            console.log("Passwords do not match in registerUser");
            return res.render('./User/signup.hbs', { message: 'Passwords do not match' });
        }

        const existingUser = await userSchema.findOne({ email });
        console.log(existingUser, "existingUser in registerUser");
        if (existingUser) {
            console.log("User already exists in registerUser");
            return res.render('./User/signup.hbs', { message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, saltround);
        console.log(hashedPassword, "hashedPassword in registerUser");
        req.session.newUser = new userSchema({
            email,
            username,
            password: hashedPassword,
            isAdmin: isAdmin || false,
            status: status || true
        });
        console.log(req.session.newUser, "req.session.newUser in registerUser");

        const otp = generateOtp();
        console.log(otp, "otp in registerUser");
        req.session.otp = otp;
        console.log(req.session.otp, "req.session.otp in registerUser");
        sendOtpEmail(email, otp);
        console.log("Email sent in registerUser");
        res.redirect('/otp');

    } catch (error) {
        console.log(error, "error in registerUser");
        res.render('./User/signup.hbs', { message: 'Something went wrong register user' });
    }
};

const loadUserOtp = async (req, res) => {
    try {
        console.log(req.session.email, "req.session.email");
        res.render('./User/otp.hbs', { email: req.session.email })
    } catch (error) {
        res.status(400).send(error)
    }
}

const postOtp = async (req, res) => {
    try {
        const { otp1, otp2, otp3, otp4 } = req.body;  // Extract OTP parts
        const otpPost = `${otp1}${otp2}${otp3}${otp4}`;  // Combine parts into a single OTP string
        const email = req.session.email;  // Retrieve email from session

        // Check if OTP is entered
        if (!otpPost) {
            return res.render('./User/otp.hbs', { email, message: 'Please enter OTP' });
        }

        // Verify OTP matches the session OTP and that email is available
        if (email && otpPost === req.session.otp) {
            console.log("OTP verified successfully!");

            // Initialize Mongoose model and create new user from session data
            const User = userSchema.model('users');
            const newUser = new User(req.session.newUser);  // Use new User() instead of create()
            console.log(newUser, "newUser in postOtp");
            try {
                await newUser.save();  // Save newUser to the database
                console.log("User saved successfully:", newUser);

                // Redirect to login after saving
                return res.redirect('/login');
                delete req.session.newUser;

            } catch (error) {
                console.log("Error saving new user:", error);
                res.render('./User/otp.hbs', { email, message: 'Failed to save user' });
            }
        } else {
            // Render OTP page with an error message if OTP verification fails
            res.render('./User/otp.hbs', { email, message: 'Invalid OTP, please try again' });
        }
    } catch (error) {
        // Catch unexpected errors
        console.log("Unexpected error:", error);
        res.render('./User/otp.hbs', { email: req.session.email, message: 'An error occurred' });
    }
};


const resendOtp = async (req, res, type) => {
    try {
        const email = req.session.email;
        const otp = generateOtp();
        req.session.otp = otp;
        if (!email) {
            return res.render('./User/otp.hbs', { email, message: 'No recipients defined' });
        }
        sendOtpEmail(email, otp);
        console.log(sendOtpEmail, "sendOtpEmail in resendOtp");
        res.render('./User/otp.hbs', { email, message: 'OTP resent successfully' });
    } catch (error) {
        res.render('./User/otp.hbs', { email, message: 'Error resending OTP' });
    }
}

const loadUserVerifyEmail = async (req, res) => {
    try {
        const message = req.session.userMessage;
        req.session.userMessage = null;
        console.log(message, "message in loadUserVerifyEmail");
        res.render('./User/verifyEmail.hbs', { message })
        req.session.emailVerified = true;
    } catch (error) {
        res.status(400).send(error)
    }
}

const verifyEmail = async (req, res) => {
    try {
        const { email } = req.body;
        console.log(email, "email in verifyEmail");
        const user = await userSchema.findOne({ email });
        if (!user) {
            console.log("User not found in verify email");
            req.session.userMessage = 'User not found';
            return res.redirect('/verifyEmail');
        }
        const otp = generateOtp();
        req.session.otp = otp;
        req.session.email = email; // Ensure email is set in session
        console.log(req.session.otp, "req.session.otp in verifyEmail");
        console.log(email, "email in verifyEmail");
        console.log(sendOtpEmail, "before sendOtpEmail in verifyEmail");
        sendOtpEmail(email, otp);
        console.log(sendOtpEmail(email, otp), "sendOtpEmail in verifyEmail");
        req.session.forgotPassword = true
        res.redirect('/otp-reset-password');
    } catch (error) {
        res.render('./User/verifyEmail.hbs', { message: 'Error sending OTP' });
    }
};


const loadverifyOtpResetPassword = async (req, res) => {
    try {
        console.log(req.session.email, "req.session.email in loadverifyOtpResetPassword");
        res.render('./User/otpResetPassword.hbs', { email: req.session.email })
    } catch (error) {
        res.status(400).send(error)
        console.log(error, 'error in loadverifyOtpResetPassword');
    }
}

const resendOtpResetPassword = async (req, res) => {
    try {
        const email = req.session.email;
        const otp = generateOtp();
        req.session.otp = otp;
        sendOtpEmail(email, otp);
        res.render('./User/otp.hbs', { email, message: 'OTP resent successfully' });
    } catch (error) {
        res.render('./User/otp.hbs', { email, message: 'Error resending OTP' });
    }
}

const verifyOtpResetPassword = async (req, res) => {
    try {
        const { otp1, otp2, otp3, otp4 } = req.body;  // Extract OTP parts
        const otpPost = `${otp1}${otp2}${otp3}${otp4}`;  // Combine parts into a single OTP string
        const email = req.session.email;  // Retrieve email from session
        if (!otpPost) {
            return res.render('./User/otp.hbs', { email, message: 'Please enter OTP' });
        }
        if (email && otpPost === req.session.otp) {
            console.log("OTP verified successfully!");
            res.redirect('/reset-password');
        } else {
            res.render('./User/otpResetPassword.hbs', { email, message: 'Invalid OTP, please try again' });
        }
    } catch (error) {
        res.render('./User/otpResetPassword.hbs', { email: req.session.email, message: 'An error occurred' });
    }
};

const loadResetPassword = async (req, res) => {
    try {
        res.render('./User/resetPassword.hbs')
    } catch (error) {
        res.status(400).send(error)
    }
}

const resetPassword = async (req, res) => {
    try {
        const { password, confirm_password } = req.body;

        if (password !== confirm_password) {
            return res.render('./User/resetPassword.hbs', { message: 'Please enter the same Password' });
        }

        const hashedPassword = await bcrypt.hash(password, saltround);
        const email = req.session.email;

        // Find and update only the password field
        const user = await userSchema.findOneAndUpdate(
            { email },
            { password: hashedPassword },
            { new: true }  // Returns the updated document
        );

        if (!user) {
            return res.render('./User/resetPassword.hbs', { message: 'User not found' });
        }

        res.redirect('/login');
        delete req.session.forgotPassword;
    } catch (error) {
        res.render('./User/resetPassword.hbs', { message: 'Error resetting password' });
    }
};



const loadUserHome = async (req, res) => {
    try {
        const user = req.session.user;
        const userId = user ? user._id : null;

        // Fetch all active products
        const products = await productSchema.find({ isActive: true }).populate('category_id');

        // Fetch all active offers
        const offers = await offerSchema.find({ isActive: true });

        // Process products to apply discounts
        const productsWithDiscount = products.map(product => {
            const productDiscount = offers.find(
                offer => offer.type === 'products' && offer.typeId.toString() === product._id.toString()
            );
            const categoryDiscount = offers.find(
                offer => offer.type === 'categories' && offer.typeId.toString() === product.category_id._id.toString()
            );

            // Calculate discounted price based on the higher discount
            let discount = 0;
            if (productDiscount && categoryDiscount) {
                discount = Math.max(productDiscount.discount, categoryDiscount.discount);
            } else if (productDiscount) {
                discount = productDiscount.discount;
            } else if (categoryDiscount) {
                discount = categoryDiscount.discount;
            }

            const discountedPrice = product.currentPrice - (product.currentPrice * discount) / 100;

            return {
                ...product.toObject(),
                originalPrice: product.currentPrice,
                discountedPrice: discountedPrice.toFixed(2),
                discount
            };
        });

        // Retrieve wishlist items for the user
        let wishlistItems = [];
        if (userId) {
            const wishlist = await wishlistSchema.findOne({ user_id: userId });
            if (!wishlist) {
                // Create a new wishlist if not found
                const newWishlist = new wishlistSchema({ user_id: userId, items: [] });
                await newWishlist.save();
            } else {
                wishlistItems = wishlist.items.map(item => item.product_id.toString());
            }
        }

        // Add wishlist status to products
        const productsWithWishlistStatus = productsWithDiscount.map(product => ({
            ...product,
            inWishlist: wishlistItems.includes(product._id.toString())
        }));

        // Retrieve any session message and clear it afterward
        const message = req.session.userMessage;
        req.session.userMessage = null; // Clear message after retrieving it

        // Render the home page
        res.render('./User/home.hbs', {
            product: productsWithWishlistStatus,
            user,
            message
        });

    } catch (error) {
        console.error('Error loading home page:', error);
        res.status(500).send('Error loading home page');
    }
};



const loadUserExplore = async (req, res) => {
    try {
        const user = req.session.user;
        const userId = user ? user._id : null;
        const totalProducts = await productSchema.countDocuments({ isActive: true });

        const page = parseInt(req.query.page) || 1;
        const itemsPerPage = 4;

        // Get total count of active products
        const totalPages = Math.ceil(totalProducts / itemsPerPage);

        // Fetch products for the current page
        const products = await productSchema
            .find({ isActive: true })
            .populate('category_id')
            .skip((page - 1) * itemsPerPage)
            .limit(itemsPerPage);

        // Fetch active offers
        const activeOffers = await offerSchema.find({ isActive: true });

        const category = await categorySchema.find({ isActive: true });

        let wishlistItems = [];
        if (userId) {
            const wishlist = await wishlistSchema.findOne({ user_id: userId });
            wishlistItems = wishlist ? wishlist.items.map(item => item.product_id.toString()) : [];
        }

        // Calculate discount and add wishlist status
        const productsWithDiscounts = products.map(product => {
            const productOffer = activeOffers.find(
                offer => offer.type === 'products' && offer.typeId.toString() === product._id.toString()
            );
            const categoryOffer = activeOffers.find(
                offer => offer.type === 'categories' && offer.typeId.toString() === product.category_id._id.toString()
            );

            const productDiscount = productOffer ? productOffer.discount : 0;
            const categoryDiscount = categoryOffer ? categoryOffer.discount : 0;

            const discount = Math.max(productDiscount, categoryDiscount);
            const discountedPrice = product.currentPrice - (product.currentPrice * discount) / 100;

            return {
                ...product.toObject(),
                inWishlist: wishlistItems.includes(product._id.toString()),
                discount, // Discount percentage
                discountedPrice: discountedPrice.toFixed(2), // Final price
            };
        });

        res.render('./User/explore.hbs', {
            product: productsWithDiscounts,
            category,
            currentPage: page,
            totalPages,
            user
        });
    } catch (error) {
        console.error('Error retrieving products:', error);
        res.status(500).send('Error retrieving products');
    }
};


const getProducts = async (req, res) => {
    try {
        console.log('getProducts controller reached');

        const {
            search = '',
            category,
            priceMin = 0,
            priceMax = Infinity,
            availability,
            order = '',
            page = 1,
            limit = 4,
        } = req.query;

        console.log('Req query:', req.query);

        const sortOptions = {};
        switch (order) {
            case 'latest':
                sortOptions.createdAt = -1;
                break;
            case 'oldest':
                sortOptions.createdAt = 1;
                break;
            case 'a-z':
                sortOptions.name = 1;
                break;
            case 'z-a':
                sortOptions.name = -1;
                break;
            case 'priceLowToHigh':
                sortOptions.price = 1;
                break;
            case 'priceHighToLow':
                sortOptions.price = -1;
                break;
        }

        console.log('Sort options:', sortOptions);

        const query = { isActive: true };
        if (search) {
            query.$or = [
                { product_name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }
        if (category) query.category_id = category; 
        console.log('typeof query.category:', typeof query.category);
        if (priceMin !== '' && priceMax !== '') {
            query.price = { $gte: Number(priceMin), $lte: Number(priceMax) };
        }
        if (availability) query.stock = availability === 'inStock' ? { $gt: 0 } : 0;

        console.log('Query:', query);

        const skip = (page - 1) * limit;

        const products = await productSchema.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(Number(limit))
            .populate('category_id');

        console.log('Products:', products);

        const totalProducts = await productSchema.countDocuments(query);

        console.log('Total products:', totalProducts);

        const activeOffers = await offerSchema.find({ isActive: true });

        // console.log('Active offers:', activeOffers);

        let wishlistItems = [];
        if (req.session.user) {
            const wishlist = await wishlistSchema.findOne({ user_id: req.session.user._id });
            wishlistItems = wishlist ? wishlist.items.map(item => item.product_id.toString()) : [];
        }

        // console.log('Wishlist items:', wishlistItems);

        const productsWithDiscounts = products.map(product => {
            const productOffer = activeOffers.find(
                offer => offer.type === 'products' && offer.typeId.equals(product._id)
            );
            const categoryOffer = activeOffers.find(
                offer => offer.type === 'categories' && offer.typeId.equals(product.category_id._id)
            );

            const productDiscount = productOffer ? productOffer.discount : 0;
            const categoryDiscount = categoryOffer ? categoryOffer.discount : 0;

            const discount = Math.max(productDiscount, categoryDiscount);
            const discountedPrice = product.currentPrice - (product.currentPrice * discount) / 100;

            return {
                ...product.toObject(),
                inWishlist: wishlistItems.includes(product._id.toString()),
                discount,
                discountedPrice: discountedPrice.toFixed(2),
            };
        });

        console.log('Products with discounts:', productsWithDiscounts);

        const categoryOptions = await categorySchema.find({ isActive: true });

        // console.log('Category options:', categoryOptions);

        const filtersLink = `&search=${search}&category=${category || ''}&availability=${availability || ''}&priceMin=${priceMin}&priceMax=${priceMax}&order=${order}`;

        // console.log('Filters link:', filtersLink);

        const filtersApplied = {
            search:search,
            category:category,
            availability:availability,
            priceMin:priceMin,
            priceMax:priceMax,
            order:order
        }

        console.log('Filters applied:', filtersApplied);

        res.render('./User/explore.hbs', {
            product: productsWithDiscounts,
            totalProducts,
            category: categoryOptions,
            currentPage: Number(page),
            totalPages: Math.ceil(totalProducts / limit),
            filtersLink,
            filtersApplied
        });
    } catch (error) {
        console.error('Error fetching or rendering products:', error);
        res.status(500).json({ message: 'Something went wrong', error });
    }
};



const loadUserProduct = async (req, res) => {
    try {
        const user = req.session.user;
        const userId = user ? user._id : null;

        // Fetch the requested product details
        const product = await productSchema.findById(req.params.productId).populate('category_id');

        if (!product) {
            return res.status(404).send('Product not found');
        }

        // Fetch active offers
        const activeOffers = await offerSchema.find({ isActive: true });

        // Calculate applicable discounts
        const productOffer = activeOffers.find(
            offer => offer.type === 'products' && offer.typeId.toString() === product._id.toString()
        );
        const categoryOffer = activeOffers.find(
            offer => offer.type === 'categories' && offer.typeId.toString() === product.category_id._id.toString()
        );

        const productDiscount = productOffer ? productOffer.discount : 0;
        const categoryDiscount = categoryOffer ? categoryOffer.discount : 0;

        const discount = Math.max(productDiscount, categoryDiscount);
        const discountedPrice = product.currentPrice - (product.currentPrice * discount) / 100;

        // Retrieve the category name
        const category_name = product.category_id ? product.category_id.category_name : 'Unknown';

        // Retrieve other products in the same category (excluding the current product)
        const otherProducts = await productSchema.find({
            category_id: product.category_id._id,
            _id: { $ne: product._id },
            isActive: true,
        });

        // Check if the product is in the user's wishlist
        let inWishlist = false;
        if (userId) {
            const wishlist = await wishlistSchema.findOne({ user_id: userId });
            inWishlist = wishlist
                ? wishlist.items.some(item => item.product_id.toString() === product._id.toString())
                : false;
        }

        // Render the product page with the required data
        res.render('./User/product.hbs', {
            user,
            product: {
                ...product.toObject(),
                discount, // Discount percentage
                discountedPrice: discountedPrice.toFixed(2), // Final price
                inWishlist,
            },
            category_name,
            otherProducts,
        });
    } catch (error) {
        console.error('Error loading product page:', error);
        res.status(500).send('Error loading product page');
    }
};



const loadUserCart = async (req, res) => {
    try {
        const user = req.session.user;
        const userId = user._id;

        // Find the user's cart and populate the product details for each item
        const cart = await cartSchema.findOne({ user_id: userId })
            .populate('items.product_id') // Populate product details
            .exec();

        const message = req.session.userMessage;
        req.session.userMessage = null;

        if (!cart || cart.items.length === 0) {
            return res.render('./User/cart.hbs', {
                cartItems: [],
                totalAmount: 0,
                totalDiscount: 0,
                discountedTotal: 0,
                user,
                message,
            });
        }

        // Fetch active offers
        const activeCategories = await categorySchema.find({ isActive: true }).lean();
        const activeOffers = await offerSchema.find({ isActive: true });

        let totalAmount = 0;
        let totalDiscount = 0;

        // Prepare cart items with discount calculations
        const cartItems = await Promise.all(
            cart.items.map(async (item) => {
                const product = item.product_id;

                // Skip inactive product or category
                if (!product.isActive || !activeCategories.some(cat => cat._id.toString() === product.category_id.toString())) {
                    return {
                        ...item.toObject(),
                        product_id: product,
                        discount: 0,
                        discountedPrice: product.currentPrice * item.quantity,
                    };
                }


                // Retrieve the best discount for the product
                const productOffer = activeOffers.find(
                    (offer) => offer.type === 'products' && offer.typeId.toString() === product._id.toString()
                );
                const categoryOffer = activeOffers.find(
                    (offer) => offer.type === 'categories' && offer.typeId.toString() === product.category_id.toString()
                );

                const productDiscount = productOffer ? productOffer.discount : 0;
                const categoryDiscount = categoryOffer ? categoryOffer.discount : 0;
                const discount = Math.max(productDiscount, categoryDiscount);

                const itemPrice = product.currentPrice * item.quantity;
                const discountedPrice = itemPrice - (itemPrice * discount) / 100;

                // Update totals
                totalAmount += itemPrice;
                totalDiscount += itemPrice - discountedPrice;

                return {
                    ...item.toObject(),
                    product_id: product,
                    discount,
                    discountedPrice,
                };
            })
        );

        // Calculate final totals
        const discountedTotal = totalAmount - totalDiscount;

        // Render the cart page with the calculated values
        res.render('./User/cart.hbs', {
            cartItems,
            totalAmount,
            totalDiscount: totalDiscount.toFixed(2),
            discountedTotal: discountedTotal.toFixed(2),
            user,
            message,
        });
    } catch (error) {
        console.error('Error loading user cart:', error);
        res.status(500).send('An error occurred while loading the cart.');
    }
};



const increaseQuantity = async (req, res) => {
    try {
        const { userId, itemId } = req.params;

        let cart = await cartSchema.findOne({ user_id: userId });
        const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);

        if (itemIndex === -1) {
            return res.status(400).send("Item not found in cart");
        }

        // Fetch the product details to get the stock level
        const product = await productSchema.findById(cart.items[itemIndex].product_id);

        // Check if the product and category are active
        const activeCategories = await categorySchema.find({ isActive: true }).lean();
        if (!product.isActive || !activeCategories.some(cat => cat._id.toString() === product.category_id.toString())) {
            return res.status(400).json({ message: 'Product or its category is inactive' });
        }

        // Check if current quantity is less than the stock
        if (cart.items[itemIndex].quantity < product.stock && cart.items[itemIndex].quantity < 3) {
            // Increase the quantity if it's within stock limits and within max quantity per user
            cart.items[itemIndex].quantity += 1;
            await cart.save();
            res.redirect(`/cart`);  // Redirect back to cart page
        } else if (cart.items[itemIndex].quantity < product.stock) {
            // If quantity is already at stock limit, redirect with a warning
            req.session.userMessage = 'Cannot add more than 3 products per user';
            res.redirect(`/cart`);  // Redirect back to cart page
        } else {
            // If quantity is already at max quantity per user, redirect with a warning
            req.session.userMessage = 'Cannot add more than available product in stock..';
            res.redirect(`/cart`);  // Redirect back to cart page
        }
    } catch (error) {
        console.error("Error increasing quantity:", error);
        res.status(500).send("Error increasing quantity.");
    }
};


const decreaseQuantity = async (req, res) => {
    try {
        const { userId, itemId } = req.params;

        let cart = await cartSchema.findOne({ user_id: userId });
        const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);

        if (itemIndex === -1) {
            return res.status(400).send("Item not found in cart");
        }

        // Fetch the product details to get the stock level
        const product = await productSchema.findById(cart.items[itemIndex].product_id);

        // Check if the product and category are active
        const activeCategories = await categorySchema.find({ isActive: true }).lean();
        if (!product.isActive || !activeCategories.some(cat => cat._id.toString() === product.category_id.toString())) {
            return res.status(400).json({ message: 'Product or its category is inactive' });
        }

        // Decrease the quantity only if it's greater than 1
        if (cart.items[itemIndex].quantity > 1) {
            cart.items[itemIndex].quantity -= 1;
            await cart.save();
        }

        res.redirect(`/cart`);
    } catch (error) {
        console.error("Error decreasing quantity:", error);
        res.status(500).json({ success: false, error: "Error decreasing quantity." });
    }
};

const addToCart = async (req, res) => {
    try {
        // console.log('addToCart called with params:', req.params);

        const userId = req.params.userId;
        // console.log(`Retrieving cart for user ${userId}`);

        let cart = await cartSchema.findOne({ user_id: userId });
        // console.log(`Cart for user ${userId} is: ${cart}`);

        if (!cart) {
            // console.log(`Creating new cart for user ${userId}`);
            cart = new cartSchema({
                user_id: userId,
                items: [{ product_id: req.params.productId, quantity: 1 }],
            });
            // console.log(`New cart created: ${cart}`);
        } else {
            // console.log('cart found');
            const itemIndex = cart.items.findIndex(item => item.product_id.toString() === req.params.productId);
            // console.log(`Item index in cart is: ${itemIndex}`);

            const product = await productSchema.findById(req.params.productId);
            // console.log(`Product details: ${product}`);

            const activeCategories = await categorySchema.find({ isActive: true });
            if (!product.isActive || !activeCategories.some(cat => cat._id.toString() === product.category_id.toString())) {
                // console.log('product or category is inactive');
                return res.status(400).json({ message: 'Product or its category is inactive' });
            }

            if (itemIndex > -1) {
                // console.log('item already in cart');
                if (cart.items[itemIndex].quantity < product.stock) {
                    // console.log('item quantity is less than product stock');
                    if (cart.items[itemIndex].quantity < 3) {
                        // console.log('item quantity is less than 3');
                        cart.items[itemIndex].quantity += 1;
                    } else {
                        // console.log('item quantity is 3 or more');
                        return res.status(400).json({ message: 'Cannot add more than 3 products per user' });
                    }
                } else {
                    // console.log('item quantity is equal to or greater than product stock');
                    return res.status(400).json({ message: 'Cannot add more than available product in stock' });
                }
            } else if (product.stock === 0) {
                // console.log('product is out of stock');
                return res.status(400).json({ message: 'Product out of stock' });
            } else {
                // console.log('adding new item to cart');
                cart.items.push({ product_id: req.params.productId, quantity: 1 });
            }
        }

        await cart.save();
        console.log('cart saved');
        res.status(200).json({ message: 'Product added to cart' });
    } catch (error) {
        console.log('error caught in addToCart:', error);
        res.status(500).json({ error: "Failed to add product to cart" });
    }
};



const updateCartQuantity = async (req, res) => {

};

const removeCartItem = async (req, res) => {
    try {
        const { userId, itemId } = req.params;
        await cartSchema.updateOne({ user_id: userId }, { $pull: { items: { _id: itemId } } });
        res.redirect(`/cart`);
    } catch (error) {
        res.status(500).json({ error: "Failed to remove item" });
    }
};


const loadUserCheckout = async (req, res) => {
    try {
        const user = req.session.user;
        const testEmail = process.env.TEST_EMAIL;
        const testPassword = process.env.TEST_PASSWORD;

        const message = req.session.userMessage;
        req.session.userMessage = null;


        // Fetch user addresses and states
        const userAddresses = await addressSchema.findOne({ user_id: user._id }).lean();
        const places = await placeSchema.find({}).select('state -_id');
        const states = places.map((place) => place.state);

        // Fetch cart and calculate subtotal with offers
        const cart = await cartSchema
            .findOne({ user_id: user._id })
            .populate('items.product_id')
            .lean();

        if (!cart || !cart.items.length) {
            return res.render('./User/checkout.hbs', {
                user,
                states,
                userAddresses: userAddresses ? userAddresses.addresses : [],
                cartSummary: { subtotal: 0, subtotalDiscount: 0, tax: 0, shipping: 0, total: 0 },
                cart: null,
                message: 'Your cart is empty due to the selection of inactive products',
                coupons: [],
            });
        }

        const activeOffers = await offerSchema.find({ isActive: true }).lean();

        // Calculate prices with discounts

        let subtotal = 0;
        let subtotalDiscount = 0;

        const cartItems = cart.items.map((item) => {
            const product = item.product_id;

            // Find the best discount
            const productOffer = activeOffers.find(
                (offer) => offer.type === 'products' && offer.typeId.toString() === product._id.toString()
            );
            const categoryOffer = activeOffers.find(
                (offer) => offer.type === 'categories' && offer.typeId.toString() === product.category_id.toString()
            );

            const productDiscount = productOffer ? productOffer.discount : 0;
            const categoryDiscount = categoryOffer ? categoryOffer.discount : 0;
            const discount = Math.max(productDiscount, categoryDiscount);
            const itemPrice = product.currentPrice * item.quantity;
            const discountedPrice = (itemPrice - (itemPrice * discount) / 100).toFixed(2);

            subtotal += parseFloat(discountedPrice);
            subtotalDiscount += parseFloat((itemPrice - discountedPrice).toFixed(2));

            return {
                ...item,
                discountedPrice,
                discount,
            };
        });

        const tax = subtotal * 0.1;
        const shipping = 50; // Fixed shipping cost
        const total = subtotal - subtotalDiscount + tax + shipping;

        // Filter valid coupons
        const userData = await userSchema.findById(user._id).lean();

        const coupons = await couponSchema.find({
            status: true,
            endDate: { $gt: new Date() },
            _id: { $nin: (userData).usedCoupons },
        }).lean();

        res.render('./User/checkout.hbs', {
            user,
            states,
            userAddresses: userAddresses ? userAddresses.addresses : [],
            cartSummary: { subtotal, subtotalDiscount, tax, shipping, total },
            cartItems,
            message,
            coupons,
            testEmail,
            testPassword,
        });
    } catch (error) {
        console.error('Error loading checkout page:', error);
        res.status(500).send(error);
    }
};




const getPaypalCredentials = async (req, res) => {
    try {
        const { Email, Password } = req.params
        res.render('./User/paypalCredentials.hbs', { Email, Password })
    } catch {
        res.status(400).send(error);
        console.log(error, "error in getPaypalCredentials");
    }
}

const addNewAddressCheckout = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { flatNo, area, pincode, townCity, state, phoneNumber } = req.body;

        // Find the user document by userId
        let addressDoc = await addressSchema.findOne({ user_id: userId });

        if (!addressDoc) {
            // Create a new user address document
            addressDoc = new addressSchema({
                user_id: userId,
                addresses: []
            });
        }

        // Create a new address object
        const newAddress = {
            flatNo,
            area,
            pincode,
            townCity,
            state,
            phoneNumber,
            isDefault: false, // default new address to false
        };

        // Add the new address to the addresses array
        addressDoc.addresses.push(newAddress);

        // Save the document
        await addressDoc.save();

        // Redirect to the user's profile page after saving
        res.redirect(`/checkout`);
    } catch (error) {
        console.error("Error adding new address:", error);
        res.status(500).send("Internal server error");
    }
};

const editAddressCheckout = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { addressId, flatNo, area, pincode, townCity, state, phoneNumber } = req.body;

        // Find the user's address document
        const addressDoc = await addressSchema.findOne({ user_id: userId });

        if (addressDoc) {
            // Find the address to update
            const address = addressDoc.addresses.id(addressId);

            if (address) {
                // Update the fields
                address.flatNo = flatNo;
                address.area = area;
                address.pincode = pincode;
                address.townCity = townCity;
                address.state = state;
                address.phoneNumber = phoneNumber;

                // Save the updated address document
                await addressDoc.save();

                // Redirect the user back to their profile page
                res.redirect(`/checkout`);
            } else {
                // If the address ID was not found
                res.status(404).send("Address not found");
            }
        } else {
            // Handle if the user document doesn't exist
            res.status(404).send("User not found");
        }
    } catch (error) {
        console.error("Error editing address:", error);
        res.status(500).send("Internal server error");
    }
};

const applyCoupon = async (req, res) => {
    console.log('in applyCoupon\n\n');
    try {
        const { couponCode } = req.body;
        const userId = req.session.user._id;

        // Validate coupon
        const coupon = await couponSchema.findOne({ code: couponCode, status: true });
        if (!coupon) {
            console.log('coupon not found');
            return res.json({ success: false, message: 'Invalid or expired coupon' });
        }

        // Check user usage
        const user = await userSchema.findById(userId);
        if (user.usedCoupons.includes(coupon._id)) {
            console.log('coupon already used');
            return res.json({ success: false, message: 'Coupon already used' });
        }

        // Calculate subtotal
        const cart = await cartSchema
            .findOne({ user_id: userId })
            .populate('items.product_id')
            .lean();

        if (!cart || !cart.items.length) {
            console.log('cart is empty');
            return res.json({ success: false, message: 'Cart is empty' });
        }

        const subtotal = cart.items.reduce((sum, item) => {
            const productPrice = item.product_id.currentPrice;
            const quantity = item.quantity;
            return sum + productPrice * quantity;
        }, 0);

        // Calculate discount
        const discountAmount = (subtotal * coupon.discount) / 100;
        const newSubtotal = subtotal - discountAmount;

        const tax = newSubtotal * 0.1;
        const shipping = 50; // Fixed shipping cost
        const newTotal = newSubtotal + tax + shipping;

        console.log('newSubtotal:', newSubtotal, 'discountAmount:', discountAmount, 'newTotal:', newTotal);

        // Save coupon usage
        req.session.usedCoupon = coupon._id;
        req.session.usedCouponCode = coupon.code;
        req.session.usedCouponDiscount = discountAmount;



        res.json({
            success: true,
            newSubtotal,
            discountAmount,
            newTotal,
            message: 'Coupon applied successfully',
            couponUsed: true
        });
    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const removeCoupon = async (req, res) => {
    try {

        res.json({ success: true });
        req.session.usedCoupon = null;
        req.session.usedCouponCode = null;
        req.session.usedCouponDiscount = null;
    } catch (error) {
        console.error('Error removing coupon:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};




const submitOrder = async (req, res) => {
    try {
        const { selectedAddressId, paymentMethod, orderTotal } = req.body;
        const user = req.session.user;
        const userId = user._id;

        // Retrieve user’s cart details
        const cart = await cartSchema.findOne({ user_id: userId }).populate('items.product_id').lean();

        if (!cart || !cart.items || cart.items.length === 0) {
            return res.status(400).json({ message: 'Your cart is empty. Please add products to place an order.' });
        }

        // Retrieve selected address
        const userAddress = await addressSchema.findOne(
            { "addresses._id": selectedAddressId },
            { "addresses.$": 1 }
        ).lean();

        if (!userAddress || !userAddress.addresses.length) {
            req.session.userMessage = "Address not found.";
            return res.redirect('/checkout');
        }

        // Check stock and update stock or remove out-of-stock items
        for (let item of cart.items) {
            const product = await productSchema.findById(item.product_id._id);
            if (!product || product.stock < item.quantity) {
                req.session.userMessage = `Stock unavailable for ${product ? product.product_name : "a product"}`;
                return res.redirect('/cart');
            }
            product.stock -= item.quantity;
            await product.save();
        }

        // Calculate discount if coupon is applied
        let discountAmount = 0;
        if (req.session.discountAmount) {
            discountAmount = req.session.discountAmount;
        }

        // Calculate totals
        const subtotal = cart.items.reduce((sum, item) => sum + (item.product_id.currentPrice * item.quantity), 0);
        const tax = subtotal * 0.1; // Assuming 10% tax
        const shipping = 5.00; // Flat shipping fee
        const totalAmount = subtotal + tax + shipping - discountAmount;

        // Restrict COD for high-value orders
        console.log(orderTotal, 'is the order total in submitOrder');
        if (paymentMethod === 'cod' && orderTotal > 50000) {
            req.session.userMessage = "COD payment method is not available for orders above ₹50000.";
            return res.redirect('/checkout');
        }

        // Create and save the order
        const order = new orderSchema({
            user_id: userId,
            items: cart.items.map(item => ({
                product_id: item.product_id._id,
                quantity: item.quantity,
                price: item.product_id.currentPrice,
            })),
            totalAmount: totalAmount,
            discount: discountAmount,
            couponCode: req.session.usedCouponCode || null,
            payment_method: paymentMethod,
            shipping_address: userAddress.addresses[0],
            payment_status: paymentMethod === 'cod' ? 'Processing' : 'Paid',
            delivery_status: 'Processing',
        });

        await order.save();

        // Mark the coupon as used
        if (req.session.usedCoupon) {
            await userSchema.updateOne({ _id: userId }, { $push: { usedCoupons: req.session.usedCoupon } });
        }

        // Clear session and cart
        delete req.session.usedCoupon;
        delete req.session.usedCouponCode;
        delete req.session.discountAmount;

        await cartSchema.deleteOne({ user_id: userId });

        res.status(200).json({ message: "Order placed successfully!" });
    } catch (error) {
        console.error("Error in submitOrder:", error);
        req.session.userMessage = "Something went wrong. Please try again.";
        return res.redirect('/checkout');
    }
};



const orderSuccess = async (req, res) => {
    try {
        const user = req.session.user;
        res.render('./User/orderSuccess.hbs', { user });
    } catch (error) {
        console.error("Error in orderSuccess:", error);
        res.status(500).send("Error while loading order success page.");
    }
}




const loadUserProfile = async (req, res) => {
    try {
        const user = req.session.user;
        const message = req.session.userMessage
        req.session.userMessage = null

        if (message) {
            console.log(message, 'message in loadUserProfile');
        }

        // Fetch all states without districts (districts will be fetched dynamically)
        const places = await placeSchema.find({}).select('state -_id');
        const states = places.map((place) => place.state);

        // Fetch the address document for the user
        const addressDoc = await addressSchema.findOne({ user_id: user._id });
        const addresses = addressDoc ? addressDoc.addresses : [];

        // Render profile view with user, addresses, and states
        res.render('./User/profile.hbs', { user, addresses, states, message });
    } catch (error) {
        console.error("Error loading user profile:", error);
        res.status(400).send(error);
    }
};

const resetPasswordBySession = async (req, res) => {
    try {
        const { userId } = req.params
        const { currentPassword, newPassword, confirmPassword } = req.body;
        console.log('Entered resetPasswordBySession');

        // Check if all fields are provided
        if (!currentPassword || !newPassword || !confirmPassword) {
            console.log('checking all fields');
            req.session.userMessage = 'All fields are required';
            return res.redirect('/profile');
        }

        // Check if new password and confirm password match
        if (newPassword !== confirmPassword) {
            console.log('matching passwords');
            req.session.userMessage = 'New passwords do not match';
            return res.redirect('/profile');
        }

        // Retrieve user from the database
        const user = await userSchema.findById(userId);
        if (!user) {
            console.log('checking user');
            req.session.userMessage = 'User not found';
            return res.redirect('/profile');
        }

        // Check if current password is correct
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            console.log('matching the current password..');
            req.session.userMessage = 'Current password is incorrect';
            return res.redirect('/profile');
        }

        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, saltround);

        // Update user's password
        user.password = hashedNewPassword;
        await user.save();
        console.log('password saved successfully');
        req.session.userMessage = 'Password updated successfully';
        return res.redirect('/profile');

    } catch (error) {
        console.error("Error resetting password:", error);
        req.session.userMessage = 'Something went wrong';
        return res.redirect('/profile');
    }
};


const updateName = async (req, res) => {
    try {
        const user = req.session.user;
        const { username } = req.body;
        console.log(username, "username in updateName");
        console.log(user, "user in updateName");
        console.log(user._id, "user._id in updateName");

        if (username.match(/^\s+/)) {
            req.session.userMessage = 'Username cannot be empty or contain only spaces';
            return res.redirect('/profile');
        }

        await userSchema.updateOne({ _id: user._id }, { $set: { username: username } });
        req.session.user = await userSchema.findById(user._id);
        res.redirect('/profile');
    } catch (error) {
        res.status(400).send(error);
    }
}


const setDefaultAddress = async (req, res) => {
    try {
        const userId = req.params.userId;
        const selectedAddressId = req.body.selectedAddressId;

        // Find the user's address document
        const addressDoc = await addressSchema.findOne({ user_id: userId });

        if (addressDoc) {
            // Set all addresses' isDefault to false
            addressDoc.addresses.forEach((address) => {
                address.isDefault = false;
            });

            // Set isDefault to true for the selected address
            const selectedAddress = addressDoc.addresses.find(
                (address) => address._id.toString() === selectedAddressId
            );

            if (selectedAddress) {
                selectedAddress.isDefault = true;
            }

            // Save the updated document
            await addressDoc.save();
            res.redirect(`/profile`); // Redirect to refresh the profile page
        } else {
            res.status(404).send("Address document not found.");
        }
    } catch (error) {
        console.error("Error setting default address:", error);
        res.status(500).send("Internal server error");
    }
};


const addNewAddress = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { flatNo, area, pincode, townCity, state, phoneNumber } = req.body;

        // Find the user document by userId
        let addressDoc = await addressSchema.findOne({ user_id: userId });

        if (!addressDoc) {
            // Create a new user address document
            addressDoc = new addressSchema({
                user_id: userId,
                addresses: []
            });
        }

        // Create a new address object
        const newAddress = {
            flatNo,
            area,
            pincode,
            townCity,
            state,
            phoneNumber,
            isDefault: false, // default new address to false
        };

        // Add the new address to the addresses array
        addressDoc.addresses.push(newAddress);

        // Save the document
        await addressDoc.save();

        // Redirect to the user's profile page after saving
        res.redirect(`/profile`);
    } catch (error) {
        console.error("Error adding new address:", error);
        res.status(500).send("Internal server error");
    }
};

const getDistricts = async (req, res) => {
    try {
        const state = req.params.state;
        const place = await placeSchema.findOne({ state }).select('districts -_id');
        res.json(place ? place.districts : []);
        // res.render('./User/profile.hbs', { districts: place ? place.districts : [] });
    } catch (error) {
        console.error("Error fetching districts:", error);
        res.status(500).json({ error: "Error fetching districts" });
    }
};


const editAddress = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { addressId, flatNo, area, pincode, townCity, state, phoneNumber } = req.body;

        // Find the user's address document
        const addressDoc = await addressSchema.findOne({ user_id: userId });

        if (addressDoc) {
            // Find the address to update
            const address = addressDoc.addresses.id(addressId);

            if (address) {
                // Update the fields
                address.flatNo = flatNo;
                address.area = area;
                address.pincode = pincode;
                address.townCity = townCity;
                address.state = state;
                address.phoneNumber = phoneNumber;

                // Save the updated address document
                await addressDoc.save();

                // Redirect the user back to their profile page
                res.redirect(`/profile`);
            } else {
                // If the address ID was not found
                res.status(404).send("Address not found");
            }
        } else {
            // Handle if the user document doesn't exist
            res.status(404).send("User not found");
        }
    } catch (error) {
        console.error("Error editing address:", error);
        res.status(500).send("Internal server error");
    }
};


const deleteAddress = async (req, res) => {
    try {
        const userId = req.params.userId;
        const addressId = req.params.addressId;  // Get the addressId from the form body

        // Find the user's address document
        const addressDoc = await addressSchema.findOne({ user_id: userId });

        if (addressDoc) {
            // Pull the address with the given ID
            addressDoc.addresses = addressDoc.addresses.filter(addr => addr._id.toString() !== addressId);

            if (addressDoc.addresses.length === 0) {
                // If the addresses array is now empty, remove the whole addressDoc
                await addressSchema.deleteOne({ user_id: userId });
            } else {
                // Save the updated address document
                await addressDoc.save();
            }

            // Redirect back to the profile page
            res.redirect(`/profile`);
        } else {
            res.status(404).send("User not found");
        }
    } catch (error) {
        console.error("Error deleting address:", error);
        res.status(500).send("Internal server error");
    }
};



const loadUserOrders = async (req, res) => {
    try {
        const user = req.session.user;
        const message = req.session.userMessage;
        req.session.userMessage = null;

        // Fetch user orders with populated product details
        const orders = await orderSchema.find({ user_id: user._id })
            .populate('items.product_id')
            .populate('couponCode')
            .sort({ orderedOn: -1 })
            .lean()
            .skip((req.query.page - 1) * 6)
            .limit(6);

        const totalOrders = await orderSchema.countDocuments({ user_id: user._id });
        const totalPages = Math.ceil(totalOrders / 6);

        res.render('./User/orders.hbs', {
            user,
            orders,
            message,
            currentPage: req.query.page ? parseInt(req.query.page) : 1,
            totalPages
        });

    } catch (error) {
        res.status(400).send(error);
    }
};

const cancelOrder = async (req, res) => {
    try {
        console.log('Cancel order process started');
        const { orderId } = req.params;
        console.log(`Order ID: ${orderId}`);

        const order = await orderSchema.findById(orderId);
        console.log(`Order found: ${order}`);

        if (!order) {
            console.log('Order not found');
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.delivery_status === 'Cancelled') {
            console.log('Order already cancelled');
            return res.status(400).json({ success: false, message: 'Order already cancelled' });
        }

        if (order.payment_method !== 'cod') {
            console.log('Payment method is not COD, refunding');
            order.payment_status = 'Refunded';
            console.log(order.totalAmount, 'is the order total amount');
            console.log(order.user_id, 'is the user id');
            let wallet = await walletSchema.findOne({ user_id: order.user_id });

            if (!wallet) {
                wallet = await walletSchema.create({ user_id: order.user_id, totalAmount: 0 });
                console.log('Wallet created for user');
            }

            await walletSchema.updateOne({ user_id: order.user_id }, { $inc: { totalAmount: order.totalAmount } });

            const walletTransaction = await walletSchema.updateOne({ user_id: order.user_id }, {
                $push: {
                    transactions: {
                        amount: order.totalAmount,
                        type: 'credit',
                        description: `Refund of order #${order._id}`,
                        order_id: order._id
                    }
                }
            });
            console.log(walletTransaction, 'is the wallet transaction');
            console.log('Transaction added to wallet');
        } else {
            console.log('Payment method is COD, cancelling payment');
            order.payment_status = 'Payment Cancelled';
        }

        order.delivery_status = 'Cancelled';
        await order.save();
        console.log('Order delivery status updated to Cancelled and saved');

        for (let item of order.items) {
            await productSchema.findByIdAndUpdate(item.product_id, { $inc: { stock: item.quantity } });
            console.log(`Product stock restored for product ID: ${item.product_id}`);
        }

        res.json({ success: true });
        console.log('Order cancellation successful');
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const returnOrderRequest = async (req, res) => {
    try {
        const user = req.session.user
        const { orderId } = req.params;
        const { returnReason } = req.body;
        const order = await orderSchema.findById(orderId);
        if (!order) {
            req.session.userMessage = 'Order not found';
            return res.redirect('/orders');
        }
        console.log(order.delivery_status, 'is the delivery status of the order');
        console.log(order._id, 'is the id of the order');
        if (order.delivery_status !== 'Delivered') {
            req.session.userMessage = 'Order must be delivered to request return';
            return res.redirect('/orders');
        }
        if (order.payment_status !== 'Paid') {
            req.session.userMessage = 'Order must be paid to request return';
            return res.redirect('/orders');
        }
        const existingRequest = await returnRequestSchema.findOne({ order_id: orderId });
        if (existingRequest) {
            req.session.userMessage = 'Return request already exists for this order';
            return res.redirect('/orders');
        }
        const returnRequest = await returnRequestSchema.create({
            user_id: user._id,
            order_id: orderId,
            returnReason
        });
        if (!returnRequest) {
            req.session.userMessage = 'Failed to create return request';
            return res.redirect('/orders');
        }
        order.delivery_status = 'Return Requested';
        await order.save();
        req.session.userMessage = 'Return request sent successfully';
        res.redirect('/orders');
    } catch (error) {
        console.error('Error cancelling order:', error);
        req.session.userMessage = 'Server error';
        res.redirect('/orders');
    }
}

const orderCancel = async (req, res) => {
    try {
        const user = req.session.user;
        res.render('./User/orderCancel.hbs', { user });
    } catch (error) {
        console.error("Error in orderCancel:", error);
        res.status(500).send("Error while loading order Cancel page.");
    }
}



const loadUserReviews = async (req, res) => {
    try {
        const user = req.session.user
        res.render('./User/reviews.hbs', { user })
    } catch (error) {
        res.status(400).send(error)
    }
}

const loadUserWallet = async (req, res) => {
    try {
        const user = req.session.user;
        const message = req.session.userMessage;
        req.session.userMessage = null;

        const page = req.query.page ? parseInt(req.query.page) : 1;
        const limit = 3;

        let wallet = await walletSchema.findOne({ user_id: user._id })
            .populate('transactions.order_id')
            .lean();

        if (!wallet) {
            wallet = await walletSchema.create({ user_id: user._id });
        }

        const transactions = wallet.transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice((page - 1) * limit, page * limit);

        const totalTransactions = wallet.transactions.length;
        const totalPages = Math.ceil(totalTransactions / limit);

        res.render('./User/wallet.hbs', {
            user,
            wallet: { ...wallet, transactions },
            message,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        res.status(400).send(error);
    }
};

const loadUserWishlist = async (req, res) => {
    try {
        const user = req.session.user;
        // const product = await productSchema.find();
        const userId = user._id;
        // console.log(user, 'user in loadUserCart');
        // Find the user's wishlist and populate the product details for each item
        let wishlist = await wishlistSchema.findOne({ user_id: userId })
            .populate({
                path: 'items.product_id',
                select: 'product_name product_image currentPrice stock description specification'
            })
            .lean(); // Convert MongoDB documents to plain JavaScript objects



        console.log(wishlist.items, "\nis the wishlist in loadUserWishlist");

        const message = req.session.userMessage;
        req.session.userMessage = null;

        // Check if the wishlist exists and has items
        if (!wishlist || wishlist.items.length === 0) {
            return res.render('./User/wishlist.hbs', {
                wishlistItems: [],
                totalAmount: 0,
                user,
                message
            });
        }

        const wishlistItems = wishlist.items.map(item => ({
            ...item,
            product_id: {
                ...item.product_id,
                stock: item.product_id.stock
            }
        }));

        console.log(wishlistItems, "is the stock of the product in loadUserWishlist");

        // Render the wishlist page with wishlist items and total amount
        res.render('./User/wishlist.hbs', {
            wishlistItems,
            user,
            message
        });
    } catch (error) {
        res.status(400).send(error)
    }
}

const toggleWishlistItem = async (req, res) => {
    try {
        const user = req.session.user;
        const userId = user._id;
        const { productId } = req.params;

        console.log(`Toggling product ${productId} for wishlist of user ${userId}`);

        // Find the user's wishlist
        let wishlist = await wishlistSchema.findOne({ user_id: userId });

        if (!wishlist) {
            // Create a new wishlist if not found
            wishlist = new wishlistSchema({
                user_id: userId,
                items: [{ product_id: productId }]
            });
            await wishlist.save();
            return res.status(200).json({ inWishlist: true, message: 'Product added to wishlist' });
        }

        // Check if the product is already in the wishlist
        const productIndex = wishlist.items.findIndex(item => item.product_id.toString() === productId);

        if (productIndex > -1) {
            // Remove the product if it exists
            wishlist.items.splice(productIndex, 1);
            await wishlist.save();
            return res.status(200).json({ inWishlist: false, message: 'Product removed from wishlist' });
        } else {
            // Add the product if it doesn't exist
            wishlist.items.push({ product_id: productId });
            await wishlist.save();
            return res.status(200).json({ inWishlist: true, message: 'Product added to wishlist' });
        }
    } catch (error) {
        console.error('Error toggling wishlist:', error);
        res.status(500).json({ message: 'Failed to toggle wishlist item' });
    }
};


const removeWishlistItem = async (req, res) => {
    try {
        const user = req.session.user;
        const userId = user._id;
        const { itemId } = req.params;
        console.log(itemId, 'is the itemId in removeWishlistItem');
        console.log(userId, 'is the userId in removeWishlistItem');
        try {
            await wishlistSchema.updateOne({ user_id: userId }, { $pull: { items: { product_id: itemId } } });
            req.session.userMessage = 'Wishlist Item removed successfully';
            res.redirect(`/wishlist`);
        } catch (error) {
            req.session.userMessage = 'Error updating wishlist'
            res.redirect(`/wishlist`);
        }

    } catch (error) {
        res.status(500).json({ error: "Failed to remove item" });
    }
};



const addWishlistItem = async (req, res) => {
    try {
        const user = req.session.user;
        const userId = user._id; // User ID from session
        const { productId } = req.params; // Product ID from route params

        console.log(`Attempting to add product ${productId} to wishlist for user ${userId}`);

        // Check if the wishlist exists for the user
        let wishlist = await wishlistSchema.findOne({ user_id: userId });

        if (!wishlist) {
            // Create a new wishlist if not found
            wishlist = new wishlistSchema({
                user_id: userId,
                items: [{ product_id: productId }] // Ensure productId is passed correctly
            });
        } else {
            // Add the product to the wishlist if not already added
            const productExists = wishlist.items.some(item => item.product_id.toString() === productId);
            if (!productExists) {
                wishlist.items.push({ product_id: productId });
            } else {
                return res.status(400).json({ message: 'Product already in wishlist' });
            }
        }

        // Save the wishlist
        await wishlist.save();
        res.status(200).json({ message: 'Product added to wishlist successfully' });
    } catch (error) {
        console.log('Error adding to wishlist:', error);
        res.status(500).json({ message: 'Failed to add product to wishlist from Backend' });
    }
};


const logoutUser = async (req, res) => {
    try {
        console.log("Logout request received");
        delete req.session.user
        res.redirect('/');
    } catch (error) {
        res.status(400).send(error).json({ error: "Failed to logout" });
    }
}


module.exports = {
    loadUserInvoice,
    generateInvoiceImage,
    downloadImage,
    generateInvoiceImage,
    downloadPDF,
    generateInvoicePDF,
    createPaypalOrder,
    handlePaypalSuccess,
    capturePaypalOrder,
    loadUserHome,
    loadUserCart,
    increaseQuantity,
    decreaseQuantity,
    addToCart,
    updateCartQuantity,
    removeCartItem,
    loadUserExplore,
    getProducts,
    getPaypalCredentials,
    addNewAddressCheckout,
    editAddressCheckout,
    applyCoupon,
    removeCoupon,
    submitOrder,
    orderSuccess,
    // filterProducts,
    loadUserProfile,
    resetPasswordBySession,
    updateName,
    setDefaultAddress,
    addNewAddress,
    getDistricts,
    editAddress,
    deleteAddress,
    loadUserOrders,
    cancelOrder,
    returnOrderRequest,
    orderCancel,
    loadUserReviews,
    loadUserWallet,
    loadUserWishlist,
    toggleWishlistItem,
    removeWishlistItem,
    addWishlistItem,
    loadUserLogin,
    loadUserSignup,
    registerUser,
    loginUser,
    loadUserProduct,
    loadUserCheckout,
    loadUserOtp,
    postOtp,
    resendOtp,
    loadUserVerifyEmail,
    verifyOtpResetPassword,
    verifyEmail,
    loadverifyOtpResetPassword,
    resetPassword,
    loadResetPassword,
    resendOtpResetPassword,
    logoutUser
}

