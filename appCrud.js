const express = require('express')
const { sequelize, Comments } = require('./models')
const path = require('path')
const usrMsgs = require('./routes/userMessages')
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require("socket.io");

const route = express.Router()
require('dotenv').config();
const BP = require('body-parser')
const cors = require('cors');

const appCrud = express()
const server = http.createServer(appCrud);
const io = new Server(server, {
    cors: {
        origin: 'https://gagrica-app.herokuapp.com/',
        
        methods: ['GET', 'POST'],
        credentials: true
    },
    allowEIO3: true
});
var corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200
}
appCrud.use(cors(corsOptions));



appCrud.use(BP.urlencoded({extended: false}));
appCrud.use('/admin', BP.json());
appCrud.use('/admin', usrMsgs)

function authSocket(msg, next) {
    if (msg[1].token == null) {
        next(new Error("Not authenticated"));
    } else {
        jwt.verify(msg[1].token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) {
                next(new Error("Not "));
            } else {
                msg[1].user = user;
                next();
            }
        });
    }
}

io.on('connection', socket => {
    socket.use(authSocket);
 
    socket.on('comment', msg => {
         const sema = Joi.object().keys({
        name: Joi.string().trim().max(24).required(),
        body: Joi.string().max(1000),
        likes: Joi.number(),
        dislikes: Joi.number(),
        blogId: Joi.number(),
        
    });
    console.log(msg.user.name)
    const obj={ 
        name: msg.user.name,
        body: msg.body,
        likes: 0, 
        dislikes: 0,
        blogId: msg.blogId
    }

    sema.validate(obj, (err, result) => {
        if (err){
            console.log("VALIDATION ERROR")
            console.log(obj)
            return
        }
          
        else {
           
           
            Comments.create(obj)
            .then( rows => {
                Comments.findAll({ where: { id: rows.id }, include: ['blog'] })
                    .then( msg => io.emit('comment', JSON.stringify(msg)) ) 
            })
            .catch( err => res.status(500).json({ msg: "Invalid credentials"}) );
        }
    });
    });

    socket.on('error', err => socket.emit('error', err.message) );
});





server.listen({ port: process.env.PORT || 9000 }, async () => {
    await sequelize.authenticate();
});