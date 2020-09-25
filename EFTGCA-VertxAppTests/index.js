var ChatMessagesManager = require('efga-messages');

const url = 'wss://webchat-mscarceller.cloud.okteto.net/chat';
const TEST_USERNAME = "UserName ";
const TEST_ROOMNAME = "Tests Room";
const TEST_TEXT_MESSAGE = "Message text number";
const USER_TESTS = 3;

var chatMessagesManagerArray = [];

testWithNUsers(USER_TESTS);

function testWithNUsers(usersCount){
    createTestUsers(usersCount);
    setTimeout(function() {
        initTest(usersCount);
    }, 5000)
}

function createTestUsers(usersCount){
    for(let i=1 ; i<usersCount ; i++){
        chatMessagesManagerArray[i] = new ChatMessagesManager(url);
        
        chatMessagesManagerArray[i].on('textMessage',(data) => {
            console.log(data.user + " say: " + data.text)
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
        chatMessagesManagerArray[i].joinUser(TEST_USERNAME + i, TEST_ROOMNAME);
    }
    setTimeout(function() {
        sendMessages(usersCount);
    }, 5000)
}

function sendMessages(usersCount){
    for(let i=1 ; i<usersCount ; i++){
        chatMessagesManagerArray[i].sendTextMessage(TEST_ROOMNAME, TEST_USERNAME + i, TEST_TEXT_MESSAGE + " " + i);
    }
    setTimeout(function() {
        checkTestsResult(usersCount);
    }, 5000)
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

