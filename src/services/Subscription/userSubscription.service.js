const enterpriseEmployeModel = require('../../models/users/enterpriseEmploye.model');
const enterpriseUser = require('../../models/users/enterpriseUser');
const UserSubscription = require('../../models/subscription/userSubscription.model');
const { individualUserCollection } = require("../../DBConfig");
const { razorpay } = require('../Razorpay/razorpay');
const subscriptionPlanModel = require('../../models/subscription/subscriptionPlan.model');
const mailSender = require('../../util/mailSender');

/**
 * Find all Subscsriptions
 * @returns {Promise<UserSubscription[]>}
 */
const findAll = async () => {
  try {
    const userSubscriptions = await UserSubscription.find().exec();
    // console.log(UserSubscriptions);
    return userSubscriptions;
  } catch (error) {
    console.error("Error fetching UserSubscriptions plan:", error);
    throw error; // Re-throw the error for higher-level handling if needed
  }
  };  

  const findOneById = async (userId) => {
    try {
      console.log("user id :", userId);
  
      const userSubscriptions = await UserSubscription.find({ userId, status: 'active' }) // Assuming `status` is a field indicating activity
        .sort({ startDate: -1 }) // Sort by `startDate` in descending order (latest first)
        .populate('userId')
        .populate('planId')
        .limit(1) // Fetch only the latest subscription
        .exec();
  
      console.log("Latest active user subscription:", userSubscriptions);
  
      return userSubscriptions.length > 0 ? userSubscriptions : [ "Not subscribed" ]; // Return the single subscription or null if none found
    } catch (error) {
      console.error("Error fetching User Subscriptions plan:", error);
      throw error; // Re-throw the error for higher-level handling if needed
    }
  };
   
/**
 * Create al UserSubscription
 * * Create a new UserSubscription plan.
 * @param {Object} planData - The UserSubscription plan data.
 * @param {String} planData.name - Name of the plan.
 * @param {Decimal128} planData.price - Price of the plan.
 * @param {Mixed} planData.features - JSON object for plan features.
 * @returns {Promise<Object>} - Returns the created UserSubscription plan.
 */
const createUserSubscription = async (data) => {
  try {
    const newSubscription = new UserSubscription({
      planId: data.planId,
      planName: data.planName,
      userId: data.userId,
      razorpayOrderId: data.razorpayOrderId,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
      payment: [{
        gstNumber: data.gstNumber,
        state: data.state,
        quantity: data.quantity,
        sgst: data.sgst,
        cgst: data.cgst,
        igst: data.igst,
        netAmount: data.netAmount,
        currencyType: data.currencyType,
      }],
    });

    // Save the new UserSubscription plan to the database
    const savedSubscription = await newSubscription.save();
    return savedSubscription;
  } catch (error) {
    console.error("Error creating UserSubscription plan:", error);
    throw error;
  }
};

