// import { SendMessageSocket } from "../controllers/chatController.js";
// import Messages from "../models/Messages.js";

import { Messages } from 'buzzy-schemas'

// Connect to Redis server
const messageBuffer = [];
const BATCH_INTERVAL = 5000; // Flush messages every 5 seconds

// Debounced batch-saving function
let batchSaveTimeout = null;
const debounceBatchSave = () => {
    if (batchSaveTimeout) clearTimeout(batchSaveTimeout);
    batchSaveTimeout = setTimeout(async () => {
        await saveBufferedMessages();
    }, BATCH_INTERVAL);
};

async function saveBufferedMessages() {
    if (messageBuffer.length > 0) {
        try {
            await Messages.insertMany(messageBuffer);
            console.log(`${messageBuffer.length} messages saved to DB`);
            messageBuffer.length = 0; // Clear the buffer after saving
        } catch (error) {
            console.error('Error saving batched messages:', error);
        }
    }
}

function chatHandler(io, socket, redisClient) {
    console.log(`User connected: ${socket.id}`);

    // Event: User joins the chat
    socket.on('join', async (userId) => {
        try {
            const ttl = 600; // 10 minutes TTL
            await redisClient.set(`online:${userId}`, socket.id, {
                EX: ttl // Set TTL in seconds
            });
            console.log(`User ${userId} connected with socket ${socket.id}`);
        } catch (error) {
            console.error(`Error storing user ${userId} status in Redis:`, error);
        }
    });

    // Event: Private message between users
    socket.on('private-message', async ({ senderId, receiverId, message }) => {
        try {
            console.log(`Private message from ${senderId} to ${receiverId}: ${message}`);
            
            // Add message to buffer and trigger debounced save
            messageBuffer.push({ senderId, receiverId, message });
            debounceBatchSave();

            // Retrieve receiver's socket ID from Redis
            const receiverSocketId = await redisClient.get(`online:${receiverId}`);
            if (receiverSocketId) {
                // Real-time message delivery if the receiver is online
                io.to(receiverSocketId).emit('receive-message', { senderId, message });
            } else {
                console.log(`User ${receiverId} is offline, message saved for later.`);
            }
        } catch (error) {
            console.error("Error handling private message:", error);
        }
    });

    // Event: User disconnects from the chat
    socket.on('disconnect', async () => {
        try {
            // Get the userId from the socket ID (you should map socket IDs to userIds during join)
            const userId = await redisClient.get(`online:${socket.id}`);
            if (userId) {
                // Remove the user from Redis when they disconnect
                await redisClient.del(`online:${userId}`);
                console.log(`User ${userId} disconnected`);
            }
        } catch (error) {
            console.error("Error handling user disconnection:", error);
        }
    });
}

export default chatHandler;
