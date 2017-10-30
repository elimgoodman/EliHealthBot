import * as restify from "restify";
import * as builder from "botbuilder";

import * as request from "request-promise";

import * as _ from "lodash";

const library = new builder.Library('checkin');

const questions: Question[] = [
    {
        prompt: "How much did you sleep last night?",
        field: "sleep",
        header: "Sleep"        
    },
    {
        prompt: "What did you eat today?",
        field: "food",
        header: "Food"        
    },
    {
        prompt: "What caffeine did you consume today?",
        field: "caffeine",
        header: "Caffeine"
    },
    {
        prompt: "What drugs did you consume today?",
        field: "drugs",
        header: "Drugs"        
    },
    {
        prompt: "What mindfulness or breathing exercises did you do today?",
        field: "mindfulness",
        header: "Mindfulness"        
    },
    {
        prompt: "What physical exercise did you do today?",
        field: "exercise",
        header: "Exercise"        
    },
    {
        prompt: "What was your stress level today?",
        field: "stressLevel",
        header: "Stress"        
    },
    {
        prompt: "How was your stomach today?",
        field: "stomach",
        header: "Stomach"        
    },
    {
        prompt: "How was your skin today?",
        field: "skin",
        header: "Skin"        
    },
    {
        prompt: "How was your energy today?",
        field: "energy",
        header: "Energy"        
    },
    {
        prompt: "How was your mood today?",
        field: "mood",
        header: "Mood"
    }
];

library.dialog("misc", [
    (session) => {
        builder.Prompts.text(session, "What else did you want to record?");
    },
    (session, args) => {
        session.endDialogWithResult({ response: args.response });
    }
]);

interface Question {
    prompt: string;
    field: string;
    header: string;
}

function questionsToWaterfall(questions: Question[]): any[] {
    return _(questions).map(question => {
        return [
            (session) => {
                builder.Prompts.text(session, question.prompt);            
            },
            (session, args, next) => {
                session.conversationData[question.field] = args.response;
                next();
            }
        ]
    }).flatten().value();
}

library.dialog("declarative", );

library.dialog('/', [
    ...questionsToWaterfall(questions),
    (session, args) => {
        builder.Prompts.choice(session, "Anything else you want to record?",
            ["Yes", "No"],
            { listStyle: builder.ListStyle.button }
        );
    },
    (session, result, next) => {
        if (result.response) {
            switch (result.response.entity) {
                case "Yes":
                    session.beginDialog("misc");
                    break;
                case "No":
                    session.send("No problem!");
                    next();
                    break;
            }
        }

    },
    (session, args) => {
        if (args.response) {
            session.dialogData.entry.misc = args.response;
        }

        session.endDialogWithResult({ response: session.dialogData.entry });
    }
]).cancelAction('cancel', null, { matches: /^cancel/i });

// Setup Restify Server
var server = restify.createServer();
server.listen(3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

const connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

function entryToMd(data: any, questions: Question[]): string {
    return _.flatMap(questions, question => {
        return [
            `### ${question.header}`,
            data[question.field]
        ]
    }).join("\n\n");
}

const CheckinOption = 'Check In';

var bot = new builder.UniversalBot(connector, [
    (session) => {
        builder.Prompts.choice(session,
            'What do yo want to do today?',
            [CheckinOption],
            { listStyle: builder.ListStyle.button });
    },
    (session, result) => {
        if (result.response) {
            switch (result.response.entity) {
                case CheckinOption:
                    session.beginDialog('checkin:/');
                    break;
            }
        } else {
            session.send(`I am sorry but I didn't understand that. I need you to select one of the options below`);
        }
    },
    async (session, result) => {
        await request("https://maker.ifttt.com/trigger/entry_created/with/key/cOQ38Km3UkdRWNdUb_ehjb", {
            method: "POST",
            json: true,
            body: {
                value1: entryToMd(session.conversationData, questions)
            }
        })
        session.send("All done!")
    }
]);

bot.library(library);

// Listen for messages from users 
server.post('/api/messages', connector.listen());