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

let storage;
if (process.env.NODE_ENV === 'development') {
    storage = new builder.MemoryBotStorage();
} else {
    const tableName = 'botdata';
    const azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
    storage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);
}

const bot = new builder.UniversalBot(connector, function (session, args) {
    session.send("I didn't understand your last message.");
    session.beginDialog('HelpDialog');
});
bot.set('storage', storage);

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
    async (session) => {
        try {
            let list = await incidents.all()
            let result = list.map(incident => `[${incident.number}] ${incident.description}`).join(', ');
            session.send(result);
        } catch (error) {
            session.send(`An unexpected error occured: ${error.message}`);
        }

        session.endDialog();
    }
).triggerAction({
    matches: 'Incident.List'
})

bot.dialog('IncidentShowDialog',
    async (session, args) => {
        var intent = args.intent;
        var input = builder.EntityRecognizer.findEntity(intent.entities, 'Incident.Number');

        if (!input) {
            session.send('Your incident number is invalid, it should be formatted as following: prefix INC/inc/Inc and 7 digits. `inc1234567` is valid for instance.');
        } else {
            try {
                let incident = await incidents.find(input.entity);
                let message = [
                    `[OPENED AT] ${incident.opened_at}`,
                    `[PRIORITY] ${incident.priority}`,
                    `[SEVERITY] ${incident.severity}`,
                    `[ESCALATION] ${incident.escalation}`,
                    `[IMPACT] ${incident.impact}`,
                    `[NUMBER] ${incident.number}`,
                    `[DESCRIPTION] ${incident.description}`,
                    `[COMMENTS] ${incident.comments}`
                ].join(' ');
                session.send(message);
            } catch (error) {
                session.send(`An unexpected error occured: ${error.message}`);
            }
        }

        session.endDialog();
    }
).triggerAction({
    matches: 'Incident.Show'
})
