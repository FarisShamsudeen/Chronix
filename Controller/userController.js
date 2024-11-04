const userSchema = require('../Model/userModel')
const bcrypt = require('bcrypt')
const saltround = 10
const passport = require('passport');
require('dotenv').config();
// require('../Config/passport');
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');

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
          <body style="background-color: #000; color: #fff; padding: 20px; text-align: center;">
          <h1 style="font-size: 36px; color: grey;">Chronix Email Verification</h1>
          <h2 class="secondary-color">Welcome to Chronix!</h2>
          <p class="secondary-color">Thank you for registering with Chronix, the ultimate collection of luxury watches.</p>
          <p class="secondary-color">Your One-Time Password (OTP) for verifying your email is:</p>
          <h3 style="font-size: 34px; color: yellow;">${otp}</h3>
          <p class="secondary-color">This OTP is valid for 5 minutes. Please do not share this code with anyone.</p>
          <p class="secondary-color">Looking forward to seeing you on Chronix!</p>
          <p class="secondary-color">Best regards, <br> Chronix Team</p>
        `
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}


function verifyOtp(email, otp) {
    console.log(typeof otp, "| typeof otp verifyOtp before storedOTP");
    console.log(otp, "| otp in verifyOtp before storedOTP");
    console.log(email, otp, "| email, otp entered in verifyOtp");
    console.log(req.session.otp, "| req.session.otp in verifyOtp before storedOTP");
    const storedOtp = req.session.otp;
    console.log(storedOtp, "| storedOtp");
    console.log(otp, "otp");
    console.log(storedOtp === otp, "| storedOtp === otp");
    return storedOtp === otp;
}

const loadUserLogin = async (req, res) => {
    try {
        res.render('./User/login.hbs')
    } catch (error) {
        res.status(400).send(error)
    }
}

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userSchema.findOne({ email });
        if (!user) return res.render('./User/login.hbs', { message: 'Invalid Credentials' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.render('./User/login.hbs', { message: 'Wrong Password' });

        if (user.isAdmin) return res.redirect('/admin/login?message=Please login again ');
        
        if (user.status === false) return res.render('./User/login.hbs', { message: 'Your account is blocked. Please contact the administrators' })

        const username = user.username;
        req.session.user = user;
        res.render('./User/home.hbs', { username });
    } catch (error) {
        res.render('./User/login.hbs', { message: 'Invalid Credentials' });
    }
}


const googleLogin = (req, res) => {
    passport.authenticate('google', { scope: ['profile', 'email'] });
};



const googleLoginCallback = (req, res) => {
    passport.authenticate('google', {
        failureRedirect: '/user/login',
        successRedirect: '/user/home'
    })
};


const loadUserSignup = async (req, res) => {
    try {
        res.render('./User/signup.hbs')
    } catch (error) {
        res.status(400).send(error)
    }
}

const registerUser = async (req, res) => {
    try {
        const { email, username, password, confirmPassword, isAdmin, googleId, profile, status } = req.body;
        req.session.email = email;
        console.log(req.session.email, "req.session.email");

        // Initialize newUser in session
        req.session.newUser = null;

        // If registering with Google, check for existing user by Google ID
        if (googleId) {
            console.log(googleId, "googleId");
            const existingUser = await userSchema.findOne({ googleId: profile.id });
            if (existingUser) {
                console.log(existingUser, "existingUser");
                existingUser.email = email;
                existingUser.username = username;
                await existingUser.save();
                return res.redirect('/home');
            } else {
                console.log(profile, "profile");
                req.session.newUser = new userSchema({
                    email,
                    username,
                    googleId: profile.id,
                });
                return res.redirect('/home');
            }
        }

        // For standard registration flow
        if (!email || !username || !password || !confirmPassword) {
            return res.render('./User/signup.hbs', { message: 'All fields are required' });
        }

        if (password !== confirmPassword) {
            return res.render('./User/signup.hbs', { message: 'Passwords do not match' });
        }

        const existingUser = await userSchema.findOne({ email });
        if (existingUser) {
            return res.render('./User/signup.hbs', { message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, saltround);
        console.log(hashedPassword, "hashedPassword");
        req.session.newUser = new userSchema({
            email,
            username,
            password: hashedPassword,
            isAdmin: isAdmin || false,
            status: status || true
        });

        console.log(req.session.newUser, "newUser before save");

        const otp = generateOtp();
        req.session.otp = otp;
        console.log(req.session.otp, "req.session.otp in registerUser after generateOtp");
        console.log(typeof req.session.otp, "typeof req.session.otp in registerUser after generateOtp");
        sendOtpEmail(email, otp);

        res.redirect('/user/otp');
    } catch (error) {
        res.render('./User/signup.hbs', { message: 'Something went wrong' });
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
                return res.redirect('/user/login');
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
        sendOtpEmail(email, otp);
        res.render('./User/otp.hbs', { email, message: 'OTP resent successfully' });
    } catch (error) {
        res.render('./User/otp.hbs', { email, message: 'Error resending OTP' });
    }
}

const loadUserVerifyEmail = async (req, res) => {
    try {
        res.render('./User/verifyEmail.hbs')
    } catch (error) {
        res.status(400).send(error)
    }
}

const verifyEmail = async (req, res) => {
    try {
        const { email } = req.body;
        const otp = generateOtp();
        req.session.otp = otp;
        req.session.email = email; // Ensure email is set in session
        console.log(req.session.otp, "req.session.otp in verifyEmail");

        // Send OTP email
        sendOtpEmail(email, otp);

        res.redirect('/user/otp-reset-password');
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
            res.redirect('/user/reset-password');
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

        res.redirect('/user/login');
    } catch (error) {
        res.render('./User/resetPassword.hbs', { message: 'Error resetting password' });
    }
};






const loadUserHome = async (req, res) => {
    try {
        res.render('./User/home.hbs')
    } catch (error) {
        res.status(400).send(error)
    }
}

const loadUserExplore = async (req, res) => {
    try {
        res.render('./User/explore.hbs')
    } catch (error) {
        res.status(400).send(error)
    }
}

const loadUserProduct = async (req, res) => {
    try {
        res.render('./User/product.hbs')
    } catch (error) {
        res.status(400).send(error)
    }
}

const loadUserCart = async (req, res) => {
    try {
        res.render('./User/cart.hbs')
    } catch (error) {
        res.status(400).send(error)
    }
}

const loadUserCheckout = async (req, res) => {
    try {
        res.render('./User/checkout.hbs')
    } catch (error) {
        res.status(400).send(error)
    }
}


const loadUserProfile = async (req, res) => {
    try {
        res.render('./User/profile.hbs')
    } catch (error) {
        res.status(400).send(error)
    }
}

const loadUserOrders = async (req, res) => {
    try {
        res.render('./User/orders.hbs')
    } catch (error) {
        res.status(400).send(error)
    }
}

const loadUserReviews = async (req, res) => {
    try {
        res.render('./User/reviews.hbs')
    } catch (error) {
        res.status(400).send(error)
    }
}

const loadUserWallet = async (req, res) => {
    try {
        res.render('./User/wallet.hbs')
    } catch (error) {
        res.status(400).send(error)
    }
}

const loadUserWishlist = async (req, res) => {
    try {
        res.render('./User/wishlist.hbs')
    } catch (error) {
        res.status(400).send(error)
    }
}


module.exports = {
    loadUserHome,
    loadUserCart,
    loadUserExplore,
    loadUserProfile,
    loadUserOrders,
    loadUserReviews,
    loadUserWallet,
    loadUserWishlist,
    loadUserLogin,
    loadUserSignup,
    registerUser,
    loginUser,
    loadUserProduct,
    loadUserCheckout,
    loadUserOtp,
    postOtp,
    resendOtp,
    googleLogin,
    googleLoginCallback,
    loadUserVerifyEmail,
    verifyOtpResetPassword,
    verifyEmail,
    loadverifyOtpResetPassword,
    resetPassword,
    loadResetPassword,
    resendOtpResetPassword
}

