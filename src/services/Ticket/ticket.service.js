const Ticket = require('../../models/ticket/ticketModel');
const { checkUserType } = require('../../util/HelperFunctions'); 
const EnterpriseUser = require('../../models/enterpriseUser');
const { individualUserCollection: IndividualUser } = require('../../DBConfig');
const { query } = require('express');

const generateTicketNumber = async () => {
    const lastTicket = await Ticket.findOne().sort({ createdAt: -1 });
    const lastNumber = lastTicket ? parseInt(lastTicket.ticketNumber.replace('TCK', '')) : 0;
    const newNumber = lastNumber + 1;
    return `TCK${newNumber.toString().padStart(5, '0')}`; // Example format: TCK00001
}


exports.create = async (data) => {
    data.ticketNumber = await generateTicketNumber();
    const newTicket = new Ticket(data);
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

exports.getAll = async (page = 1, limit = 10, noPagination = false, userId, status) => {
    const options = {
        skip: (page - 1) * limit,
        limit: noPagination ? undefined : parseInt(limit),
    };

    // Ensure `status` is a string, not an object
    const statusValue = typeof status === 'string' ? status : status?.status;

    let query = {};
    // console.log('status', statusValue);

    if (statusValue) {
        query.status = statusValue; // Use the corrected status value
    }

    if (userId) {
        query = { ...query, assignedTo: userId }; // Merge userId into the query
    }

    // console.log('query-', query);

    try {
        const tickets = await Ticket.find(query, null, options)
            .populate('category')
            .sort({ createdAt: -1 });

        // console.log('tickets-', tickets);
        return tickets;
    } catch (error) {
        console.error('Error fetching tickets:', error);
        throw error; // Re-throw error to be handled by the calling function
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
    console.log(ticket);
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

