const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const userSchema = require('../Model/userModel')
require("dotenv").config



passport.use(new GoogleStrategy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:'https://chronix.website/auth/google/callback'
},

async (accessToken,refreshToken,profile,done)=>{
    try {
        let user = await userSchema.findOne({googleId:profile.id});
        if(user){
            console.log(user, "user in passport");
            return done(null,user);
        }else{
            user = new userSchema({
                googleId:profile.id,
                email:profile.emails[0].value,
                username: profile.displayName || "Anonymous",
                isAdmin: false,
                status: true
            })
            await user.save()
            console.log('New User created:',user);
            //req.session.user = user;
            return done(null,user)
        }
    } catch (err) {
        console.log('Error in passport:',err);
        return done(err,null)
    }     
}
))


passport.serializeUser((user,done)=>{
    done(null,user._id)
})


passport.deserializeUser(async (id,done)=>{
    try {
        const user = await userSchema.findById(id)
        done(null,user)
    } catch (err) {
        done(err,null)
    }
})

module.exports = passport
