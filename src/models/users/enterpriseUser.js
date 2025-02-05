const mongoose = require("mongoose");
const crypto = require("crypto");

const enterpriseUserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    companyName: { type: String, required: true },
    industryType: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String },
    isSubscribed: { type: Boolean, default: false },
    cardNo: { type: Number, default: 0 },
    firstCardCreated: {
      type: Boolean,
      required: true,
      default : false
    },
    image: { type: String, default: "" },
    phnNumber: { type: String },

    referralCode: {
      type: String,
      unique: true,
      required: true, // Ensures referralCode is never null
      default: function () {
        return crypto.randomBytes(4).toString("hex").toUpperCase();
      },
    },

    referralCodeUsed: { type: String, default: "" }, // Avoid null values
    aboutUs: { type: String, default: "" },
    website: { type: String, default: "" },
    address: { type: String, default: "" },
    status: { type: String, default: "active" },

    socialMedia: {
      whatsappNo: { type: String, default: "" },
      facebookLink: { type: String, default: "" },
      instagramLink: { type: String, default: "" },
      twitterLink: { type: String, default: "" },
    },

    empCards: [
      {
        empCardId: { type: mongoose.Schema.Types.ObjectId, ref: "EnterpriseEmployeeCard" },
        status: { type: String, default: "active" },
      },
    ],

    empIds: [
      {
        empId: { type: mongoose.Schema.Types.ObjectId, ref: "EnterpriseEmployee" },
        status: { type: String, default: "active" },
      },
    ],

    meetings: [{ type: String, ref: "EnterpriseMeeting", required: false }],

    coinsBalance: { type: Number, default: 0 },
    coinsRewarded: { type: Number, default: 0 },
    coinsWithdrawn: { type: Number, default: 0 },
    invitedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Referral" }],
  },
  { timestamps: true }
);

// 🔹 Ensure referralCode is unique before saving
enterpriseUserSchema.pre("save", async function (next) {
  if (!this.referralCode) {
    let isUnique = false;
    let referralCode;

    while (!isUnique) {
      referralCode = crypto.randomBytes(4).toString("hex").toUpperCase();
      const existingUser = await mongoose.model("EnterpriseUser").findOne({ referralCode });
      if (!existingUser) isUnique = true;
    }

    this.referralCode = referralCode;
  }

  next();
});

module.exports = mongoose.model("EnterpriseUser", enterpriseUserSchema);
