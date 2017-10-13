const restify = require('restify');
const botbuilder = require('botbuilder');

// setup restify server

const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function(){
    console.log('%s bot started at %s', server.name, server.url);
});

// create chat connector

const connector = new botbuilder.ChatConnector({
    appId: process.env.APP_ID,
    appPassword: process.env.APP_SECRET
});

// Listening for user input

server.post('/api/messages', connector.listen());

// Reply by echoing

var mainMenu = {
    "Create a new alarm" : {
        "choice": "create"
    },
    "Display the active alarms" : {
        "choice": "showActive"
    },
    "Display all the alarms": {
        "choice": "showAll"
    }
}

let bot = new botbuilder.UniversalBot(connector, [
    function(session) {
        session.beginDialog('mainMenu');
    }
]);

let alarms = [];

bot.dialog('mainMenu', [
    function(session) {
        botbuilder.Prompts.choice(session, 'Make your choice : ', mainMenu, {
            listStyle: botbuilder.ListStyle["button"]
        });    
    },
    function(session, results) {
        session.beginDialog(mainMenu[results.response.entity].choice);
    } 
]);

bot.dialog('create', [
    function(session, args, next) {
        session.dialogData.alarm = args || {};
        if(!session.dialogData.alarm.name) {
            botbuilder.Prompts.text(session, "Choose the alarm's name :");
        }else{
            next();
        }     
    },
    function(session, results, next) {
        if(results.response) {
            session.dialogData.alarm.name = results.response;
        }

        if(!session.dialogData.alarm.date) {
            botbuilder.Prompts.time(session, "Now tell me when I need to create the alarm (date & hour) : " + session.dialogData.alarm.name + " ?");
        }else{
            next();
        }
    },
    function(session, results, next) {
        if(results.response) {
            session.dialogData.alarm.time = botbuilder.EntityRecognizer.resolveTime([results.response]);
        }

        if(!session.dialogData.alarm.active) {
            botbuilder.Prompts.confirm(session, "Would you like to turn on this alarm ?");
        }
    },
    function(session, results, next) {
        if(results.response) {
            session.dialogData.alarm.active = results.response;
        }

        let alarm = {
            "name" : session.dialogData.alarm.name,
            "time" : session.dialogData.alarm.time,
            "active" : session.dialogData.alarm.active
        }
        
        if(alarm.name && alarm.time) {
            
            alarms.push(alarm);
            session.userData.alarms = alarms;

            session.send('Your alarm ' + alarm.name + ' has been succesfuly added!');
            session.replaceDialog('mainMenu');
        }else{
            session.replaceDialog('create');
        }
        
    }
])
.reloadAction(
    "restart", "",
    {
        matches: /^restart/i,
        confirmPrompt: "You will cancel the current alarm, are you sure?"
    }
)
.cancelAction(
    "cancel", "Fine, I cancelled the creation of the alarm.",
    {
        matches: /^cancel/i,
        confirmPrompt: "Are you sure you want to cancel?"
    }
);



bot.dialog('showAll', [
    function(session) {
        let message = "Here are your alarms : <br/>"

        if(session.userData.alarms) {
            for(let alarm of session.userData.alarms) {
                console.log(alarm);
                let isActivated = (alarm.active) ? "Active" : "Inactive";
    
                message += "- " + alarm.name + " : " + alarm.time + " | " + isActivated + " <br/>";
            }
    
            session.send(message);
            session.replaceDialog('mainMenu');
        }else{
            session.send('You don\'t have any alarms');
            session.replaceDialog('mainMenu');
        }    
    }
]);


bot.dialog('showActive', [
    function(session) {
        let message = "Here are your alarms : <br/>"

        if(session.userData.alarms) {
            for(let alarm of session.userData.alarms) {
                if(alarm.active) {
                    message += "- " + alarm.name + " : " + alarm.time + "<br/>";
                }
            }
    
            session.send(message);
            session.replaceDialog('mainMenu');
        }else{
            session.send('You don\'t have any active alarms');
            session.replaceDialog('mainMenu');
        }
    }
]);

bot.on('conversationUpdate', function(message){
    savedAddress = message.address;
    let isBot = (message.membersAdded && message.membersAdded.length == 1) ? 
        message.membersAdded[0].id === message.address.bot.id : false; 
    if(!isBot) {
        if(message.membersAdded && message.membersAdded.length > 0) {
            let membersAdded = message.membersAdded
            .map(function(x) {
                let isSelf = x.id === message.address.bot.id;
                return (isSelf ? message.address.bot.name : x.name) || ' ' + '(Id = ' + x.id + ')';
            }).join(', ');
            bot.send(new botbuilder.Message()
            .address(message.address)
            .text('Bienvenue !'));
            bot.beginDialog(message.address, 'mainMenu');
        }

        if (message.membersRemoved && message.membersRemoved.length > 0) {
            console.log(message.membersRemoved);
            let membersRemoved = message.membersRemoved
                .map(function (m) {
                    let isSelf = m.id === message.address.bot.id;
                    return (isSelf ? message.address.bot.name : m.name) || '' + ' (Id: ' + m.id + ')';
                })
                .join(', ');

            bot.send(new botbuilder.Message()
            .address(message.address)
            .text('Goodbye ' + membersRemoved + '!'));
        }    
    }
});
