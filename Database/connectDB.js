const mongoose = require('mongoose')
const Schema = mongoose.Schema

const connectDB = async () => {
    try {
        const conn = await mongoose.connect('mongodb+srv://faris52342345:9rO0jiV7ocCrdp3n@cluster0.rv0pe.mongodb.net/', { })
        // const conn = await mongoose.connect('mongodb://localhost:27017/chronix', { })
        console.log(`MongoDB Connected: ${conn.connection.host}`)
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}

module.exports = connectDB