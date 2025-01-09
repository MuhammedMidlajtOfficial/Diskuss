const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
    paymentId: { type: String, required: true },
    paymentMethod: { type: String },
    paymentDate: { type: Date, default: Date.now },
    gstNumber: { type: String, required: true },
    state: { type: String, required: true },
    quantity: { type: Number, required: true },
    sgst: { type: Boolean, default: false },
    cgst: { type: Boolean, default: false },
    igst: { type: Boolean, default: false },
    netAmount: { type: Number, required: true },
    currencyType: { type: String},
}); 

const UserSubscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan',required: true },
    razorpayOrderId: { type:String,required:true },
    startDate: { type: Date, default: Date.now },
    payment: { type: [PaymentSchema], default: [] },
    endDate: { type: Date },
    status: { type: String, enum: ['active', 'inactive', 'canceled', 'pending', 'failed'], default: 'active' },
}, { timestamps: true });


// // Middleware to ensure only one membership type is active
// subscriptionPlanSchema.pre("save", function (next) {
//   // Track active membership flags
//   const memberships = [this.isDiamond, this.isGold, this.isSilver, this.isTrial];
//   const activeMemberships = memberships.filter(Boolean);

//   if (activeMemberships.length > 1) {
//     return next(new Error("Only one membership level can be active per plan."));
//   }
  
//   next();
// });



module.exports = mongoose.model("UserSubscription", UserSubscriptionSchema);