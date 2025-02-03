const express = require('express')
const app = express()
const path = require('path')
require('dotenv').config();
const PORT = process.env.PORT
const passport = require('./Config/passport');
const session = require('express-session')
const nocache = require('nocache')
const methodOverride = require('method-override')
const ip = require('ip');
require('./Utils/hbsHelpers');


app.use('/Images', express.static(path.join(__dirname, 'Public/Images')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static('Public'))



app.use(nocache())
app.use(session({
    secret: 'mysecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 24
    }
}))


app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use(passport.initialize());
app.use(passport.session());

app.set('Cache-Control', 'no-cache, no-store');
app.set('views', path.join(__dirname, 'Views'))
app.set('view engine', 'hbs')
app.use(methodOverride('_method'));


app.use(passport.initialize());
app.use(passport.session());


const userRoutes = require('./Routes/userRoute')
const adminRoutes = require('./Routes/adminRoute')
const connectDB = require('./Database/connectDB')

app.use('/', userRoutes)

app.use('/admin', adminRoutes)


app.get('*', (req, res) => {
    res.render('../Views/User/error.hbs')
})

connectDB()


app.listen(PORT, () => {
    console.log(`Server listening on http://${ip.address()}:${PORT}/`);
    console.log(`Server listening on http://${ip.address()}:${PORT}/admin/dashboard`);
    console.log(`Server listening http://localhost:${PORT}/`);
    console.log(`Server listening http://localhost:${PORT}/admin/dashboard`);
    console.log(`Server listening https://chronix.website/`);
})