/**
 * Update a UserSubscription plan by plan_id.
 * @param {String} plan_id - The unique identifier of the UserSubscription plan to update.
 * @param {Object} updateData - The data to update the UserSubscription plan.
 * @param {String} [updateData.name] - New name of the plan (optional).
 * @param {Decimal128} [updateData.price] - New price of the plan (optional).
 * @param {Mixed} [updateData.features] - New features for the plan (optional).
 * @returns {Promise<Object>} - Returns the updated UserSubscription plan.
 * @throws {Error} - Throws an error if the UserSubscription plan is not found or if there's an issue with the update.
 */
  const updateUserSubscriptionById = async (id, updateData) => {
    try {
      // console.log("id : ",id);
      
      const userSubscription = await UserSubscription.findById({_id : id}).exec();
       
      // console.log(userSubscription);
      
      if (!userSubscription) {
        throw new Error("User Subscription plan not found");
      }
      const updatedUserSubscription = await UserSubscription.findOneAndUpdate(
        { _id: id },
        { $set: updateData },
        { new: true }
      ).exec(); // Find and update the UserSubscription plan

      updatedUserSubscription.save(); // Save the updated UserSubscription plan

  
      return updatedUserSubscription; // Return the updated UserSubscription
    } catch (error) {
      console.error("Error updating UserSubscription:", error);
      throw error; // Re-throw the error for higher-level handling
    }
  };

  const updateSubscriptionStatus = async (razorpay_order_id, updateData) => {
    try {
      // Find the user subscription by razorpayOrderId
      const userSubscription = await UserSubscription.findOne({ razorpayOrderId: razorpay_order_id }).exec();
      
      if (!userSubscription) {
        throw new Error("User Subscription plan not found");
      }
  
      // Update the subscription plan status with the new data
      const updatedUserSubscription = await UserSubscription.updateOne(
        { razorpayOrderId: razorpay_order_id }, // Search by razorpayOrderId, not _id
        { $set: updateData }, // Update the subscription with the new data
        { new: true }
      ).exec();
  
      return updatedUserSubscription; // Return the result of the update operation
    } catch (error) {
      console.error("Error updating UserSubscription:", error);
      throw error; // Re-throw the error for higher-level handling
    }
  };

  const updateSubscriptionStatusInUsers = async (razorpay_order_id) => {
    try {
      // Find the user subscription by razorpayOrderId
      const userSubscription = await UserSubscription.findOne({ razorpayOrderId: razorpay_order_id }).exec();
      if (!userSubscription) {
        console.log('User Subscription plan not found');
        throw new Error("User Subscription plan not found");
      }
      
        const userId = userSubscription.userId;

        const isIndividualUserExist = await individualUserCollection.findOne({ _id:userId }).exec();
        const isEnterpriseEmployeExist = await enterpriseEmployeModel.findOne({ _id:userId }).exec();
        const isEnterpriseUserExist = await enterpriseUser.findOne({ _id:userId }).exec();
        
        if (isIndividualUserExist) {
          console.log("IndividualUser isSubscribed:true ---- ", isIndividualUserExist);

          // Deactivate Old Subscriptions of individual user
          await deactivateOldSubscriptions(isIndividualUserExist._id)

          // Update individual user collection
          await individualUserCollection.updateOne({ _id: userId }, {isSubscribed:true});
        } else if (isEnterpriseEmployeExist) {
          console.log("isEnterpriseEmployeExist isSubscribed:true ---- ", isEnterpriseEmployeExist);

          // Deactivate Old Subscriptions of employee 
          await deactivateOldSubscriptions(isEnterpriseEmployeExist._id)

          // Update enterprise employee collection
          await enterpriseEmployeModel.updateOne({ _id: userId }, {isSubscribed:true});
        } else if (isEnterpriseUserExist) {
          console.log("isEnterpriseUserExist isSubscribed:true ---- ", isEnterpriseUserExist);

          // Deactivate Old Subscriptions of enterprise user 
          await deactivateOldSubscriptions(isEnterpriseUserExist._id)

          // Update enterprise user collection
          await enterpriseUser.updateOne({ _id: userId }, {isSubscribed:true});
        } else {
          // Handle case when user doesn't exist in any collection
          console.log("User not found in any collection");
        }
        
      return;
    } catch (error) {
      console.error("Error updating UserSubscription:", error);
      throw error; // Re-throw the error for higher-level handling
    }
  };

  const deactivateOldSubscriptions = async (userId) => {
    try {
      // Fetch all subscriptions for the user, sorted by creation date
      const subscriptions = await UserSubscription.find({ userId }).sort({ createdAt: -1 }).exec();
  
      if (!subscriptions || subscriptions.length === 0) {
        console.log("No subscriptions found for user.");
        return;
      }
  
      // Keep the latest subscription active and deactivate others
      const latestSubscriptionId = subscriptions[0]._id;
      await UserSubscription.updateMany(
        { userId, _id: { $ne: latestSubscriptionId } }, // Exclude the latest subscription
        { $set: { isActive: false } }
      );
  
      console.log("Old subscriptions deactivated, latest subscription remains active.");
    } catch (error) {
      console.error("Error deactivating old subscriptions:", error);
      throw error;
    }
  };
  
