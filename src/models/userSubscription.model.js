const mongoose = require("mongoose");

const UserSubscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    razorpayOrderId: { type: String, required: true },
    startDate: { type: Date, default: Date.now },
    payment:{
        id: { type: String },
        entity: { type: String },
        amount: { type: Number },
        currency: { type: String },
        status: { type: String },
        order_id: { type: String },
        invoice_id: { type: String, default: null },
        international: { type: Boolean },
        method: { type: String },
        amount_refunded: { type: Number },
        refund_status: { type: String, default: null },
        captured: { type: Boolean },
        description: { type: String, default: null },
        card_id: { type: String },
        bank: { type: String, default: null },
        wallet: { type: String, default: null },
        vpa: { type: String, default: null },
        email: { type: String },
        contact: { type: String },
        notes: { type: String, default: null },
        created_at: { type: Number },
        fee: { type: Number },
        tax: { type: Number },
        error_code: { type: String, default: null },
        error_description: { type: String, default: null },
        error_source: { type: String, default: null },
        error_step: { type: String, default: null },
        error_reason: { type: String, default: null },
        error_metadata: { type: String, default: null },
        payment_link_id: { type: String, default: null }
    },
    endDate: { type: Date },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
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