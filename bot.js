const Discord = require('discord.js');
const client = new Discord.Client();
const { Client, MessageEmbed } = require('discord.js');
const config = require('./config.json');    // Token and Prefix

// bank toon names
const hordebank = "ktcbankh"
const alliancebank = "ktcbanka"
// faction badges
const badgea = "<:alliance:725694407122092053>"
const badgeh = "<:horde:725694407310966907>"
const gold = "725443406809006180"

// Bot Activity
client.on("ready", async () => {
    console.log('Boost Bot Is Online')
    client.user.setActivity("Mythic+", {type: "PLAYING"});    
})

client.on("message", async message => {
    if (!message.content.startsWith(config.prefix) || message.author.bot) return;

    const args = message.content.slice(config.prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    const channel = message.channel;

    if (!args.length) {
        return message.channel.send(`You didn't provide any boost details, ${message.author}!`);
    }

    // Random string generator (would like to update to alphanumerical with caps)
    let r = Math.random().toString(36).substring(3, 10) + Math.random().toString(36).substring(3, 10);
    var POT = (args[0]);
    var faction = (args[1]);
    var payment = (args[2]);
    var dungeon = (args[3]);
    var comment = (args[4]);
    var customer = (args[5]);

    if (faction === ("alliance")) {
        var badge = badgea;
        var bank = alliancebank;
    }

    if (faction === ("horde")) {
        var badge = badgeh;
        var bank = hordebank;
    }

    var host = message.author.id;
    var reactions = Object.values(config.emojis);
    await message.delete();

    var bot_message = await channel.send(getEmbed('Apply For Roles'));
    for (let emoji of reactions) {
        await bot_message.react(emoji);
    }


    let key_holder = null;
        
    let queue = {
        'tank': [],
        'heal': [],
        'dps': []
    }

    const filter = (reaction, user) => {
        if (user.bot)
            return false
        if (reaction.emoji.name === config.emojis.close) {
            return user.id === host;
        }
        return reactions.includes(reaction.emoji.name);
    }

    const collector = bot_message.createReactionCollector(filter, { dispose: true });
        
    collector.on('collect', (reaction, user) => {
        switch (reaction.emoji.name) {
            case reactions[0]:      // tank
                queue.tank.push(user);
                break;
            case reactions[1]:      // heal
                queue.heal.push(user);
                break;
            case reactions[2]:      // dps
                queue.dps.push(user);
                break;
            case reactions[3]:      // key
                const active_players = getPlayers();
                if (active_players.includes(user)) {
                    if (!key_holder) {
                        key_holder = user;
                    } else {
                        reaction.users.remove(user.id);
                    }
                } else {
                    reaction.users.remove(user.id);
                    return false;
                }
                break;
        }
        updateEmbed();
            
        // If the game is full and someone has the key
        if (getPlayers().every(val => val) && key_holder) {
            stopCollection();
        }
    });

    collector.on('remove', (reaction, user) => {
        switch (reaction.emoji.name) {
            case config.emojis.tank:      // tank
                queue.tank.splice(queue.tank.indexOf(user), 1);
                break;
            case config.emojis.heal:      // heal
                queue.heal.splice(queue.heal.indexOf(user), 1);
                break;
            case config.emojis.dps:      // dps
                queue.dps.splice(queue.dps.indexOf(user), 1);
                break;
            case config.emojis.key:      // key
                key_holder = null;
                break;
        }
        updateEmbed();
    });

    collector.on('end', (collected, reason) => {
        bot_message.channel.send(`${formatPlayers()}\n Your run ${r} has filled up. Please whisper:\n` + 
        `\`/w ${customer} inv\``);
    });

    // Returns the active players defined as first n in queue.
    function getPlayers() {
        let players = [];
        players.push(queue.tank[0]);        // First (1) in TANK queue
        players.push(queue.heal[0]);        // First (1) in HEAL queue
        players.push(queue.dps[0]);         // First (2) in DPS queue
        players.push(queue.dps[1]);
        return players;
    }

    function conditionalKeyEmoji(user) {
        return (key_holder === user) ? `${config.emojis.key}` : '';
    }

    function formatPlayers() {
        let formatted_string = '';
        let players = getPlayers();
        if (players[0])
            formatted_string += `${config.emojis.tank}${conditionalKeyEmoji(players[0])} ${players[0]}`;
        if (players[1])
            formatted_string += `${config.emojis.heal}${conditionalKeyEmoji(players[1])} ${players[1]}`;
        if (players[2])
            formatted_string += `${config.emojis.dps}${conditionalKeyEmoji(players[2])} ${players[2]}`;
        if (players[3])
            formatted_string += `${config.emojis.dps}${conditionalKeyEmoji(players[3])} ${players[3]}`;
        if (formatted_string === '')
            formatted_string = 'Apply For Roles';
        return formatted_string;
    }

    function getEmbed(players) {
        return new MessageEmbed()
            .setColor('#c731c7') // embed colour DONE
            .setThumbnail('https://i.imgur.com/ZpXw8vX.png')
            .setTitle(message.member.user.tag) // DONE
            .addFields(
                { name: '**Roles**', value: '<@&725726273392869428> \<@&725726285883506720> \<@&725726256917905519>'}, // DONE
                { name: '**Run ID**', value: r}, // DONE
                { name: '**Comment**', value: comment }, // DONE
                { name: '**Boosters**', value: players}, // users @ has to be mentioned after reaction, so bot has to edit embed.
                { name: '**Pot**', value: "<:gold:725443406809006180>" + POT , inline: true }, // DONE
                { name: '**Booster Cut**', value: "<:gold:725443406809006180>" + 0.75 * POT, inline: true }, // DONE
                { name: '**Advertiser Cut**', value:"<:gold:725443406809006180>" + 0.15 * POT , inline: true }, // DONE
                { name: '**Dungeon**', value: "<:keystone:725452952529010750>" + dungeon, inline: true }, // DONE
                { name: '**Payment Realm**', value: badge + payment , inline: true }, // DONE
                { name: '**Gold Bank**', value: ":bank:" + bank +"-"+payment, inline: true }, // DONE
            )
            .setTimestamp()
            .setFooter('Boost Bot', 'https://i.imgur.com/ZpXw8vX.png');
    }

    function updateEmbed() {
        return bot_message.edit(getEmbed(formatPlayers()));
    }

    function stopCollection() {
        collector.stop('Game Is Full');
    }
})

client.login(config.token);