/**
 * Delete a UserSubscription plan by plan_id.
 * @param {String} plan_id - The unique identifier of the UserSubscription plan to delete.
 * @returns {Promise<Object>} - Returns the deleted UserSubscription plan for confirmation.
 * @throws {Error} - Throws an error if the UserSubscription plan is not found or if there's an issue with the deletion.
 */
  const deleteUserSubscriptionById = async (plan_id) => {
    try {
      const deletedUserSubscription = await UserSubscription.findOneAndDelete({ plan_id }).exec();
  
      if (!deletedUserSubscription) {
        throw new Error("User Subscription plan not found");
      }
  
      return deletedUserSubscription; // Return the deleted UserSubscription for confirmation
    } catch (error) {
      console.error("Error deleting User Subscription:", error);
      throw error; // Re-throw the error for higher-level handling
    }
  };
  
// // Import your deactivateExpiredSubscriptions function
// const deactivateExpiredSubscriptions = async () => {
//   try {
//     const currentDate = new Date();

//     // Find all subscriptions with endDate in the past and status as 'active'
//     const expiredSubscriptions = await UserSubscription.find({
//       status: 'active',
//       endDate: { $lt: currentDate },
//     }).exec();

//     if (expiredSubscriptions.length === 0) {
//       console.log("No expired subscriptions to deactivate.");
//       return { message: "No expired subscriptions found." };
//     }

//     // Update the status of expired subscriptions to 'inactive'
//     const updateResult = await UserSubscription.updateMany(
//       { _id: { $in: expiredSubscriptions.map(sub => sub._id) } },
//       { $set: { status: 'inactive' } }
//     );

//     console.log(`${updateResult.modifiedCount} subscriptions deactivated successfully.`);
//     return { message: `${updateResult.modifiedCount} subscriptions deactivated successfully.` };
//   } catch (error) {
//     console.error("Error deactivating expired subscriptions:", error);
//     throw error;
//   }
// };

const deactivateExpiredSubscriptions = async () => {
  try {
    const currentDate = new Date();

    // Find active subscriptions
    const activeSubscriptions = await UserSubscription.find({
      status: "active",
    }).exec();

    if (!activeSubscriptions.length) {
      console.log("No active subscriptions to process.");
      return { message: "No active subscriptions found." };
    }

    for (const subscription of activeSubscriptions) {
      const userId = subscription.userId;

      // Get all active subscriptions for the user
      const userActiveSubscriptions = await UserSubscription.find({
        userId,
        status: "active",
      })
        .sort({ endDate: -1 }) // Sort by endDate (latest first)
        .exec();

      if (userActiveSubscriptions.length > 1) {
        // Deactivate all subscriptions except the latest one
        const subscriptionsToDeactivate = userActiveSubscriptions.slice(1);

        for (const sub of subscriptionsToDeactivate) {
          const deactivateResult = await UserSubscription.updateOne(
            { _id: sub._id },
            { $set: { status: "inactive" } }
          );

          if (deactivateResult.modifiedCount > 0) {
            console.log(`Subscription ${sub._id} deactivated successfully.`);
          } else {
            console.log(`Failed to deactivate subscription ${sub._id}`);
          }
        }
      }

      // If the subscription is expired, deactivate it
      if (subscription.endDate < currentDate) {
        const expireResult = await UserSubscription.updateOne(
          { _id: subscription._id },
          { $set: { status: "inactive" } }
        );

        if (expireResult.modifiedCount > 0) {
          console.log(`Expired subscription ${subscription._id} deactivated.`);
        } else {
          console.log(`Failed to deactivate expired subscription ${subscription._id}`);
        }
      }

      // Update user status if they have no active subscriptions
      const updateUserStatusResult = await updateUserStatus(userId);

      if (updateUserStatusResult) {
        console.log(`User ${userId} status updated successfully.`);
      } else {
        // console.log(`User ${userId} still has active subscriptions.`);
      }
    }

    return { message: "Subscription processing completed successfully." };
  } catch (error) {
    console.error("Error deactivating expired subscriptions:", error);
    throw error;
  }
};

const updateUserStatus = async (userId) => {
  try {
    // Check if the user has any active subscriptions
    const activeSubscriptions = await UserSubscription.find({
      userId,
      status: "active",
    }).exec();

    if (!activeSubscriptions.length) {
      // No active subscriptions, update user status
      const userUpdates = [
        individualUserCollection.updateOne(
          { _id: userId },
          { $set: { isSubscribed: false } }
        ),
        enterpriseEmployeModel.updateOne(
          { _id: userId },
          { $set: { isSubscribed: false } }
        ),
        enterpriseUser.updateOne(
          { _id: userId },
          { $set: { isSubscribed: false } }
        ),
      ];

      const results = await Promise.all(userUpdates);

      results.forEach((result, index) => {
        if (result.modifiedCount > 0) {
          console.log(
            `${
              ["Individual", "Enterprise Employee", "Enterprise User"][index]
            } user ${userId} updated successfully.`
          );
        }
      });

      return true;
    }

    return false;
  } catch (error) {
    console.error("Error updating user status:", error);
    throw error;
  }
};

