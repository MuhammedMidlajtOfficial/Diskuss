let io;

const setSocketIO = (socketIoInstance) => {
  io = socketIoInstance;
};

const emitNotification = async (userId, notification) => {
  if (io) {
    
    
   const ans = await io.to(userId).emit('notification', notification);
   console.log(ans);
   
//    console.log(`${notification} is send user id${userId} `);
  }
};

module.exports = {
  setSocketIO,
  emitNotification,
};
