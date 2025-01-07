const { string } = require("joi");
const mongoose = require("mongoose");

const enterpriseUserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    industryType: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    isSubscribed: {
      type: Boolean,
      default: false,
    },
    cardNo: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
      default: "",
    },
    phnNumber: {
      type: String,
      required: true,
    },
    referralCode: {
      type: String,
      unique: true,
    }, // Ensure referral codes are unique
    referralCodeUsed: {
      type: String,
      default: null,
    }, // Referral code used by the user
    aboutUs: {
      type: String,
      default: "",
    },
    website: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "active",
    },
    socialMedia: {
      whatsappNo: {
        type: String,
        default: "",
      },
      facebookLink: {
        type: String,
        default: "",
      },
      instagramLink: {
        type: String,
        default: "",
      },
      twitterLink: {
        type: String,
        default: "",
      },
    },
    empCards: [
      {
        empCardId : {
          type: mongoose.Schema.Types.ObjectId,
          ref: "EnterpriseEmployeeCard",
        },
        status:{
          type:String,
          default : 'active'
        },
      }
    ],
    empIds: [
      {
        empId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "EnterpriseEmployee",
        },
        status:{
          type:String,
          default : 'active'
        },
      }
    ],
    meetings: [
      {
        type: String,
        ref: "EnterpriseMeeting", // Reference to Meeting model
        required: false,
      },
    ],
  },
  { timestamps: true }
);

// module.exports.enterpriseUserCollection = mongoose.model('EnterpriseUser',enterpriseUserSchema)
module.exports = mongoose.model("EnterpriseUser", enterpriseUserSchema);

// Generate a unique referral code using crypto or any other method
enterpriseUserSchema.pre("save", async function (next) {
  if (!this.referralCode) {
    const generateReferralCode = () => {
      return crypto.randomBytes(4).toString("hex").toUpperCase(); // Generate 12 character long referral code
    };

    let referralCode = generateReferralCode();

    // Ensure the referral code is unique
    let isUnique = false;
    while (!isUnique) {
      const existingUser = await mongoose
        .model("User")
        .findOne({ referralCode: referralCode });
      const existingEnterpriseUser = await mongoose
        .model("EnterpriseUser")
        .findOne({ referralCode: referralCode });
      if (!existingUser && !existingEnterpriseUser) {
        isUnique = true;
      } else {
        referralCode = generateReferralCode(); // Generate a new code if it's not unique
      }
    }

    this.referralCode = referralCode;
  }

  next();
});
