const InteractionService = require("../../services/Tracker/interaction.service");
var ObjectId = require('mongoose').Types.ObjectId;

exports.createInteraction = async (req, res) => {
    try {
        const { user1Id, user2Id } = req.body;
        const interaction = await InteractionService.createInteraction(user1Id, user2Id);
        res.status(201).json(interaction);
    } catch (error) {
        console.error("Error creating interaction:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

exports.getAllInteractions = async (req, res) => {
    try {
        const interactionsList = await InteractionService.getAllInteractions();
        if (!interactionsList || interactionsList.length === 0) {
            return res.status(404).json({ message: "No interactions found" });
        }
        res.status(200).json(interactionsList);
    } catch (error) {
        console.error("Error fetching interactions:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

exports.getInteractions = async (req, res) => {
    const userId = req.params.userId;
    if(ObjectId.isValid(req.params.userId) === false) {
        return res.status(400).json({ message: "Invalid userId" });
    }
    try {
        const interactionsList = await InteractionService.getInteractions(userId);
        res.status(200).json(interactionsList);
    } catch (error) {
        console.error("Error fetching interactions:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

exports.getInteractionById = async (req, res) => {
    try {
        const interactionId = req.params.id;
        const interaction = await InteractionService.getInteractionById(interactionId);
        res.status(200).json(interaction);
    } catch (error) {
        console.error("Error fetching interaction:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

exports.getInteractionByInteractionId = async (req, res) => {
    try {
        const interactionId = req.params.interactionId;
        const interaction = await InteractionService.getInteractionByInteractionId(interactionId);
        res.status(200).json(interaction);
    } catch (error) {
        console.error("Error fetching interaction:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

exports.updateInteraction = async (req, res) => {
    try {
        const interactionId = req.params.interactionId;
        const interaction = await InteractionService.updateInteraction(interactionId);
        res.status(200).json(interaction);
    } catch (error) {
        console.error("Error updating interaction:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

exports.deleteInteraction = async (req, res) => {
    try {
        const interactionId = req.params.interactionId;
        const interaction = await InteractionService.deleteInteraction(interactionId);
        res.status(200).json(interaction);
    } catch (error) {
        console.error("Error deleting interaction:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}