const sendNotification = async ({ success, razorpay_order_id = null }) => {
  try {
    // Fetch order details from Razorpay
    const orderDetails = await razorpay.orders.fetch(razorpay_order_id);

    if (!orderDetails || !orderDetails.notes) {
      throw new Error("Invalid order details or missing notes.");
    }

    // Extract planId and userId from Razorpay order notes
    const { planId, userId } = orderDetails.notes;

    // Fetch subscription plan details
    const planDetails = await subscriptionPlanModel.findById(planId);
    if (!planDetails) {
      throw new Error(`Subscription plan not found for planId: ${planId}`);
    }

    // Fetch user details from individual or enterprise collections
    let userDetails = await individualUserCollection.findById(userId);
    if (!userDetails) {
      userDetails = await enterpriseUser.findById(userId);
      if (!userDetails) {
        throw new Error(`User not found for userId: ${userId}`);
      }
    }

    // Extract relevant details from the plan and user
    const plan = planDetails.name;
    const price = planDetails.price;
    const createdAt = new Date(); // Current timestamp
    const subscriptionExpiry = new Date(createdAt);
    subscriptionExpiry.setDate(subscriptionExpiry.getDate() + planDetails.duration); // Calculate expiry
    const usermail = userDetails.email;

    // Check if success flag is true and send the notification
    if (success) {
      const invoicePath = `invoices/${razorpay_order_id}.pdf`; // Example path for invoice
      await sendSuccessSubscriptionNotification(
        usermail,
        createdAt,
        subscriptionExpiry,
        plan,
        price,
        invoicePath
      );
      console.log("Notification sent successfully.");
    }else{
      await sendFailedSubscriptionNotification(usermail,plan)
    }
  } catch (error) {
    console.error("Error in sendNotification:", error.message);
    throw error;
  }
};


async function sendSuccessSubscriptionNotification(usermail, createdAt, subscriptionExpiry, plan, price, invoicePath) {
  try {
    // Prepare the email body
    const emailBody = `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #ffffff; color: #333; border-radius: 10px; border: 1px solid #e0e0e0;">
        <!-- Header Section -->
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://diskuss-application-bucket.s3.ap-south-1.amazonaws.com/Static-files/Diskuss+Logo+Blue.png" alt="Diskuss Logo" style="max-width: 150px;">
        </div>

        <!-- Main Content Section -->
        <div style="background-color: #f0f8ff; padding: 25px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
          <h2 style="font-size: 26px; color: #3e4a59; font-weight: bold; text-align: center; margin-bottom: 20px;">Subscription Successful</h2>
          <p style="font-size: 18px; color: #555; line-height: 1.6; text-align: center; margin-bottom: 30px;">
            Thank you for subscribing to Diskuss! Your subscription has been successfully activated.
          </p>

          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0; margin-bottom: 20px;">
            <h3 style="font-size: 22px; color: #3e4a59; margin-bottom: 15px;">Subscription Details</h3>
            <p style="font-size: 16px; color: #333; margin: 10px 0;"><strong>Email:</strong> ${usermail}</p>
            <p style="font-size: 16px; color: #333; margin: 10px 0;"><strong>Subscription Plan:</strong> ${plan}</p>
            <p style="font-size: 16px; color: #333; margin: 10px 0;"><strong>Subscription Amount:</strong> ${price}</p>
            <p style="font-size: 16px; color: #333; margin: 10px 0;"><strong>Subscription Date:</strong> ${new Date(createdAt).toLocaleDateString()}</p>
            <p style="font-size: 16px; color: #333; margin: 10px 0;"><strong>Subscription Expiry Date:</strong> ${new Date(subscriptionExpiry).toLocaleDateString()}</p>
          </div>

          <!-- Invoice Download Section -->
          <div style="text-align: center; margin-bottom: 20px;">
            <p style="font-size: 16px; color: #777;">We’re excited to have you with us! Explore our platform and enjoy all the benefits that come with your subscription.</p>
            <p style="font-size: 16px; color: #777;">Click below to download your invoice:</p>
            <a href="${invoicePath}" 
               style="display: inline-block; font-size: 16px; font-weight: 600; color: #fff; background-color: #4CAF50; padding: 12px 30px; border-radius: 5px; text-decoration: none; text-align: center; transition: background-color 0.3s ease, transform 0.3s ease;">
              Download Invoice
            </a>
          </div>
        </div>

        <!-- Footer Section -->
        <div style="background-color: #f8f8f8; padding: 15px; border-radius: 8px; margin-top: 30px; text-align: center;">
          <p style="font-size: 14px; color: #888;">© 2025 Diskuss. All rights reserved.</p>
        </div>
      </div>
    `;

    // Send the email using mailSender
    const mailResponse = await mailSender(
      usermail,
      "Digital Card Admin - Subscription Successful",
      emailBody
    );

    console.log("Email sent successfully:", mailResponse);
  } catch (error) {
    console.error("Error occurred while sending email:", error.message);
    throw error;
  }
}

