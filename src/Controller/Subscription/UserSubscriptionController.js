const UserSubscriptionService = require('../../services/Subscription/userSubscription.service');
const { findOneByPlanId } = require('../../services/Subscription/subscriptionPlan.service');
const { razorpay } = require('../../services/Razorpay/razorpay');
const crypto = require('crypto');
require('dotenv')

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
    const { planId, userId } = req.body;
    // const userId = req.user._id;

    if (!userId || !planId) {
      return res.status(400).json({ message: "User ID and Plan ID are required." });
    }

    // Retrieve subscription start and end dates
    const { startDate, endDate, newPlanId } = await getStartEndDate(planId);
   
    const subscriptionPlan = await findOneByPlanId(planId)
    console.log("subscriptionPlan----",subscriptionPlan);
    const amount = parseFloat(subscriptionPlan.price.toString())

    // Shortened receipt ID to stay within 40 characters
    const receiptId = `recpt_${userId.toString().slice(-6)}_${newPlanId.toString().slice(-6)}`;


    const amountInPaisa = amount*100
    // Create a Razorpay order for the subscription amount
    const razorpayOrder = await razorpay.orders.create({
      amountInPaisa, // Amount in rupee
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
      startDate,
      endDate,
      razorpayOrderId: razorpayOrder.id,  // Store the Razorpay order ID
      status: 'pending'  // Set as 'pending' until payment confirmation
    };

    // Save the user subscription data in the database
    const newUserSubscriptionData = await UserSubscriptionService.createUserSubscription(userSubscriptionData);

    console.log("razorpayOrder--",razorpayOrder);

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

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
     
    // Generate the signature to verify the payment authenticity
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_API_SECRET)  // Use your Razorpay key secret
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      // Update the subscription status to failed on Payment verification failed 
      await UserSubscriptionService.updateSubscriptionStatus(razorpay_order_id,{ status : 'failed' });
      return res.status(400).json({ message: "Payment verification failed." });
    }

    // Update the subscription status to active on successful payment verification
    await UserSubscriptionService.updateSubscriptionStatus(razorpay_order_id,{ status : 'active' , payment:razorpay_payment_id});
    
    await UserSubscriptionService.updateSubscriptionStatusInUsers(razorpay_order_id,{ isSubscribed:true })

    return res.status(200).json({ message: "Payment verified and subscription activated successfully." });
  } catch (error) {
    console.error("Payment verification failed:", error);
    res.status(500).json({ error: error.message });
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

module.exports = {
    getUserSubscriptions,
    getUserSubscriptionByUserId,
    createUserSubscription,
    updateUserSubscription,
    deleteUserSubscription,
    verifyPayment
};
