const UserSubscriptionService = require('../../services/Subscription/userSubscription.service');
const { findOneByPlanId } = require('../../services/Subscription/subscriptionPlan.service');
const { razorpay } = require('../../services/Razorpay/razorpay');
const crypto = require('crypto');
require('dotenv')
const Notification = require("../../models/notification/NotificationModel");
const {emitNotification,} = require("../../Controller/Socket.io/NotificationSocketIo");
const axios = require('axios');
const mongoose = require('mongoose');

/**
 * Get all UserSubscription
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const getUserSubscriptions = async (req, res) => {
    try {
        const userSubscriptions = await UserSubscriptionService.findAll();
        return res.status(200).json({ userSubscriptions });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

const getUserSubscriptionByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;
    const userSubscriptions = await UserSubscriptionService.findOneById(user_id);
    return res.status(200).json({ userSubscriptions });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

/**
 * Create a new UserSubscription
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
    */
const createUserSubscription = async (req, res) => {
  try {
    const { 
      planId, 
      userId, 
      gstNumber, 
      state, 
      quantity, 
      sgst = null, 
      cgst = null, 
      igst = null, 
      netAmount 
    } = req.body;

    if (!userId || !planId || !quantity || !netAmount) {
      return res.status(400).json({ message: "User ID, Plan ID, netAmount and quantity are required." });
    }

    // Retrieve subscription start and end dates
    const { startDate, endDate, newPlanId } = await getStartEndDate(planId);
   
    const subscriptionPlan = await findOneByPlanId(planId)

    if (!subscriptionPlan) {
      console.error(`No subscription plan found with planId: ${planId}`);
      return res.status(404).json({ error: "Subscription plan not found" });
    }
    console.log('subscriptionPlan-',subscriptionPlan);
    // console.log("subscriptionPlan----",subscriptionPlan);
    // const amount = parseFloat(subscriptionPlan.price.toString())
    const amount = netAmount

    // Shortened receipt ID to stay within 40 characters
    const receiptId = `recpt_${userId.toString().slice(-6)}_${newPlanId.toString().slice(-6)}`;

    const amountInPaisa = amount*100
    // Create a Razorpay order for the subscription amount
    const razorpayOrder = await razorpay.orders.create({
      amount:amountInPaisa, // Amount in rupee
      currency: 'INR',
      receipt: receiptId,  // Updated receipt field
      notes: { planId: newPlanId, userId }
    });

    if (!razorpayOrder || !razorpayOrder.id) {
      console.error("Failed to create Razorpay order.");
      return res.status(500).json({ error: "Failed to create Razorpay order" });
    }

    // Prepare subscription data with Razorpay order ID
    const userSubscriptionData = {
      userId,
      planId: newPlanId,
      planName: subscriptionPlan.name,
      startDate,
      endDate,
      gstNumber : gstNumber,
      state : state,
      quantity : quantity,
      sgst : sgst,
      cgst : cgst,
      igst : igst,
      netAmount : netAmount,
      currencyType : 'INR',
      razorpayOrderId: razorpayOrder.id,  // Store the Razorpay order ID
      status: 'pending'  // Set as 'pending' until payment confirmation
    };

    // Save the user subscription data in the database
    const newUserSubscriptionData = await UserSubscriptionService.createUserSubscription(userSubscriptionData);

    console.log("razorpayOrder--",razorpayOrder);

    const notification = new Notification({
      receiver:userId,
      orderId: razorpayOrder.id,
      amount,
      Plan_name :subscriptionPlan.name,
      currency: 'INR',
      type: "subscription",
      content: "Your plan has been successfully activated! Enjoy the premium features.",
      status: "unread",
    });
    await notification.save();

    // Emit notification
    emitNotification(userId, notification);

    // Respond with order details for frontend to process payment
    return res.status(201).json({
      message: "User subscription initiated, complete payment to activate.",
      orderId: razorpayOrder.id,
      amount,
      Plan_name :subscriptionPlan.name,
      currency: 'INR'
    });
    

  } catch (error) {
    console.error("Error in createUserSubscription:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Mutex to ensure only one request is processed at a time
let isProcessing = false;

const verifyPayment = async (req, res) => {
  if (isProcessing) {
    return res.status(429).json({ message: "Payment verification already in process. Please wait." });
  }
  console.log('payment verification started');
  console.log('verifyPayment - body - ',req.body);

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  try {
    isProcessing = true; // Lock the process

    // Generate the signature to verify the payment authenticity
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_API_SECRET) // Use your Razorpay key secret
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      // Update the subscription status to failed on Payment verification failed
      await UserSubscriptionService.updateSubscriptionStatus(razorpay_order_id, { status: "failed" });
      return res.status(400).json({ message: "Payment verification failed." });
    }

    // Update the subscription status to active on successful payment verification
    await UserSubscriptionService.updateSubscriptionStatus(razorpay_order_id, {
      status: "active",
      'payment.$.paymentId': razorpay_payment_id,  // Update the paymentId in the matching payment element
      'payment.$.paymentDate': new Date(),  // Update the paymentDate in the matching payment element
    });
    // UPDATE USER STATUS
    await UserSubscriptionService.updateSubscriptionStatusInUsers(razorpay_order_id);
    // SEND NOTIFICATION
    await UserSubscriptionService.sendNotification({ success:true, razorpay_order_id });

    return res.status(200).json({ message: "Payment verified and subscription activated successfully." });
  } catch (error) {
    await UserSubscriptionService.sendNotification({ success:false, razorpay_order_id });
    console.error("Payment verification failed:", error);
    res.status(500).json({ error: error.message });
  } finally {
    isProcessing = false; // Unlock the process
  }
};

/**
 * Update a UserSubscription
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 * @example 
 * {
 * "name": "Basic",
 * "price": 100,
 * "features": ["Feature 1", "Feature 2"]
 * }
 */
const updateUserSubscription = async (req, res) => {
    try {
      const { userSubscription_id } = req.params; 
      // console.log("userSubscriptionId : ", userSubscription_id); // Extract userSubscriptionId from request parameters
      const updateData = req.body;     // Extract update data from request body
  
      // Check if required fields are provided (if applicable)
      if (!updateData || Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No data provided for update." });
      }
  
      //make it error free if we found the iinvalid enum in updateData
      if(updateData.status && !['active', 'inactive', 'canceled'].includes(updateData.status)){
        return res.status(400).json({ message: "Invalid status provided for update." });
      }

      if(!userSubscription_id){
        return res.status(400).json({ message:"Invalid userSubscription id" })
      }

      // Call the update function
      const updatedUserSubscription = await UserSubscriptionService.updateUserSubscriptionById(userSubscription_id, updateData);
  
        // console.log(updateUserSubscription);
        
      // Respond with success and the updated plan
      res.status(200).json({
        message: "User Subscription plan updated successfully",
        updatedUserSubscription,
      });
    } catch (error) {
      console.error("Error updating User Subscription:", error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * Delete a UserSubscription
   * @param {Request} req
   * @param {Response} res
   * @returns {Promise<Response>}
   */
  const deleteUserSubscription = async (req, res) => {
    try {
      const { plan_id } = req.params; // Extract plan_id from request parameters
  
      // Call the delete function
      const deletedUserSubscription = await UserSubscriptionService.deleteUserSubscriptionById(plan_id);
  
      // Respond with success and the deleted plan information
      res.status(200).json({
        message: "UserSubscription plan deleted successfully",
        deletedUserSubscription,
      });
    } catch (error) {
      console.error("Error deleting UserSubscription:", error);
      return res.status(500).json({ error: error.message });
    }
  };
  
const getStartEndDate = async (planId) => {

    console.log("deriving start and end date")
    const plan = (await findOneByPlanId(planId))
    const duration = plan.duration;
    const newPlanId = plan.id
    console.log(`Duration : ${duration}`);  
    console.log(`plan _id : ${newPlanId}`);  

     // Check if duration is a valid number
     if (typeof duration !== 'number' || isNaN(duration)) {
      throw new Error(`Invalid duration retrieved: ${duration}`);
  }

    const startDate = new Date();

    // Add duration to start date to get end date
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration);
  
    console.log(`Start Date : ${startDate} and End Date : ${endDate}`);
    return {startDate, endDate, newPlanId};
};

const deactivateSubscriptions = async (req, res) => {
  try {
    const result = await UserSubscriptionService.deactivateExpiredSubscriptions();
    return res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: "Error deactivating expired subscriptions" });
  }
};

const createFreeSubscription = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }
    console.log("User ID for new subscription:", userId);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID." });
    }

    // Check if the user already has an active or free subscription
    const existingSubscription = await UserSubscriptionService.findOneById(userId);
    console.log("sub:", existingSubscription);

    if (
      existingSubscription.length > 0 &&
      existingSubscription[0].status !== "Not subscribed"
    ) {
      return res.status(400).json({ message: "User already has an active or free subscription." });
    }
    

    // Fetch the config data to get the free trial period
    const configResponse = await axios.get('http://13.203.24.247:9000/api/v1/config');
    const configData = configResponse.data;

    // Look for the specific config ID and extract the free trial days
    const config = configData.find(item => item._id === "67872b6eb5030861b04cf35a");
    if (!config) {
      return res.status(500).json({ message: "Configuration not found." });
    }

    const trialDays = parseInt(config.config["Subscription Free Trial Date"], 10);
    if (isNaN(trialDays)) {
      return res.status(500).json({ message: "Invalid trial days configuration." });
    }

    // Set start and end dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + trialDays);

    // Create a new free subscription
    const freeSubscriptionData = {
      userId,
      status: 'free',
      startDate,
      endDate
    };

    const newFreeSubscription = await UserSubscriptionService.createUserSubscription(freeSubscriptionData);

    // Respond with success message
    return res.status(201).json({
      message: "Free subscription activated successfully.",
      subscription: newFreeSubscription
    });

  } catch (error) {
    console.error("Error in createFreeSubscription:", error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
    getUserSubscriptions,
    getUserSubscriptionByUserId,
    createUserSubscription,
    updateUserSubscription,
    deleteUserSubscription,
    verifyPayment,
    deactivateSubscriptions,
    createFreeSubscription
};
