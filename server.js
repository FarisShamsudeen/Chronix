const express = require('express')
const app = express()
const path = require('path')
const PORT = process.env.PORT || 7000
const passport = require('passport');
require('./Config/passport');
const session = require('express-session')
const nocache = require('nocache')
const methodOverride = require('method-override')
const multer = require('multer');


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static('Public'))


app.use(nocache())
app.use(session({
    secret: 'mysecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
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


const userRoutes = require('./Routes/userRoute')
const adminRoutes = require('./Routes/adminRoute')
const connectDB = require('./Database/connectDB')

app.use('/user', userRoutes)
app.use('/admin', adminRoutes)

app.get('/', (req, res) => {
    res.send('Hello World')
})

app.get('*', (req, res) => {
    res.render('../Views/User/error.hbs')
})

connectDB()


app.listen(PORT, () => {
    console.log(`Server listening http://localhost:${PORT}/user/home`);
    console.log(`Server listening http://localhost:${PORT}/admin/dashboard`);
})
