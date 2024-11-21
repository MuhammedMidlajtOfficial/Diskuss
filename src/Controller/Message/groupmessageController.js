const GroupMessage = require("../../models/GroupMessage");
const Group = require("../../models/Group");

// Create a new group
exports.createGroup = async (req, res) => {
  const { name, participants } = req.body;

  try {
    // Validate that participants array is provided and has at least one member
    if (!participants || participants.length === 0) {
      return res.status(400).json({ error: "Participants are required to create a group." });
    }

    // Create the group document
    const newGroup = new Group({
      name,
      participants
    });

    // Save to database
    const savedGroup = await newGroup.save();

    res.status(201).json({ message: "Group created successfully", group: savedGroup });
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ error: "Error creating group.", details: error.message });
  }
};


let io;

exports.setSocketIO = (socketIO) => {
    io = socketIO;
  };

exports.sendGroupMessage = async (req, res) => {
  const { groupId, senderId, content } = req.body;

  try {
    // Check if the group exists
    const groupExists = await Group.findById(groupId);
    if (!groupExists) {
      return res.status(404).json({ error: "Group not found." });
    }

    // Verify that sender is part of the group
    if (!groupExists.participants.includes(senderId)) {
      return res.status(403).json({ error: "Sender is not a participant in the group." });
    }

    // Create and save the group message
    const groupMessage = await GroupMessage.create({
      groupId,
      senderId,
      content,
      timestamp: Date.now()
    });

    // Emit the message to all connected group participants (optional)
    groupExists.participants.forEach((participantId) => {
      io.to(participantId).emit("receiveGroupMessage", groupMessage);
    });

    res.status(201).json(groupMessage);
  } catch (error) {
    console.error("Error sending group message:", error);
    res.status(500).json({ error: "Error sending group message.", details: error.message });
  }
};

exports.getGroupMessages = async (req, res) => {
    const { groupId } = req.params;
  
    try {
      const messages = await GroupMessage.find({ groupId }).sort({ timestamp: 1 });
      res.status(200).json(messages);
    } catch (error) {
      console.error("Error retrieving group messages:", error);
      res.status(500).json({ error: "Error retrieving group messages." });
    }
  };
  