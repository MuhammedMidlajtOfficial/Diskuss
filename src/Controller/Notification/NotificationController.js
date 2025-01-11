const Notification = require("../../models/notification/NotificationModel");

const getNotification = async (req, res) => {
    try {
      const { userId } = req.params;
      console.log(userId);
  
      // Find only notifications for the specified user that have a status of 'unread'
      const notify = await Notification.find({
        receiver: userId,
        // status: "unread",
      });
  
      // Calculate the unread count
      const unreadNotifications = notify.filter(notification => notification.status === "unread");
  
      // Return the response with notifications and unread count
      return res.status(200).json({
        unreadCount: unreadNotifications.length,
        notifications: notify.reverse(),
      });
    } catch (error) {
      console.log(error);
  
      return res
        .status(500)
        .json({ message: "Internal Server Error", error: error.message });
    }
  };
  

const deleteNotification = async (req, res) => {
  try {
    const { notifyId } = req.params;

    const deletedNotify = await Notification.findByIdAndDelete({
      _id: notifyId,
    });

    console.log(deletedNotify);

    if (!deletedNotify) {
      return res.status(404).json({ message: "Notification not found " });
    }

    return res
      .status(200)
      .json({
        message: "Notification Deleted sucessfully",
        deletedNotifys: deletedNotify,
      });
  } catch (error) {
    console.log(error);

    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

const MarkedAsRead = async (req, res) => {
  try {
    const { notifyId } = req.params;

    const notiicationData = await Notification.findOne({ _id: notifyId });

    if (!notiicationData) {
      return res.status(404).json({ message: "Notification not found " });
    }

    notiicationData.status = "read";

    await notiicationData.save();

    return res
      .status(200)
      .json({
        message: "Notification updated sucessfully",
        notiicationDatas: notiicationData,
      });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

module.exports = { getNotification, deleteNotification, MarkedAsRead };
