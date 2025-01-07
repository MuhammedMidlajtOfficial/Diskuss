const Ticket = require('../../models/ticket/ticketModel');
const { checkUserType } = require('../../util/HelperFunctions'); 
const EnterpriseUser = require('../../models/users/enterpriseUser');
const { individualUserCollection: IndividualUser, individualUserCollection } = require('../../DBConfig');
const { query } = require('express');
const enterpriseUser = require('../../models/users/enterpriseUser');
const enterpriseEmployeModel = require('../../models/users/enterpriseEmploye.model');
const mailSender = require('../../util/mailSender');
const configModel = require('../../models/config/config.model');
const employeeModel = require('../../models/adminEmployee/employee.model');


exports.create = async (data) => {
    data.ticketNumber = await generateTicketNumber();
    const newTicket = new Ticket(data);

    // Send MAIL
    const createdUser = await populateCreatedBy(newTicket.createdBy)
    const notificationMail = await configModel.findOne({ "config.title": "Notification Mail" })
    const email = notificationMail?.config?.email
    const usermail = createdUser.email

    const createdAt = new Date(newTicket.createdAt);
    // Format the date
    const day = String(createdAt.getDate()).padStart(2, '0');
    const month = String(createdAt.getMonth() + 1).padStart(2, '0');
    const year = String(createdAt.getFullYear()).slice(-2); // Get last 2 digits of the year
    const hours = createdAt.getHours();
    const minutes = String(createdAt.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedTime = `${hours % 12 || 12}:${minutes}${ampm}`;

    const formattedDate = `${day}/${month}/${year}, ${formattedTime}`;

    sendCreateTicketNotification(
        email,
        usermail, 
        newTicket.ticketNumber, 
        newTicket.title, 
        newTicket.description, 
        formattedDate,
    )

    return await newTicket.save();
};

// exports.getAll = async (page = 1, limit = 10, noPagination = false, filters = {}) => {
//     const query = {};

//     // console.log("filters : ",filters);
//     // Apply filters if provided
//     if (filters.status) {
//         query.status = filters.status;
//     }
//     if (filters.priority) {
//         query.priority = filters.priority;
//     }
//     if(filters.category){
//         query.category = filters.category;
//     }

//     // Pagination logic
//     const options = {
//         skip: (page - 1) * limit,
//         limit: noPagination ? undefined : parseInt(limit),
//     };
//     const tickets = await Ticket.find(query, null, options).populate('category').sort({createdAt : -1});;

//     // Populate user data for each ticket
//     const populatedTicketsPromises = tickets.map(async ticket => {
//         let user = await checkUserType(ticket.createdBy);
//         const userData = user.data;
//         let populatedUser;

//         if (user.userType === 'individual') {
//             populatedUser = await IndividualUser.findById(ticket.createdBy).select('username email image');
//         } else {
//             populatedUser = await EnterpriseUser.findById(ticket.createdBy).select('username email image');
//         }

//         const ticketData = ticket.toObject();
//         ticketData.createdBy = populatedUser;
//         return ticketData;
//     });

//     return Promise.all(populatedTicketsPromises);

//     // const tickets = await Ticket.find();
//     // let populatedTickets = [];
//     // for (let ticket of tickets) {
//     //     let user = (await checkUserType(ticket.createdBy));
//     //     const userType = user.userType;
//     //     const userData = user.data;
//     //     let populatedUser = {
//     //         username: userData.username,
//     //         email: userData.email
//     //     };
//     //     if (userType === 'individual') {
//     //         // populatedUser =  await IndividualUser.findOne(ticket.createdBy).select('username email');
//     //     } else {
//     //         populatedUser = await EnterpriseUser.findOne(ticket.createdBy).select('username email');
//     //     }
//     //     const ticketData = ticket.toObject();
//     //     ticketData.createdBy = populatedUser;
//     //     populatedTickets.push(ticketData);
//     // }
//     // return populatedTickets;
// };

// exports.getAll = async (page = 1, limit = 10, noPagination = false, userId, status) => {
//     const options = {
//         skip: (page - 1) * limit,
//         limit: noPagination ? undefined : parseInt(limit),
//     };

//     // Ensure `status` is a string, not an object
//     const statusValue = typeof status === 'string' ? status : status?.status;

//     let query = {};
//     // console.log('status', statusValue);

//     if (statusValue) {
//         query.status = statusValue; // Use the corrected status value
//     }

//     if (userId) {
//         query = { ...query, assignedTo: userId }; // Merge userId into the query
//     }

//     // console.log('query-', query);

//     try {
//         const tickets = await Ticket.find(query, null, options)
//             .populate('category')
//             .sort({ createdAt: -1 });

//         // console.log('tickets-', tickets);
//         return tickets;
//     } catch (error) {
//         console.error('Error fetching tickets:', error);
//         throw error; // Re-throw error to be handled by the calling function
//     }
// };

exports.getAll = async (page = 1, limit = 10, noPagination = false, userId, status) => {
    const options = {
        skip: (page - 1) * limit,
        limit: noPagination ? undefined : parseInt(limit),
    };

    const statusValue = typeof status === 'string' ? status : status?.status;

    let query = {};

    if (statusValue) {
        query.status = statusValue;
    }

    if (userId) {
        query = { ...query, assignedTo: userId };
    }

    try {
        // Fetch tickets without populating `createdBy`
        const tickets = await Ticket.find(query, null, options)
            .populate('category')
            .sort({ createdAt: -1 });

        // Manually populate `createdBy` field
        const populatedTickets = await Promise.all(
            tickets.map(async (ticket) => {
                const populatedUser = await populateCreatedBy(ticket.createdBy);
                return { ...ticket.toObject(), createdBy: populatedUser };
            })
        );

        return populatedTickets;
    } catch (error) {
        console.error('Error fetching tickets:', error);
        throw error;
    }
};

exports.getOpenTicket = async (page = 1, limit = 10, noPagination = false, filters = {}) => {
    const options = {
        skip: (page - 1) * limit,
        limit: noPagination ? undefined : parseInt(limit),
    };

    // Merge filters with the status to only get open tickets
    const query = { status: "Open", ...filters };

    const tickets = await Ticket.find(query, null, options).populate('category').sort({ createdAt: -1 });
    
    return tickets;
};

exports.getById = async (id) => {
    const ticket = await Ticket.findById(id).populate('category');
    if (ticket) {
        let user = (await checkUserType(ticket.createdBy));
        const userType = user.userType;
        // console.log("user : ",user);
        const userData = user.data;
        // console.log("userData : ",userData.username);
        let populatedUser = {
            username: userData.username,
            email: userData.email
        };
        // console.log("populatedUser : ",populatedUser);
        // Populate User's data

        if (userType === 'individual') {
            // console.log("individualUserCollection : ",individualUserCollection);
            populatedUser =  await IndividualUser.findOne(ticket.createdBy).select('username email');
        } else {
            populatedUser = await EnterpriseUser.findOne(ticket.createdBy).select('username email');
        }    
        // console.log("createdBy : ",ticket.createdBy);
        
        const ticketData = ticket.toObject();
        ticketData.createdBy = populatedUser;

    return ticketData;
    }
    else{
        return null;
    }
};

exports.countActiveTickets = async (filters = {}) => {
    const query = {};
     // Apply filters if provided
    if (filters.status) {
        query.status = filters.status;
    }
    if (filters.priority) {
        query.priority = filters.priority;
    }
    if(filters.category){
        query.category = filters.categoryx
    }
    return await Ticket.countDocuments(query);
};

exports.countSolvedTickets = async () => {
    return await Ticket.countDocuments({ status: 'Resolved' });
};

exports.getAllStats = async () => {
    const totalTickets = await Ticket.countDocuments();
    const openTickets = await Ticket.countDocuments({ status: 'Open' });
    const onGoingTickets = await Ticket.countDocuments({status : 'In Progress'})
    const closedTickets = await Ticket.countDocuments({ status: 'Resolved' });
    const highPriorityTickets = await Ticket.countDocuments({ priority: 'High' });
    const mediumPriorityTickets = await Ticket.countDocuments({ priority: 'Medium' });
    const lowPriorityTickets = await Ticket.countDocuments({ priority: 'lLow' });

    return { totalTickets, openTickets, onGoingTickets, closedTickets, highPriorityTickets, mediumPriorityTickets, lowPriorityTickets };
}

exports.update = async (id, data) => {
    return await Ticket.findByIdAndUpdate(id, data, { new: true });
};

exports.addUserToAssigned= async (ticketId, employeeId) => {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
        throw new Error('Ticket not found');
    }
    if (!ticket.assignedTo.includes(employeeId)) {
        ticket.assignedTo.push(employeeId);
        ticket.status = 'In Progress'
        await ticket.save();
    }

    // Send MAIL
    const createdUser = await populateCreatedBy(ticket.createdBy)
    const assingedUser = await employeeModel.findById(employeeId)
    const email = assingedUser?.email
    const usermail = createdUser.email

    const createdAt = new Date(ticket.createdAt);
    // Format the date
    const day = String(createdAt.getDate()).padStart(2, '0');
    const month = String(createdAt.getMonth() + 1).padStart(2, '0');
    const year = String(createdAt.getFullYear()).slice(-2); // Get last 2 digits of the year
    const hours = createdAt.getHours();
    const minutes = String(createdAt.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedTime = `${hours % 12 || 12}:${minutes}${ampm}`;

    const formattedDate = `${day}/${month}/${year}, ${formattedTime}`;

    sendAssignTicketNotification(
        email,
        usermail,
        ticket.ticketNumber, 
        ticket.title, 
        ticket.description, 
        formattedDate,
        assingedUser.username
    )
    return ticket;
}

exports.replayService = async (ticketId, status, replayBy, replayDescription) => {
    try {
        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            throw new Error('Ticket not found');
        }

        // Update ticket fields
        ticket.status = status;
        ticket.replayBy = replayBy;
        ticket.replayDescription = replayDescription;
        ticket.replayedTime = new Date();

        // Save the updated ticket
        await ticket.save();

        return ticket;
    } catch (error) {
        console.error('Error in replayService:', error);
        throw error; // Re-throw the error for controller to handle
    }
};

