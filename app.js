/**
 * Created by Valentin on 12/09/2017.
 */

var restify = require('restify');
var botbuilder = require('botbuilder');

//setup restify server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3987, function(){
    console.log('%s Bot started at %s', server.name, server.url);
});

//create chat connector
var connector = new botbuilder.ChatConnector({
    appId: process.env.APP_ID,
    appPassword: process.env.APP_SECRET
});

//listening for user inputs
server.post('/api/messages', connector.listen());

//reply by echoing
var bot = new botbuilder.UniversalBot(connector, function(session){
    session.send('You have tapped the following message: %s <br /> It has a length of: %s ', session.message.text, session.message.text.length); //lol <br /> is working
    // session.send(`You have tapped:${session.message.text} | [Length: ${session.message.text.length}] `);

    bot.on('typing', function(){
        session.send('You are typing slowly...');
    });

    bot.on('conversationUpdate', function(message){
        if(message.membersAdded && message.membersAdded.length > 0){
            var membersAdded = message.membersAdded.map(function(x){
                var isSelf = x.id === message.address.bot.id;
                return (isSelf ? message.address.bot.name : x.name) || ' ' + '(Id = ' + x.id + ')'
            }).join(', ');
            bot.send(new botbuilder.Message().address(message.address).text('Bienvenue ' + membersAdded));
        }
    });

    //add and delete bot
    bot.on('contactRelationUpdate', function (message) {
        var isSelf = message.address.bot.name +'-'+ message.address.id;

        bot.send(new botbuilder.Message()
            .address(message.address)
            .text(message.action +' '+ isSelf));
    });

    //todo create a git repository, create a new branch to identify the TP (by example TP-12/09/2017), put the code in it.
    // chatbot must echo the input text. He can also detects when a person is typing. The bot give the information of a new user but also for a bot. Same thing for the removal.
    //welcome message when loging to a chatbot

});