var irc = require('irc'),
    _ = require('lodash'),
    fs = require("fs");

var ircConfig = {
    channels: ['##farce'],
    server: 'irc.freenode.net',
    botName: 'yahtzeebot',
    commandPrefix: '!'
};

const CMDDIR = "./commands/";

var bot = new irc.Client(ircConfig.server, ircConfig.botName, {
    channels: ircConfig.channels
});

var commands = {};

var loadCommand = function(file){
  var cmds = {};
  if (!fs.existsSync(CMDDIR + file)) return false;
  try {
    cmds[file.split('.').slice(0,-1).join('.')] = require(CMDDIR + file)(bot);
  } catch(e) {
    console.error(e);
  } finally {
    _.extend(commands, cmds);
  }
};

/** Initially load all command files **/
fs.readdirSync(CMDDIR).forEach(loadCommand);

/** Autoreload commands when their files are changed. **/
fs.watch(CMDDIR, {persistent: true}, function(event, file){
    if (event == "renamed") {
        console.error("Auto-reloading of commands does not handle renaming. Please reload the bot for accuracy.");
    } else {
        console.log(file + " changed, attempting to load command.");

        //Clear the require cache, attempt to load the file, if unsuccessful,
        //restore the require cache to the old version of the command
        var cacheKey = require.resolve(CMDDIR + file);
        var cache = require.cache[cacheKey];
        delete require.cache[cacheKey];
        if (!loadCommand(file)) {
            require.cache[cacheKey] = cache;
        }
    }
});


/** Sets the bot up to listen for commands. **/
bot.addListener('message', function(from, to, text, message) {
    var parsed = text.match(new RegExp("^" + ircConfig.commandPrefix + "(\\S+)(?: +(.*))?"));
    if (!parsed) return;

    cmd = parsed[1];
    message.args = parsed[2] ? parsed[2].split(/[\s,]+/) : [];
    message.from = from;
    message.to = to;
    message.text = text;

    if (commands.hasOwnProperty(cmd)) commands[cmd](message);

});
