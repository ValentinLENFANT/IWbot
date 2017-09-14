/**
 * Created by Valentin on 12/09/2017.
 */

var restify = require('restify');
var botbuilder = require('botbuilder');
var savedAddress;

// Setup restify server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3987, function () {
    console.log('%s Bot started at %s', server.name, server.url);
});

// Create chat connector
var connector = new botbuilder.ChatConnector({
    appId: process.env.APP_ID,
    appPassword: process.env.APP_SECRET
});

// Listening for user inputs
server.post('/api/messages', connector.listen());

// Reply by echoing
var bot = new botbuilder.UniversalBot(connector, function (session) {
    savedAddress = session.message.address;
    session.send('You have tapped the following message: %s <br /> It has a length of: %s ', session.message.text, session.message.text.length); //lol <br /> is working
    // session.send(`You have tapped:${session.message.text} | [Length: ${session.message.text.length}] `);

});

// User is typing
bot.on('typing', function () {
    bot.send(new botbuilder.Message().address(savedAddress).text('You are typing slowly...'));
    //session.send('You are typing slowly...');
});

// Welcome the user on startup + when user added
bot.on('conversationUpdate', function (message) {
    if (message.membersAdded && message.membersAdded.length > 0) {
        message.membersAdded.map(function (x) {

            // Check if not a bot
            if (x.id != message.address.bot.id) {

                // User info
                var membersAdded = x.name || ' ' + '(Id=' + x.id + ' )';

                bot.send(new botbuilder.Message()
                    .address(message.address)
                    .text('Welcome ' + membersAdded + '! How can I help you today? ')
                );
            }
        }).join(', ');
    }
});

// Add and delete bot
bot.on('contactRelationUpdate', function (message) {
    var isSelf = message.address.bot.name + '-' + message.address.bot.id;

    bot.send(new botbuilder.Message()
        .address(savedAddress)
        .text('Welcome ' + isSelf));
});

//todo create a git repository, create a new branch to identify the TP (by example TP-12/09/2017), put the code in it.
//chatbot must echo the input text. He can also detects when a person is typing. The bot give the information of a new user but also for a bot. Same thing for the removal.
//welcome message when loging to a chatbot