async function sendFailedSubscriptionNotification(usermail, attemptedPlan) {
  try {
    // Prepare the email body
    const emailBody = `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #ffffff; color: #333; border-radius: 10px; border: 1px solid #e0e0e0;">
        <!-- Header Section -->
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://diskuss-application-bucket.s3.ap-south-1.amazonaws.com/Static-files/Diskuss+Logo+Blue.png" alt="Diskuss Logo" style="max-width: 150px;">
        </div>

        <!-- Main Content Section -->
        <div style="background-color: #ffe5e5; padding: 25px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
          <h2 style="font-size: 26px; color: #b71c1c; font-weight: bold; text-align: center; margin-bottom: 20px;">Subscription Failed</h2>
          <p style="font-size: 18px; color: #555; line-height: 1.6; text-align: center; margin-bottom: 30px;">
            Unfortunately, we could not process your subscription to Diskuss at this time. Please review your payment details and try again.
          </p>

          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0; margin-bottom: 20px;">
            <h3 style="font-size: 22px; color: #b71c1c; margin-bottom: 15px;">Failed Subscription Details</h3>
            <p style="font-size: 16px; color: #333; margin: 10px 0;"><strong>Email:</strong> ${usermail}</p>
            <p style="font-size: 16px; color: #333; margin: 10px 0;"><strong>Attempted Plan:</strong> ${attemptedPlan}</p>
          </div>

          <!-- Retry Suggestion -->
          <div style="text-align: center; margin-bottom: 20px;">
            <p style="font-size: 16px; color: #777;">We apologize for the inconvenience. Please try subscribing again or contact our support team for assistance.</p>
            
            <!-- Retry Button -->
            <a href="#" 
               style="display: inline-block; font-size: 16px; font-weight: 600; color: #fff; background-color: #f44336; padding: 12px 30px; border-radius: 5px; text-decoration: none; text-align: center; transition: background-color 0.3s ease, transform 0.3s ease;">
              Retry Subscription
            </a>
          </div>
        </div>

        <!-- Footer Section -->
        <div style="background-color: #f8f8f8; padding: 15px; border-radius: 8px; margin-top: 30px; text-align: center;">
          <p style="font-size: 14px; color: #888;">© 2025 Diskuss. All rights reserved.</p>
        </div>
      </div>
    `;

    // Send the email using mailSender
    const mailResponse = await mailSender(
      usermail,
      "Digital Card Admin - Subscription Failed",
      emailBody
    );

    console.log("Failed subscription email sent successfully:", mailResponse);
  } catch (error) {
    console.error("Error occurred while sending failed subscription email:", error.message);
    throw error;
  }
}


module.exports = {
    findAll,
    findOneById,
    createUserSubscription,
    updateUserSubscriptionById,
    deleteUserSubscriptionById,
    updateSubscriptionStatus,
    updateSubscriptionStatusInUsers,
    deactivateOldSubscriptions,
    deactivateExpiredSubscriptions,
    sendNotification,
};