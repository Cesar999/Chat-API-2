const socket = io.connect();

const users_memory = [];
let mainUser='';
let route_user;
let global_flag = true;

first_logIn();

//functions----------------------------------

function changeContent(node){
    let mainContent = document.getElementById("main-content");

    while (mainContent.firstChild) {
        mainContent.removeChild(mainContent.firstChild);
    }

    const temp = document.getElementById(node);
    const cloned = temp.content.cloneNode(true);
    mainContent.appendChild(cloned);
}

function first_logIn(){
    changeContent("temp-form-logIn");
    const btnlogIn = document.getElementById('btn-logIn');
    const signUp = document.getElementById('btn-to-signUp');

    btnlogIn.addEventListener('click',(e)=>{
        e.preventDefault();
        logIn_User();
    });

    signUp.addEventListener('click',(e)=>{
        e.preventDefault();
        changeContent("temp-form-signUp");

        const btnSignUp = document.getElementById('btn-signUp');
        btnSignUp.addEventListener('click',()=>{
            signUp_User();
        });

    });
}

function logIn_User(){
    const usernameLogIn = document.getElementById('username-logIn');
    const passwordLogIn = document.getElementById('password-logIn');
    socket.emit('login',{username: usernameLogIn.value, password: passwordLogIn.value},(data)=>{
        alert(data.msg);
        if(data.msg==='Access Allowed'){
            startChat(data.user);
        }
    });
}

function signUp_User(){
    const usernameSignUp = document.getElementById('username-signUp');
    const password1SignUp = document.getElementById('password1-signUp');
    const password2SignUp = document.getElementById('password2-signUp');

    if(usernameSignUp.value.includes(" ")||password1SignUp.value.includes(" ")||usernameSignUp.value.length<3||password1SignUp.value.length<3){
        alert('username/password greater than 2. Do not use white space');
    }else{
        if(password1SignUp.value===password2SignUp.value){
            socket.emit('signin',{username: usernameSignUp.value, password: password1SignUp.value},(data)=>{
                if(data.notRepeatUser){
                    alert('Succesfully Sign In');
                    startChat(data.user);
                }else{
                    alert('Username already taken');
                }
            });
        }
        else{
            alert('Passwords are not the same');
        }
    }
}

function startChat(username){
    mainUser = username;
    changeContent("temp-chat-content");
    document.getElementById('title-username').innerHTML=username;

    const btnLogOut = document.getElementById('btn-logOut');
    btnLogOut.addEventListener('click',(e)=>{
        e.preventDefault();
        first_logIn();
    });

    socket.emit('user online',{username});

    let sendBtn = document.getElementById('btn-send');
    let sendBox = document.getElementById('box-send');

    sendBox.addEventListener("keyup", function(event) {
        event.preventDefault();
        if (event.keyCode === 13) {
            sendBtn.click();
        }
    });

    sendBtn.addEventListener('click',(e)=>{
        e.preventDefault();
        if(global_flag){
            socket.emit('send global message',{msg: sendBox.value});
        }else{
            socket.emit('send message',{msg: sendBox.value, to: route_user});
        }
        sendBox.value = '';
    });

    let a_global= document.getElementById('a_global');
    a_global.addEventListener('click',function(e){
        let chatTitle = document.getElementById('title-username')
        let username = mainUser;
        chatTitle.innerText = '';
        chatTitle.innerText = `${username} to global`;
        global_flag=true;
        changeChat();
    });

}


socket.on('list usernames',(data)=>{
    let arr = data.users;
    console.log(arr);
    let listUsers = document.getElementById('list-users');

    li_arr = listUsers.getElementsByTagName('LI');
    li_arr = Array.from(li_arr);
    for(li of li_arr){
        if(li.firstChild.innerHTML!==`Global`){
            li.remove();
        }
    }


    for(user of arr){
        let li = document.createElement('li');
        li.innerHTML = `<a href='#'>${user}</a>`;
        li.className = 'li-users';
        li.firstChild.addEventListener('click',function(e){
            route_user = e.target.innerText;
            let chatTitle = document.getElementById('title-username')
            let username = mainUser;
            chatTitle.innerText = '';
            chatTitle.innerText = `${username} to ${route_user}`;
            global_flag = false;
            changeChat();
        });
        listUsers.appendChild(li);

        if(users_memory.includes(user)){}
        else{
            users_memory.push(user);
            let wrapper = document.getElementById(`chat-area-wrapper`);
            let node = document.createElement('div');
            node.id = `chat-area-${user}`;
            node.className = `chat-area-class`;
            node.style.display = 'none';
            wrapper.appendChild(node);
        }
    }
    
});

function changeChat(){
    let wrapper = document.getElementById(`chat-area-wrapper`);
    let d_array = wrapper.getElementsByTagName('DIV');
    d_array = Array.from(d_array);
    console.log(global_flag);
        for(element of d_array){
            if(global_flag){
                if(element.id===`chat-area-global`){
                    element.style.display = 'block';
                }
                else{
                    element.style.display = 'none'; 
                }
            }
            else{
                if(element.id===`chat-area-${route_user}`){
                    element.style.display = 'block';
                }
                else{
                    element.style.display = 'none'; 
                }
            }

        }
}

socket.on('private',(data)=>{
    let chatBox = document.getElementById(`chat-area-${data.to}`);
    chatBox.innerHTML += `<span><strong>${data.nick}</strong>: ${data.msg}</span<><br/>`;
});

socket.on('get global message',(data)=>{
    let chatBox = document.getElementById(`chat-area-global`);
    chatBox.innerHTML += `<span class='global'><strong>${data.nick}</strong>: ${data.msg}</span<><br/>`;
});