# ghostbot
A Discord bot (using node.js) that tracks guesses for MLR swings, and gives points based on accuracy. Licensed under MIT.
# Scoring
Default scoring is based on a system used by the fake Chicago White Sox.

![](https://cdn.discordapp.com/attachments/615371719301005361/862041200788897792/unknown.png)
# Setup
Requires the latest version of node.js.
1. Download this repository into your local machine.
2. run `npm install` in the local directory to install requirements and their dependencies.
3. Create a token.txt file with your bot token in plaintext.
4. Modify the source code to make sure the bot pings and checks for the right roles. Don't worry if you don't know javascript, this part is just replacing string literals. The default roles (case-sensitive) are "Captains" (checked for any privileged action) and "ghostball" (pinged on a new at-bat).
5. Run the bot with `node ghostbot.js`.
6. Enjoy!