exports.delete = async (id) => {
    return await Ticket.findByIdAndDelete(id);
};


const generateTicketNumber = async () => {
    const lastTicket = await Ticket.findOne().sort({ createdAt: -1 });
    const lastNumber = lastTicket ? parseInt(lastTicket.ticketNumber.replace('TCK', '')) : 0;
    const newNumber = lastNumber + 1;
    return `TCK${newNumber.toString().padStart(5, '0')}`; // Example format: TCK00001
}

// Helper function to populate `createdBy`
const populateCreatedBy = async (createdById) => {
    // Try finding the user in each collection
    const user =
        (await individualUserCollection.findById(createdById).select('username email image')) ||
        (await enterpriseUser.findById(createdById).select('companyName email image')) ||
        (await enterpriseEmployeModel.findById(createdById).select('username email image'));

    return user || null; // Return the user or null if not found
};

async function sendAssignTicketNotification(email, usermail, ticketNumber, title, description, createdAt, assignedTo) {
    try {
      const mailResponse = await mailSender(
        email,
        "Digital Card Admin - New Ticket Assigned",
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; color: #333; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #333; text-align: center; font-size: 24px; font-weight: 600; margin-bottom: 20px;">New Ticket Assigned - Digital Card Admin</h2>
          
          <div style="background-color: #f4f8fc; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
            <h3 style="font-size: 20px; color: #333; font-weight: 600; margin-bottom: 15px;">Ticket Information</h3>
            <p style="font-size: 16px; color: #555; margin: 10px 0;">A new ticket has been assigned by the admin.</p>
  
            <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #e0e0e0; margin-top: 20px;">
              <p style="font-size: 16px; color: #333; margin: 5px 0;"><strong>Ticket Number:</strong> <span style="font-weight: 600;">${ticketNumber}</span></p>
              <p style="font-size: 16px; color: #333; margin: 5px 0;"><strong>Title:</strong> <span style="font-weight: 600;">${title}</span></p>
              <p style="font-size: 16px; color: #333; margin: 5px 0;"><strong>Description:</strong> <span style="font-weight: 600;">${description}</span></p>
              <p style="font-size: 16px; color: #333; margin: 5px 0;"><strong>Created At:</strong> <span style="font-weight: 600;">${createdAt}</span></p>
              <p style="font-size: 16px; color: #333; margin: 5px 0;"><strong>Ticket created by:</strong> <span style="font-weight: 600;">${usermail}</span></p>
              <p style="font-size: 16px; color: #333; margin: 5px 0;"><strong>Assigned To:</strong> <span style="font-weight: 600;">${assignedTo}</span></p>
            </div>
          </div>
  
          <div style="background-color: #f7f7f7; padding: 15px; margin-top: 30px; border-radius: 8px; text-align: center;">
            <p style="font-size: 14px; color: #777;">Please check the dashboard and resolve.</p>
          </div>
        </div>
  
        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #888;">
          <p>© 2025 Diskuss. All rights reserved.</p>
        </div>
        ` 
      );
      console.log("Email sent successfully: ", mailResponse);
    } catch (error) {
      console.log("Error occurred while sending email: ", error);
      throw error;
    }
}  

async function sendCreateTicketNotification(email, usermail, ticketNumber, title, description, createdAt) {
    try {
      const mailResponse = await mailSender(
        email,
        "Digital Card Admin - New Ticket Raised",
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; color: #333; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #333; text-align: center; font-size: 24px; font-weight: 600; margin-bottom: 20px;">New Ticket Raised - Digital Card Admin</h2>
          
          <div style="background-color: #f4f8fc; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
            <h3 style="font-size: 20px; color: #333; font-weight: 600; margin-bottom: 15px;">Ticket Information</h3>
            <p style="font-size: 16px; color: #555; margin: 10px 0;">A new ticket has been raised by the user.</p>
  
            <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #e0e0e0; margin-top: 20px;">
              <p style="font-size: 16px; color: #333; margin: 5px 0;"><strong>Ticket Number:</strong> <span style="font-weight: 600;">${ticketNumber}</span></p>
              <p style="font-size: 16px; color: #333; margin: 5px 0;"><strong>Title:</strong> <span style="font-weight: 600;">${title}</span></p>
              <p style="font-size: 16px; color: #333; margin: 5px 0;"><strong>Description:</strong> <span style="font-weight: 600;">${description}</span></p>
              <p style="font-size: 16px; color: #333; margin: 5px 0;"><strong>Created At:</strong> <span style="font-weight: 600;">${createdAt}</span></p>
              <p style="font-size: 16px; color: #333; margin: 5px 0;"><strong>Ticket created by:</strong> <span style="font-weight: 600;">${usermail}</span></p>
            </div>
          </div>
  
          <div style="background-color: #f7f7f7; padding: 15px; margin-top: 30px; border-radius: 8px; text-align: center;">
            <p style="font-size: 14px; color: #777;">Please check the dashboard and resolve.</p>
          </div>
        </div>
  
        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #888;">
          <p>© 2025 Diskuss. All rights reserved.</p>
        </div>
        `
      );
      console.log("Email sent successfully: ", mailResponse);
    } catch (error) {
      console.log("Error occurred while sending email: ", error);
      throw error;
    }
  }
  