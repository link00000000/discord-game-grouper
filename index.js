// https://discordapp.com/oauth2/authorize?client_id=330467798834741258&scope=bot&permissions=469763256
const Eris = require('eris');

var auth = require('./auth.json');
var bot = new Eris(auth.token);
var winston = require('winston');
var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({ filename: 'output.log' })
    ]
});

bot.on('ready', function() {

    console.log('Ready');

});

bot.on('presenceUpdate', function(user, pastState) {

    logger.info(`Presence update triggered by ${user.username} [${user.id}] on guild ${user.guild.name} [${user.guild.id}]`);

    var roles = user.guild.roles.map(function(role) {
        return role;
    });

    // On game open
    if(user.game) {

        // Check for existence of role
        var roleExists = false;

        for(var i in roles) {

            if(roles[i].name === user.game.name.toUpperCase()) {

                roleExists = roles[i].id;

            }

        }

        if(roleExists) {

            // Add user to role if it exists
            user.addRole(roleExists, "Discord Game Grouper");
            logger.info(`User ${user.username} [${user.id}] added to role ${user.game.name.toUpperCase()} [${roleExists}] on guild ${user.guild.name} [${user.guild.id}]`);

            // Update role visibility
            setTimeout(function() {

                // Save to role id to roleId variable
                var currentRole, newRoleLength = 0;

                for(var i in roles) {
                    if(roles[i].name === user.game.name.toUpperCase()) {
                        currentRole = roles[i];
                    }
                }

                // If role of member equals roleId, increase number of users in role
                var members = user.guild.members.map(function(member) {
                    return member;
                });

                for(var i in members) {
                    for(var j in members[i].roles) {
                        if(members[i].roles[j] === currentRole.id) {
                            newRoleLength++;
                        }
                    }
                }

                // If newRoleLength is greater than 1, make role visible
                // Else, make role invisible
                if(newRoleLength > 1) {

                    bot.editRole(user.guild.id, currentRole.id, {hoist: true}, "Discord Game Grouper");
                    logger.info(`Role ${currentRole.name} [${currentRole.id}] on guild ${user.guild.name} [${user.guild.id}] consists of ${newRoleLength} members. Making role visible`);

                } else {

                    bot.editRole(user.guild.id, currentRole.id, {hoist: false}, "Discord Game Grouper");
                    logger.info(`Role ${currentRole.name} [${currentRole.id}] on guild ${user.guild.name} [${user.guild.id}] consists of ${newRoleLength} member. Making role invisible`);

                }

            }, 1000);

        } else {

            // Create new roll with name of current game played
            var roleOptions = {
                name: user.game.name.toUpperCase(),
                mentionable: true,
                hoist: false
            };

            var roleReason = "Discord Game Grouper";

            bot.createRole(user.guild.id, roleOptions, roleReason);
            logger.info(`Created new role with name ${user.game.name.toUpperCase()} on guild ${user.guild.name} [${user.guild.id}]`);

            setTimeout(function() {

                // Get id of newly created role
                var roles = user.guild.roles.map(function(role) {
                    return role;
                });

                var currentRole;

                for(var i = 0; i < roles.length; i++) {
                    if(roles[i].name === user.game.name.toUpperCase()) {
                        currentRole = roles[i];
                    }
                }

                // Add user to new role
                user.addRole(currentRole.id, "Discord Game Grouper");
                logger.info(`User ${user.username} [${user.id}] added to role ${currentRole.name} [${currentRole.id}] on guild ${user.guild.name} [${user.guild.id}]`);

            }, 1000);
        }
    } else {

        // If game was closed
        if(pastState.game) {

            try {
                // Get role for closed game
                var gameRole;

                var userRoles = user.guild.roles.map(function(role) {
                    return role;
                });

                for(var i in userRoles) {

                    if(pastState.game.name.toUpperCase() === userRoles[i].name) {

                        gameRole = userRoles[i];

                    }
                }

                // Remove user from game role
                user.removeRole(gameRole.id, "Discord Game Grouper");
                logger.info(`Removed ${user.username} [${user.id}] from role ${gameRole.name} [${gameRole.id}] on guild ${user.guild.name} [${user.guild.id}]`);

                setTimeout(function() {

                    // Get length of users in role
                    var gameRoleLength = 0;

                    var guildMembers = gameRole.guild.members.map(function(member) {
                        return member;
                    });

                    for(var i in guildMembers) {

                        for(var j in guildMembers[i].roles) {

                            if(guildMembers[i].roles[j] === gameRole.id) {

                                gameRoleLength++;

                            }
                        }
                    }

                    // If role is empty, remove role from guild
                    if(gameRoleLength === 0) {

                        bot.deleteRole(user.guild.id, gameRole.id);
                        logger.info(`Role ${gameRole.name} [${gameRole.id}] on guild ${user.guild.name} [${user.guild.id}] consists of 0 members. Removing Role`);

                    } else if(gameRoleLength > 1) {

                        bot.editRole(user.guild.id, gameRole.id, {hoist: true});
                        logger.info(`Role ${gameRole.name} [${gameRole.id}] on guild ${user.guild.name} [${user.guild.id}] consists of 0 members. Making role invisible`);

                    } else {

                        bot.editRole(user.guild.id, gameRole.id, {hoist: false});
                        logger.info(`Role ${gameRole.name} [${gameRole.id}] on guild ${user.guild.name} [${user.guild.id}] consists of ${gameRoleLength} members. Making role visible`);

                    }

                }, 1000);

            } catch(e) {}

        }

    }
});

bot.connect();

process.on('SIGINT', function () {
    bot.disconnect();
    console.log('Disconnecting...');
    process.exit();
});