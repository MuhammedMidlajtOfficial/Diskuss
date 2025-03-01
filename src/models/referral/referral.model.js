const mongoose = require("mongoose");


const ReferralSchema = new mongoose.Schema({
    // referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // Reference to the referrer (user_id)
    referrer: { type: String, required: true },  // Reference to the referrer (user_id)
    inviteePhoneNo: { type: String, required: true }, 
    referralCode: { type: String, required: true },
    invitee: { type: String },  // Reference to the referred user (user_id)
    status: { type: String, enum: ['Invited', 'Registered', 'Card Created'], default: 'Invited' },
    rewardsEarned: { type: Number, default: 0 },
    isSubscribed: { type: Boolean, default: false },
    registeredAt: { type: Date },
    cardCreatedAt: { type: Date }
}, { timestamps: true });


const rewardSchema = new mongoose.Schema({
  userId: { type: String },
  totalCoins: { type: Number, default: 0 },
  milestonesAchieved: { type: Array, default: [] }
});

// const ReferralSchema = new mongoose.Schema({
//     referrerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // Reference to the referrer (user_id)
//     refereeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },   // Reference to the referred user (user_id)
// }, { timestamps: true });

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

// Withdrwal Request Schema
const WithdrawalRequestSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // Reference to the user requesting withdrawal
    amount: { type: Number, required: true }, // Amount requested for withdrawal
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }, // Status of the withdrawal request
    upiId : { type: String, required: true }, // UPI ID of the user
    transactionId: { type: String }, // Transaction ID of the withdrawal
  },{ timestamps: true });

const IncentiveSchema = new mongoose.Schema({
    amount: { type: Number, required: true }, // Amount of incentive earned
    userId: { type: String, required: true }, // Reference to the user who earned the incentive
    type: { type: String, required: true },                      // Type of incentive (e.g., cash, discount)
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' }, // Status of the incentive
    transactionId: { type: String },                              // Transaction ID of the incentive
    createdAt: { type: Date, default: Date.now }                // Timestamp of when the incentive was created
  });

const ActionSchema = new mongoose.Schema({
    referralId: { type: mongoose.Schema.Types.ObjectId, ref: 'Referral', required: true }, // Reference to the referral record
    // actionType: { type: String, required: true },    
    actionType: {type: String, enum: ['pending', 'referral_initiated', 'referral_used', 'referral_completed'], default: 'pending'},                                     // Type of action (e.g., sign-up, purchase)
    actionDate: { type: Date, default: Date.now }                                       // Timestamp of when the action occurred
});
  

const ReferralLevelSchema = new mongoose.Schema({
    level: { type: Number, required: true }, // Level number (e.g., 1, 2)
    referralCountRequired: { type: Number, required: true }, // Number of referrals required to achieve this level
    rewardAmount: { type: Number, required: true } // Reward amount for achieving this level
  }, { timestamps: true });
  

  // index the fields
  ReferralSchema.index({ referrer: 1, inviteePhoneNo: 1 }, { unique: true });
  ReferralSchema.index({ invitee: 1 });
  ReferralSchema.index({ inviteePhoneNo: 1 });
  ReferralSchema.index({ referrer: 1 });
  ReferralSchema.index({ referralCode: 1 });  
  ReferralSchema.index({ status: 1 });

  // Export the model based on the schema
  module.exports = {
    ReferralLevel: mongoose.model('ReferralLevel', ReferralLevelSchema),
    RewardSchema : mongoose.model('rewardSchema', rewardSchema),
    Action: mongoose.model('Action', ActionSchema),
    Incentive: mongoose.model('Incentive', IncentiveSchema),
    Referral: mongoose.model('Referral', ReferralSchema),
    WithdrawalRequest: mongoose.model('WithdrawalRequest', WithdrawalRequestSchema)
};
  