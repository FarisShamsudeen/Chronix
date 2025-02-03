

const isLoginUser = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        req.session.returnTo = req.originalUrl;
        res.redirect('/login');
    }
};


const isLogoutUser = (req, res, next) => {
    if (!req.session.user) {
        console.log('islogoutUser is entered');
        next();  
    } else {
        res.redirect('/');  
    }
}


const isLoginAdmin = (req, res, next) => {
    if (req.session.admin) {
        next();
    } else {
        req.session.redirectTo = req.originalUrl;
        res.redirect('/admin');
    }
}

const isLogoutAdmin = (req, res, next) => {
    if (!req.session.admin) {
        next();  
    } else {
        res.redirect('/admin/dashboard');  
    }
}


const isverifyingEmail = (req, res, next) => {
    if (req.session.emailVerified) {
        next();
    } else {
        res.redirect('/verifyEmail');
    }
}

const emailVerified = (req, res, next) => {
    if (req.session.forgotPassword) {
        next();
    } else {
        res.redirect('/verifyEmail');
    }
}

// const isRegisteringUser = (req, res, next) => {
//     console.log('isRegisteringUser is entered');
//     if (req.session.newUser) {
//         console.log('isRegisteringUser is entered and registered');
//         next();
//     } else {
//         console.log('isRegisteringUser is entered but failed to register');
//         res.redirect('/signup');
//     }
// }


module.exports = {
    isLoginUser,
    isLogoutUser,
    isLoginAdmin,
    isLogoutAdmin,
    isverifyingEmail,
    emailVerified
    // ,isRegisteringUser
}