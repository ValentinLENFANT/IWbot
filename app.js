/**
 * Created by Valentin on 12/09/2017.
 */

var restify = require('restify');
var botbuilder = require('botbuilder');

// restify server setup
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3987, function(){
    console.log(`${server.name} bot started at ${server.url}`);
});

// create chat connector
var connector = new botbuilder.ChatConnector({
    appId: process.env.APP_ID,
    appPassword: process.env.APP_SECRET
});

// listening for user inputs
server.post('/api/messages', connector.listen());

// reply by echoing
var bot = new botbuilder.UniversalBot(connector, [
    function(session) {
        session.beginDialog('ensureProfile');

        // bot.on('typing', function(response) {
        //     session.send(response); // Rajouter cette ligne corrige le Bug de messages dupliqués
        //     session.send("ah tu es encore en train de taper..");
        // });

        bot.on('conversationUpdate', function(message) {
            if(message.membersAdded && message.membersAdded.length > 0) {
                var membersAdded = message.membersAdded.map(function (x) {
                    var isSelf = x.id === message.address.bot.id;
                    return (isSelf ? message.address.bot.name : x.name) || ' ' + 'Id = ' + x.id + ')'
                }).join(', ');
                bot.send(new botbuilder.Message()
                    .address(message.address)
                    .text('Bienvenue' + membersAdded)
                );
            }
        });
    },
    function(session, generic) {
        botbuilder.Prompts.text(session, `${generic.temp}`);
        session.endConversation("See you soon!");
    }
]);

bot.dialog('greetings', [
    function(session) {
        session.beginDialog('askName');
    },
    function(session, generic) {
        session.endDialogWithResult(generic);
    }
]);

bot.dialog('askName', [
    function(session) {
        botbuilder.Prompts.text(session, "Hi, what's your name ?");
    },
    function(session, results) {
        var temp = "Hello mate!";
        var generic = {
            temp: temp,
            results: results
        };
        session.endDialogWithResult(generic);
    }
]);

bot.dialog('ensureProfile', [
    function(session, args, next) {
        session.dialogData.profile = args || {};
        if(!session.dialogData.profile.name){
            botbuilder.Prompts.text(session, "What is your name?");
        } else {
            next();
        }
    },
    function (session, results, next) {
        if(results.response) {
            session.dialogData.profile.name = results.response;
        }
        if(!session.dialogData.profile.company) {
            botbuilder.Prompts.text(session, "What company do you work for?");
        } else {
            next();
        }
    },
    function(session, results) {
        if(results.response){
            session.dialogData.profile.company = results.response;
        }
        session.endDialogWithResult({response: session.dialogData.profile})
    }
]);

bot.dialog('dinnerOrder', [
    function(session, results){
        if(results.response){
            session.dialogData.room = results.response;
            var msg = `Thank you. Your order will be delivered to room #${session.dialogData.room}`;
            session.endConversation(msg);
        }
    }
])
.endConversationAction(
    "endOrderDinner", "Ok. Goodbye.",
    {
        matches: /^cancel$|^goodbye$/i,
        confirmPrompt: "This will cancel your order. Are you sure?"
    }
);

//Bot de réservation pour manger dans un restaurant
//Greeting et récupération de nom
//1) Date de la réservation
//2) Le nombre de personnes
//3) Le nom de la personne qui porte la réservation
//End --> Le bot me confirme la réservation avec toutes les informations