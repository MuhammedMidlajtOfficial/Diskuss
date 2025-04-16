const Interaction = require('../../models/tracker/interactionModel');
const { ObjectId } = require('mongoose').Types;

exports.createInteraction = async (user1Id, user2Id) => {
  try {

    // Check if user1Id and user2Id are valid ObjectIds
    if (!user1Id || !user2Id) {
        throw new Error("Invalid user IDs provided.");
        }
    if (user1Id === user2Id) {
        throw new Error("user1Id and user2Id cannot be the same.");
    }
    if (typeof user1Id !== 'string' || typeof user2Id !== 'string') {
        throw new Error("user1Id and user2Id must be strings.");
    }
    if (!ObjectId.isValid(user1Id) || !ObjectId.isValid(user2Id)) {
        throw new Error("Invalid ObjectId format for user1Id or user2Id.");
    }
    
    // Convert ObjectIds to strings
    const ids = [user1Id.toString(), user2Id.toString()];
    // Sort the ids lexicographically
    ids.sort();
    // Join with a hyphen
    const interactionId = ids.join('-');
    // Check if interaction already exists
    const existingInteraction = await Interaction.findOne({interactionId: interactionId});
    if (existingInteraction) {
        existingInteraction.lastContactedAt = Date.now();
        await existingInteraction.save();
        return existingInteraction;
    }

    // Create a new interaction
    console.log("Creating interaction with user1Id:", user1Id, "and user2Id:", user2Id);
    const interaction = new Interaction({user1Id, user2Id});
    await interaction.save();
    return interaction;
  } catch (error) {
    console.error("Error creating interaction:", error);
    throw error;
  }
}

exports.getAllInteractions = async () => {
    try {
        const interactionsList = await Interaction.find({});
        if (!interactionsList || interactionsList.length === 0) {
            return { message: "No interactions found" };
        }
        return interactionsList;
    } catch (error) {
        console.error("Error fetching interactions:", error);
        throw error;
    }
}

exports.getInteractions = async (userId) => {
    try {
        const interactionsList = await Interaction.find({ $or: [{ user1Id: userId }, { user2Id: userId }] });
        if (!interactionsList || interactionsList.length === 0) {
            return { message: "No interactions found" };
        }
        
        return interactionsList;
    } catch (error) {
        console.error("Error fetching interactions:", error);
        throw error;
    }
}


exports.getInteractionById = async (id) => {
    try{
        const interaction = Interaction.findById(id);
        if (!interaction) {
            return { message: "No interaction found" };
        }
        return interaction;
    } catch (error) {
        console.error("Error fetching interaction:", error);
        throw error;
    }
}


exports.getInteractionByInteractionId = async (interactionId) => {
    try{
        const interaction = await Interaction.findOne({ interactionId });
        if (!interaction) {
            return { message: "No interaction found" };
        }
        return interaction;
    } catch (error) {
        console.error("Error fetching interaction:", error);
        throw error;
    }
}


exports.updateInteraction = async (interactionId) => {
    try{
        const interaction = await Interaction.findOneAndUpdate({interactionId}, { lastContactedAt: Date.now() }, { new: true });
        if (!interaction) {
            return { message: "No interaction found" };
        }
        return interaction;
    } catch (error) {
        console.error("Error updating interaction:", error);
        throw error;
    }
}


exports.deleteInteraction = async (interactionId) => {
    try {
        const interaction = await Interaction.findByIdAndDelete({interactionId});
        if (!interaction) {
            return { message: "No interaction found" };
        }
        return { message: "Interaction deleted successfully" };
    } catch (error) {
        console.error("Error deleting interaction:", error);
        throw error;
    }
}