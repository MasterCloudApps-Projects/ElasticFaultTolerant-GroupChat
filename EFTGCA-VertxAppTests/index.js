var ChatMessagesManager = require('eftgca-messages');

const url = 'wss://webchat-mscarceller.cloud.okteto.net/chat';
//const url = 'ws://localhost:8080/chat';
const TEST_USERID = "UserId_";
const TEST_USERNAME = "UserName ";
const TEST_ROOMNAME = "Tests Room";
const TEST_TEXT_MESSAGE = "Message text number";
const USER_TESTS = 30;
const MSGS_TEST = 1000;

var chatMessagesManagerArray = [];

testWithNUsers(USER_TESTS);

function testWithNUsers(usersCount){
    createTestUsers(usersCount);

    setTimeout(function() {
        initTest(usersCount);
    }, 2000)
}

function createTestUsers(usersCount){
    for(let i=1 ; i<=usersCount ; i++){
        chatMessagesManagerArray[i] = new ChatMessagesManager(url);
        
        chatMessagesManagerArray[i].on('textMessage',(data) => {
            console.log(data.userName + " say: " + data.text)
        });

        chatMessagesManagerArray[i].on('reconnect',(data) => {
            console.log("I need to reconnect!");
        });
        
        chatMessagesManagerArray[i].on('newUser',(message) => {
            console.log(message.text)
        });
        
        chatMessagesManagerArray[i].on('response',(data) => {
            console.log("Response " + data.result + " to request number "+ data.id)
        });
        
        chatMessagesManagerArray[i].on('error',(error) => {
            console.log("Error (" + error.code + "): " + error.message)
        });
    }
}

function initTest(usersCount){
    for(let i=1 ; i<usersCount ; i++){
        chatMessagesManagerArray[i].joinUser(TEST_USERID + i, TEST_USERNAME + i, TEST_ROOMNAME);
        sleep(100);
    }

    setTimeout(function() {
        sendMessages(usersCount);
    }, 5000)
}

function sendMessages(usersCount){
    for(let i=1 ; i<usersCount ; i++){
        for(let j=1 ; j < MSGS_TEST ; j++){
            let randomMessage = i + "_" + j + ": " + makeRandomMessage(15);
            chatMessagesManagerArray[i].sendTextMessage(TEST_ROOMNAME, TEST_USERID + i, TEST_USERNAME + i, randomMessage);
            console.log("Sending Message: " + randomMessage);
            sleep(25);
        }
    }
    setTimeout(function() {
        checkTestsResult(usersCount);
    }, 3000)
}

function checkTestsResult(usersCount){

    for(let i=1 ; i<usersCount ; i++){
        console.log("************************************");
        console.log("INFO FOR USER: " + TEST_USERNAME + i)
        console.log("Messages sent: " + chatMessagesManagerArray[i].messages.size);
        console.log("Messages pending: " + chatMessagesManagerArray[i].pendingMessages.size);
        console.log("************************************");
    }
}

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

function makeRandomMessage(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }

