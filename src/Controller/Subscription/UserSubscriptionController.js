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

// Mutex to ensure only one request is processed at a time
let isProcessing = false;

const verifyPayment = async (req, res) => {
  if (isProcessing) {
    return res.status(429).json({ message: "Payment verification already in process. Please wait." });
  }

  try {
    isProcessing = true; // Lock the process

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Create an instance of Razorpay with your API credentials
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_API_KEY, // Your Razorpay key ID
      key_secret: process.env.RAZORPAY_API_SECRET, // Your Razorpay key secret
    });

    // Fetch the order details using razorpay_order_id
    const orderDetails = await razorpay.orders.fetch(razorpay_order_id);

    // Extract the necessary fields from the order details
    const amount = orderDetails.amount; // Amount in the smallest unit (e.g., paise for INR)
    const currency = orderDetails.currency; // Currency code (e.g., INR)
    const email = orderDetails.notes.email; // Email from notes (if available)
    const contact = orderDetails.notes.contact; // Contact from notes (if available)

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

    // Payment data to be updated
    const paymentData = {
      id: razorpay_payment_id,
      entity: 'payment',
      amount: amount, // Amount retrieved from the order
      currency: currency, // Currency retrieved from the order
      status: 'captured', // Example status, update with the actual payment status
      order_id: razorpay_order_id,
      invoice_id: null, // Add the invoice id if available
      international: false, // Adjust this as necessary
      method: 'razorpay', // Assuming Razorpay as the method
      amount_refunded: 0, // Assuming no refund
      refund_status: null,
      captured: true,
      description: 'Payment for subscription', // Optional description
      card_id: null, // Optional: Add card id if available
      bank: null, // Optional: Add bank info if available
      wallet: null, // Optional: Add wallet info if available
      vpa: null, // Optional: Add VPA info if available
      email: email, // Email from the order
      contact: contact, // Contact from the order
      notes: null, // Optional notes
      created_at: Date.now(),
      fee: 0, // Example: Add fee if available
      tax: 0, // Example: Add tax if available
      error_code: null, // Optional error code
      error_description: null, // Optional error description
      error_source: null, // Optional error source
      error_step: null, // Optional error step
      error_reason: null, // Optional error reason
      error_metadata: null, // Optional error metadata
      payment_link_id: null // Optional payment link id
    };

    // Update the payment details in the subscription
    await UserSubscriptionService.updateSubscriptionPayment(razorpay_order_id, paymentData);

    // Update the subscription status to active on successful payment verification
    await UserSubscriptionService.updateSubscriptionStatus(razorpay_order_id, {
      status: 'active',
      payment: razorpay_payment_id,
    });

    await UserSubscriptionService.updateSubscriptionStatusInUsers(razorpay_order_id, { isSubscribed: true });

    return res.status(200).json({ message: "Payment verified and subscription activated successfully." });
  } catch (error) {
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

module.exports = {
    getUserSubscriptions,
    getUserSubscriptionByUserId,
    createUserSubscription,
    updateUserSubscription,
    deleteUserSubscription,
    verifyPayment,
    deactivateSubscriptions
};
