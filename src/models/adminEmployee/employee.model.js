const mongoose = require('mongoose');
const bcrypt = require('bcrypt')
// const jwt = require('jsonwebtoken')

const EmployeeSchema = new mongoose.Schema({
    username: { type: String, required: true },
    image: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phnNumber: { type: String, required: true },
    userType:{
      type: String,
      required: true,
      default: 'Employee'
    },
    address:{
      type: String,
      default:""
    },
    category: [{ type: String, required: true}],
}, { timestamps: true });

// EmployeeSchema.pre('save', async function (next) {
//     if (this.isModified('password')) {
//         this.password = await bcrypt.hash(this.password, 10)
//     }
//     next()
// })

EmployeeSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

// EmployeeSchema.methods.generateAuthToken = async function() {
//     return jwt.sign(
//         {
//             _id: this._id,
//             email: this.email,
//             username: this.username,
//             fullname: this.fullname
//         }, 
//         // After discussion
//         {
//             expiresIn: // After discussion
//         }
//     )
// }

// EmployeeSchema.methods.generateRefreshToken = async function() {
//     return jwt.sign(
//         {
//             _id: this._id,
//             email: this.email,
//             username: this.username,
//             fullname: this.fullname
//         }, 
//         //after discussion
//         {
//             expiresIn: // After discussion
//         }
//     )
// }

module.exports = mongoose.model('Employee', EmployeeSchema);