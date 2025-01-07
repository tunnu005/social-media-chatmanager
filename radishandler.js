import { createClient} from 'redis'
import dotenv from 'dotenv'

dotenv.config()

const client = createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

client.on('connect', () => {
    console.log('Connected to Redis successfully!');
});

client.on('error', (err) => {
    console.error('Redis connection error:', err);
});


(async() => {
    try {
        await client.connect();
        console.log('Redis client connected');
    } catch (error) {
        console.error('Failed to connect to Redis:', error);
    }
})();

export default client;