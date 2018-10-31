require('dotenv').config();
const restify = require('restify');
const builder = require('botbuilder');
const botbuilder_azure = require('botbuilder-azure');

const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

const connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata
});
server.post('/api/messages', connector.listen());

const tableName = 'botdata';
const azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
const tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

const bot = new builder.UniversalBot(connector, function (session, args) {
    session.send("I didn't understand your last message.");
    session.beginDialog('HelpDialog');
});
bot.set('storage', tableStorage);

const luisAppId = process.env.LuisAppId;
const luisAPIKey = process.env.LuisAPIKey;
const luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';
const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v2.0/apps/' + luisAppId + '?subscription-key=' + luisAPIKey;
const recognizer = new builder.LuisRecognizer(LuisModelUrl);
bot.recognizer(recognizer);

const incidents = require('./lib/incidents/incident');

bot.dialog('GreetingDialog',
    (session) => {
        session.send('You reached the Greeting intent. You said \'%s\'.', session.message.text);
        session.endDialog();
    }
).triggerAction({
    matches: 'Greeting'
})

bot.dialog('HelpDialog',
    (session) => {
        session.send('I can help you with incidents. I can either list all of them or provide you details about a specific one.');
        session.endDialog();
    }
).triggerAction({
    matches: 'Help'
})

bot.dialog('CancelDialog',
    (session) => {
        session.send('You reached the Cancel intent. You said \'%s\'.', session.message.text);
        session.endDialog();
    }
).triggerAction({
    matches: 'Cancel'
})

bot.dialog('IncidentListDialog',
    async function (session) {
        let response;

        try {
            response = await incidents.all();
        } catch (error) {
            response = error.message;
        }

        session.send(response);
        session.endDialog();
    }
).triggerAction({
    matches: 'Incident.List'
})

bot.dialog('IncidentShowDialog',
    (session) => {
        session.send('You reached the Incident.Show intent. You said \'%s\'.', session.message.text);
        session.endDialog();
    }
).triggerAction({
    matches: 'Incident.Show'
})
