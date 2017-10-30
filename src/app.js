"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
exports.__esModule = true;
var restify = require("restify");
var builder = require("botbuilder");
var request = require("request-promise");
var _ = require("lodash");
var library = new builder.Library('checkin');
var questions = [
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
    function (session) {
        builder.Prompts.text(session, "What else did you want to record?");
    },
    function (session, args) {
        session.endDialogWithResult({ response: args.response });
    }
]);
function questionsToWaterfall(questions) {
    return _(questions).map(function (question) {
        return [
            function (session) {
                builder.Prompts.text(session, question.prompt);
            },
            function (session, args, next) {
                session.conversationData[question.field] = args.response;
                next();
            }
        ];
    }).flatten().value();
}
library.dialog("declarative");
library.dialog('/', questionsToWaterfall(questions).concat([
    function (session, args) {
        builder.Prompts.choice(session, "Anything else you want to record?", ["Yes", "No"], { listStyle: builder.ListStyle.button });
    },
    function (session, result, next) {
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
    function (session, args) {
        if (args.response) {
            session.dialogData.entry.misc = args.response;
        }
        session.endDialogWithResult({ response: session.dialogData.entry });
    }
])).cancelAction('cancel', null, { matches: /^cancel/i });
// Setup Restify Server
var server = restify.createServer();
server.listen(3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});
function entryToMd(data, questions) {
    return _.flatMap(questions, function (question) {
        return [
            "### " + question.header,
            data[question.field]
        ];
    }).join("\n\n");
}
var CheckinOption = 'Check In';
var bot = new builder.UniversalBot(connector, [
    function (session) {
        builder.Prompts.choice(session, 'What do yo want to do today?', [CheckinOption], { listStyle: builder.ListStyle.button });
    },
    function (session, result) {
        if (result.response) {
            switch (result.response.entity) {
                case CheckinOption:
                    session.beginDialog('checkin:/');
                    break;
            }
        }
        else {
            session.send("I am sorry but I didn't understand that. I need you to select one of the options below");
        }
    },
    function (session, result) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, request("https://maker.ifttt.com/trigger/entry_created/with/key/cOQ38Km3UkdRWNdUb_ehjb", {
                        method: "POST",
                        json: true,
                        body: {
                            value1: entryToMd(session.conversationData, questions)
                        }
                    })];
                case 1:
                    _a.sent();
                    session.send("All done!");
                    return [2 /*return*/];
            }
        });
    }); }
]);
bot.library(library);
// Listen for messages from users 
server.post('/api/messages', connector.listen());
