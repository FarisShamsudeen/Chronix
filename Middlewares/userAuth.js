

const checkSession = (req, res, next) => {
    if (req.session.role == 'user') {
        next();
    } else {
        res.redirect('/user/login');
    }
}

const isLogin = (req, res, next) => {
    if (req.session.user) {
        res.redirect('/user/home');
    } else {
        next() 
    }
}

const isLogout = (req, res, next) => {
    if (!req.session.user) {
        next();  
    } else {
        res.redirect('/user/home');  
    }
}

const redirectIfLoggedIn = (req, res, next) => {
    if (req.session.role === 'user') {
        return res.redirect('/user/home');
    } else if (req.session.role === 'admin') {
        return res.redirect('/admin/dashboard');
    }
    next(); 
} 

const preventUserFromAdminPage = (req, res, next) => {
    if (req.session.role === 'user') {
        return res.redirect('/user/home'); 
    }
    next();
}

const preventAdminFromUserPage = (req, res, next) => {
    if (req.session.role === 'admin') {
        return res.redirect('/admin/dashboard');  
    }
    next();
}


module.exports = {
    checkSession,
    isLogin,
    isLogout,
    redirectIfLoggedIn,
    preventUserFromAdminPage,
    preventAdminFromUserPage
}