const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
    paymentId: { type: String ,default:""},
    paymentMethod: { type: String ,default:""},
    paymentDate: { type: Date, default: Date.now },
    gstNumber: { type: String ,default:""},
    state: { type: String ,default:"" },
    quantity: { type: Number ,default:""},
    sgst: { type: Boolean, default: false },
    cgst: { type: Boolean, default: false },
    igst: { type: Boolean, default: false },
    netAmount: { type: Number ,default:""},
    currencyType: { type: String ,default:""},
}); 

const UserSubscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan',default:null},
    planName: { type: String ,default:""},
    razorpayOrderId: { type:String ,default:"" },
    startDate: { type: Date, default: Date.now },
    payment: { type: [PaymentSchema], default: [] },
    endDate: { type: Date },
    status: { type: String, enum: ['active', 'inactive', 'canceled', 'pending', 'failed', "free"], default: 'active' },
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