// SocketController.js
let ioInstance;

const setSocketIO = (io) => {
    ioInstance = io;

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        // Handle room joining
        socket.on('joinRoom', (userId) => {
            console.log(`User with ID ${userId} joined their room`);
            socket.join(userId.toString());
        });

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });
};

// Emit a notification to a specific user room
const emitNotification = (userId, notification) => {
    if (ioInstance) {
        ioInstance.to(userId.toString()).emit('newNotification', notification);
        console.log(`Notification sent to user ID ${userId}:`, notification);
    }
};

module.exports = {
    setSocketIO,
    emitNotification,
};
