"use strict";

const { Client, MessageEmbed } = require('discord.js');
const fs = require("fs");
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MEMBERS"] });

function readMasterJson() {
    return JSON.parse(fs.readFileSync("ghostbot.json"));
}

/**
 * Calculates a difference of a number between 1 and 1000, with wraparounds.
 * @param {int} swing Must be between 1 and 1000.
 * @param {int} pitch Must be between 1 and 1000.
 * @returns int
 */
function calculateDiff(swing, pitch) {
    const num = Math.abs(pitch - swing);
    if (num > 500) return 1000 - num;
    return num;
}
/**
 * Gives the score for a certain diff on a ghostball pitch.
 * Sourced from https://discord.com/channels/593158072176869385/615371719301005361/862041200911712286
 * @param {int} diff 
 * @returns int
 */
function calculateScoring(diff) {
    if (diff <= 10) return 100;
    if (diff <= 50) return 75;
    if (diff <= 100) return 65;
    if (diff <= 200) return 50;
    if (diff <= 350) return 25;
    if (diff <= 480) return 0;
    return -10;
}

client.on("ready", () => {
    console.log(`Logged in as\n${client.user.tag}\n${client.user.id}`);
});

client.on("messageCreate", message => {
    if (message.author.id === client.user.id) return;
    if (!message.content.startsWith(".")) return;
    let command = message.content.substr(1).split(" ")[0];
    let args = message.content.split(" ");
    args.shift();

    switch (command) {
        case "ping":
            message.channel.send("Pong!");
            break;
        case "reset":
        case "resetsession": {
            let captainRole = message.guild.roles.cache.find(role => role.name === "Captains");
            if (message.member.roles.cache.has(captainRole.id)) {
                let masterJson = readMasterJson();
                masterJson["Scoreboard"] = {};
                fs.writeFileSync("ghostbot.json", JSON.stringify(masterJson, null, 4));
                message.reply("Leaderboards reset.");
            }
            else {
                message.reply("Sorry friend! You do not have the Captains role and cannot reset the session leaderboard.");
            }
            break;
        }
        case "abandon":
        case "abandonab": {
            let captainRole = message.guild.roles.cache.find(role => role.name === "Captains");
            if (message.member.roles.cache.has(captainRole.id)) {
                let masterJson = readMasterJson();
                masterJson["CurrentGuesses"] = {};
                fs.writeFileSync("ghostbot.json", JSON.stringify(masterJson, null, 4));
                message.reply("At-bat abandoned.");
            }
            else {
                message.reply("Sorry friend! You do not have the Captains role and cannot abandon the at-bat.");
            }
            break;
        }
        case "newab": {
            let captainRole = message.guild.roles.cache.find(role => role.name === "Captains");
            if (message.member.roles.cache.has(captainRole.id)) {
                let currentGuesses = readMasterJson()["CurrentGuesses"];
                if (Object.keys(currentGuesses).length != 0) {
                    message.reply("An at bat is already taking place! Use `.currentab` to view the current at-bat and `.endab (number)` or `.abandonab` to end it.");
                    break;
                }
                let ghostballRole = message.guild.roles.cache.find(role => role.name === "ghostball");
                message.reply(`<@&${ghostballRole.id}> New at-bat started. Make your guesses with \`.guess (number)\``);
            }
            else {
                message.reply("Sorry friend! You do not have the Captains role and cannot start a new swing.");
            }
            break;
        }
        case "guess": {
            let guessNumber = parseInt(args[0]);
            if (isNaN(guessNumber)) {
                message.reply("Number not found.");
                break;
            }
            if (1 <= guessNumber && guessNumber <= 1000) {
                let masterJson = readMasterJson();
                masterJson["CurrentGuesses"][message.author.id] = guessNumber;
                fs.writeFileSync("ghostbot.json", JSON.stringify(masterJson, null, 4));
                message.reply(`Your guess of \`${guessNumber}\` has been recorded.`);
            }
            else {
                message.reply("Number out of range.");
            }
            break;
        }
        case "endab": {
            let endNumber = parseInt(args[0]);
            if (isNaN(endNumber)) {
                message.reply("Number not found. Please specify a number after the command.");
                break;
            }
            if (1 <= endNumber && endNumber <= 1000) {
                let masterJson = readMasterJson();

                let desc = "```\nUser                              | Diff (Pts Scored) \n------------------------------------------------------\n";
                for (const key in masterJson["CurrentGuesses"]) {
                    let diff = calculateDiff(masterJson["CurrentGuesses"][key], endNumber);
                    let pointsScored = calculateScoring(diff);
                    if (!(key in masterJson["Scoreboard"])) masterJson["Scoreboard"][key] = 0;
                    if (!(key in masterJson["CareerScoreboard"])) masterJson["CareerScoreboard"][key] = 0;
                    masterJson["Scoreboard"][key] += pointsScored;
                    masterJson["CareerScoreboard"][key] += pointsScored;
                    let user = client.users.cache.get(key);
                    desc += `${user.tag}${" ".repeat(34-user.tag.length)}| ${diff} (${pointsScored})\n`;    
                }
                desc += "```";
                masterJson["CurrentGuesses"] = {};
                
                fs.writeFileSync("ghostbot.json", JSON.stringify(masterJson, null, 4));

                let embed = new MessageEmbed()
                    .setColor("#000000")
                    .setTitle("Ghostball Results (Pitch was " + endNumber + ")")
                    .setDescription(desc)
                    .setFooter("Check session leaderboard with .sessionleaderboard and careerleaderboard with .leaderboard");
                message.channel.send({ embeds: [embed] });
            }
            else {
                message.reply("Number out of range.");
            }
            break;
        }
        case "sessionleaderboard": {
            let seasonLeaderboard = readMasterJson()["Scoreboard"]; 

            var sortableLeaderboard = [];
            for (var user in seasonLeaderboard) {
                sortableLeaderboard.push([user, seasonLeaderboard[user]]);
            }
            sortableLeaderboard.sort(function(a, b) {
                return b[1] - a[1];
            });

            let desc = "```\nUser                                        | Score \n-----------------------------------------------------\n";
            for (const entry of sortableLeaderboard) {
                let user = client.users.cache.get(entry[0]);
                desc += `${user.tag}${" ".repeat(44-user.tag.length)}| ${entry[1]}\n`;
            }
            desc += "```";
            
            let embed = new MessageEmbed()
                .setColor("#000000")
                .setTitle("Ghostball Session Leaderboard")
                .setDescription(desc);
            message.channel.send({ embeds: [embed] });
            break;
        }
        case "leaderboard":
        case "careerleaderboard": {
            let careerLeaderboard = readMasterJson()["CareerScoreboard"]; 

            var sortableLeaderboard = [];
            for (var user in careerLeaderboard) {
                sortableLeaderboard.push([user, careerLeaderboard[user]]);
            }
            sortableLeaderboard.sort(function(a, b) {
                return b[1] - a[1];
            });

            let desc = "```\nUser                                        | Score \n-----------------------------------------------------\n";
            for (const entry of sortableLeaderboard) {
                let user = client.users.cache.get(entry[0]);
                desc += `${user.tag}${" ".repeat(44-user.tag.length)}| ${entry[1]}\n`;
            }
            desc += "```";

            let embed = new MessageEmbed()
                .setColor("#000000")
                .setTitle("Ghostball All-Time Leaderboard")
                .setDescription(desc);
            message.channel.send({ embeds: [embed] });
            break;
        }
        case "debug":
        case "spiteverythingout":
            if (message.author.id != 325356320473612290n) return;
            let test = JSON.parse(fs.readFileSync("ghostbot.json"));
            message.channel.send(JSON.stringify(test, null, 4));
            break;
        default:
            message.reply("Command not found.");
    }
});

//If ghostbot.json does not exist, creates a blank one
if (!fs.existsSync("ghostbot.json")) {
    const toWrite = {
        "Scoreboard": {},
        "CareerScoreboard": {},
        "CurrentGuesses": {}
    };
    fs.writeFileSync("ghostbot.json", JSON.stringify(toWrite, null, 4));
}

const token = fs.readFileSync("token.txt");
client.login(token.toString());