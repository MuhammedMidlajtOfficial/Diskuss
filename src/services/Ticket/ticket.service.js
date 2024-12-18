const Ticket = require('../../models/ticket/ticketModel');
const { checkUserType } = require('../../util/HelperFunctions'); 
const EnterpriseUser = require('../../models/enterpriseUser');
const { individualUserCollection: IndividualUser } = require('../../DBConfig');

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

exports.getAll = async (page =1,  ) => {
    const tickets = await Ticket.find();
    let populatedTickets = [];
    for (let ticket of tickets) {
        let user = (await checkUserType(ticket.createdBy));
        const userType = user.userType;
        const userData = user.data;
        let populatedUser = {
            username: userData.username,
            email: userData.email
        };
        if (userType === 'individual') {
            // populatedUser =  await IndividualUser.findOne(ticket.createdBy).select('username email');
        } else {
            populatedUser = await EnterpriseUser.findOne(ticket.createdBy).select('username email');
        }
        const ticketData = ticket.toObject();
        ticketData.createdBy = populatedUser;
        populatedTickets.push(ticketData);
    }
    return populatedTickets;
};

exports.getById = async (id) => {
    const ticket = await Ticket.findById(id);
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
        console.log("populatedUser : ",populatedUser);
        // Populate User's data

        if (userType === 'individual') {
            // console.log("individualUserCollection : ",individualUserCollection);
            // populatedUser =  await IndividualUser.findOne(ticket.createdBy).select('username email');
        } else {
            populatedUser = await EnterpriseUser.findOne(ticket.createdBy).select('username email');
        }    
        console.log("createdBy : ",ticket.createdBy);
        
        const ticketData = ticket.toObject();
        ticketData.createdBy = populatedUser;

    return ticketData;
    }
    else{
        return null;
    }
};

exports.update = async (id, data) => {
    return await Ticket.findByIdAndUpdate(id, data, { new: true });
};

exports.delete = async (id) => {
    return await Ticket.findByIdAndDelete(id);
};
