const express = require(`express`);
const socket = require('socket.io');
const mongoose = require('mongoose');
//const moment = require('moment');
const moment = require('moment-timezone');

//START MONGOOSE---------------------------------------
mongoose.connect(process.env.MONGODB_URI||'mongodb://localhost/chatAPI2',{ useNewUrlParser: true });

const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {type: String},
    password: {type: String}
});
const User = mongoose.model('user',userSchema);
//END MONGOOSE---------------------------------------

//START EXPRESS-----------------------------------
const app = express();
const port = process.env.PORT || 3000;

var server = app.listen(port,()=>{
    console.log(`Listening port 3000`);
});

let publicPath = __dirname+'/public';
app.use(express.static(publicPath));

//END EXPRESS-----------------------------------

const users = {};

//START SOCKETS-----------------------------------
const io = socket(server);
io.sockets.on('connection',(socket)=>{
    
    socket.on('signin',(data, callback)=>{
        User.find({username: data.username})
            .then((users)=>{
                if(users.length<1){
                    const user1 = new User({username: data.username, password: data.password});
                    user1.save();
                    callback({notRepeatUser:true, user:user1.username});
                }else{
                    callback({notRepeatUser:false, user:''});
                }
            });
    });  

    socket.on('login',(user, callback)=>{
        User.find({username: user.username})
            .then((users)=>{
                let flag1 = user.username===users[0].username;
                let flag2 = user.password===users[0].password;
                if(flag1&&flag2){
                    callback({msg:'Access Allowed', user:user.username});
                }
                else{
                    callback({msg:'Wrong Password', user:''});
                }
        }).catch((e)=>{
            console.log(e);
            callback({msg:'Username does not exist', user:''});
        });
    });

    socket.on('user online',(user)=>{
        socket.nickname = user.username;
        users[socket.nickname]=socket;
        io.sockets.emit('list usernames',{users:Object.keys(users)});
    });

    socket.on('send message',(data)=>{
        users[data.to].emit('private', {msg: data.msg, nick:socket.nickname, to: socket.nickname, date:moment().format('MMMM Do YYYY, h:mm:ss a')});

        users[socket.nickname].emit('private', {msg: data.msg, nick: socket.nickname, to: data.to, date:moment().tz("America/Los_Angeles").format('MMM Do YY, h:mm:ss a')});
    });

    socket.on('send global message',(data)=>{
        io.sockets.emit('get global message', {msg: data.msg, nick: socket.nickname, date:moment().tz("America/Los_Angeles").format('MMM Do YY, h:mm:ss a')});
    });

    socket.on('disconnect',()=>{ 
        if(!socket.nickname){
            return;
        }
        delete users[socket.nickname];
        io.sockets.emit('list usernames', {users:Object.keys(users)});
    });

}); 
//END SOCKETS-----------------------------------
