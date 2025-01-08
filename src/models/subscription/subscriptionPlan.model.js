const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const SubscriptionPlanSchema = new mongoose.Schema({
  planId: { type: String, default: uuidv4, unique: true },
  name: { type: String, required: true, maxlength: 100 },
  price: { type: mongoose.Schema.Types.Decimal128, required: true },
  features: { type: mongoose.Schema.Types.Mixed, default: {} }, // Flexible JSON format
  type: {type: String, enum: ['Individual', 'Enterprise'],required: true},
  duration : { type: Number, required: true },
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

module.exports = mongoose.model("SubscriptionPlan", SubscriptionPlanSchema);