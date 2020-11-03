var ChatMessagesManager = require('../EFTGCA-MessagesLib/index.js');
var fs = require('fs');

//const wsurl = 'wss://webchat-mscarceller.cloud.okteto.net/chat';
//const wsurl = 'ws://localhost:8080/chat';
const wsurl = 'ws://webchat-mscarceller.cloud.okteto.net/chat';
const apiurl = 'http://localhost:8080';
const TEST_USERID = "UserId_";
const TEST_USERNAME = "UserName ";
const TEST_ROOMNAME = "Tests Room";
const USER_TESTS = 20;
const MSGS_TEST = 200;

var chatMessagesManagerArray = [];
var chatMessagesManagerReConnections = 0;


testWithNUsers(USER_TESTS);

console.log("Inizializating test with " + USER_TESTS + " users sending " + MSGS_TEST + " messages");

function testWithNUsers(usersCount){
    createTestUsers(usersCount);

    setTimeout(function() {
        initTest(usersCount);
    }, 2000)
}

function createTestUsers(usersCount){
    for(let i=1 ; i<=usersCount ; i++){
        chatMessagesManagerArray[i] = new ChatMessagesManager(wsurl,apiurl);
        
        
        chatMessagesManagerArray[i].on('textMessage',(data) => {
           // console.log(data.userName + " say: " + data.text)
        });

        chatMessagesManagerArray[i].on('reconnect',() => {
            chatMessagesManagerReConnections++;
          //  console.log("I need to reconnect!");
        });
        
        chatMessagesManagerArray[i].on('newUser',(message) => {
          //  console.log(message.text)
        });
        
        chatMessagesManagerArray[i].on('response',(data) => {
           // console.log("Response " + data.result + " to request number "+ data.id)
        });
        
        chatMessagesManagerArray[i].on('error',(error) => {
            console.log("Error: " + error.message)
        });
    }
}

function initTest(usersCount){
    for(let i=1 ; i<usersCount ; i++){
        chatMessagesManagerArray[i].joinRoom(TEST_USERID + i, TEST_USERNAME + i, TEST_ROOMNAME);
        sleep(100);
    }

    setTimeout(function() {
        sendMessages(usersCount);
    }, 5000)
}

function sendMessages(usersCount){

    console.log("Now users are chatting, please wait...");

    for(let i=1 ; i<usersCount ; i++){
        for(let j=1 ; j < MSGS_TEST ; j++){
            let randomMessage = i + "_" + j + ": " + makeRandomMessage(15);
            chatMessagesManagerArray[i].sendTextMessage(randomMessage);
           // console.log("Sending Message: " + randomMessage);
            sleep(125);
        }
    }

    console.log("Waiting for results, please wait...");

    setTimeout(function() {
        checkTestsResult(usersCount);
    }, 60000)
}

function checkTestsResult(usersCount){

    for(let i=1 ; i<usersCount ; i++){
        console.log("************************************");
        console.log("INFO FOR USER: " + TEST_USERNAME + i)
        console.log("Messages sent: " + chatMessagesManagerArray[i].messages.size);
        console.log("Messages pending: " + chatMessagesManagerArray[i].pendingMessages.size);
        console.log("************************************");
    }
    console.log("************************************");
    console.log("Total users reconnections: " + chatMessagesManagerReConnections);
    console.log("************************************");

    console.log("Test Finished");

    process.exit();
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

 function base64_encode(file) {
    return fs.readFileSync(file, {encoding: 'base64'});
 }

