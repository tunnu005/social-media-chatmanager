import express from 'express';
import connectDB from './connectdb.js';
import dotenv from 'dotenv';
import helmet from 'helmet'
import cookieParser from 'cookie-parser';
import cors from 'cors'
import http from 'http';
import { Server as Socketserver} from 'socket.io'
import redisClient from './radishandler.js'
import chatHandler from './sockethandler.js';
import { SendMessage,getMessage,getUserFollow } from './services.js';
import Auth from './auth.js';



dotenv.config();
const app = express();
connectDB();


app.use(express.json({limit :'10mb'}))
app.use(helmet())


app.use(cookieParser());

// CORS Configuration
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [
        'http://localhost:5174',
        'http://localhost:5173',
        'https://buzzzy.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.get('/', (req, res) => {
    res.send('Hello this is ChatManagment server!');
});


const PORT = process.env.PORT || 3004;
const server = http.createServer(app);

const io = new Socketserver(server,{
    cors : {
        origin : process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [
            'http://localhost:5174',
            'http://localhost:5173',
            'https://buzzzy.vercel.app'
        ],
    },
    transports : ['websocket', 'polling'],
})

app.post('/api/chat/send', Auth,SendMessage)
app.get('/api/chat/getMessages/:user1/:user2',getMessage)
app.get('/api/chat/getUsersfollow',Auth,getUserFollow)


io.on('connection',(socket) =>{
    console.log(`Socket connected: ${socket.id}`);
    chatHandler(io,socket,redisClient)

})

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});
