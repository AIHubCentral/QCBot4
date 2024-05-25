const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const axios = require('axios');
const wait = require('node:timers/promises').setTimeout;
const env = require('dotenv').config();
const botAdminId = process.env.botAdminId;
const powerUrl = process.env.powerUrl;
const powerApiKey = process.env.powerApiKey;
const powerId = process.env.powerId;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('power')
		.setDescription('Manage the bot\'s server'),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });

        if (interaction.user.id != botAdminId && !interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return await interaction.editReply(`You do not have permission to use this command.`);
        }

        const restartButton = new ButtonBuilder()
			.setCustomId('restart')
			.setLabel('Restart')
			.setStyle(ButtonStyle.Success);

		const stopButton = new ButtonBuilder()
			.setCustomId('stop')
			.setLabel('Stop')
			.setStyle(ButtonStyle.Danger);

		const cancelButton = new ButtonBuilder()
			.setCustomId('cancel')
			.setLabel('Cancel action')
			.setStyle(ButtonStyle.Secondary);

		const sentMessage = await interaction.editReply({
			content: `Choose what to do with the bot's server:`,
			components: [ new ActionRowBuilder().addComponents(cancelButton, stopButton, restartButton) ],
        });

        try {
            const confirmation = await sentMessage.awaitMessageComponent({ time: 30_000 });

            if (confirmation.customId == 'restart') {
				await interaction.editReply({ content: `Restart request will be sent <t:${Math.floor(new Date().getTime() / 1000) + 10}:R>`, components: [] });
				await wait(10_000);

				const response = await axios.post(
					`${powerUrl}/api/client/servers/${powerId}/power`,
					{ signal: 'restart' },
					{
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${powerApiKey}`,
						},
					}
				);

				if (response.status != 204) {
					throw new Error(`Failed to restart server: ${response.status}`);
				}
            } else if (confirmation.customId == 'stop') {
				await interaction.editReply({ content: `Stop request will be sent <t:${Math.floor(new Date().getTime() / 1000) + 10}:R>`, components: [] });
				await wait(10_000);

				const response = await axios.post(
					`${powerUrl}/api/client/servers/${powerId}/power`,
					{ signal: 'stop' },
					{
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${powerApiKey}`,
						},
					}
				);

				if (response.status != 204) {
					throw new Error(`Failed to stop server: ${response.status}`);
				}
            } else if (confirmation.customId == 'cancel') {
                await confirmation.update({ content: `Action cancelled.`, components: [] });
            }
        } catch (error) {
            if (error.name == 'Error [InteractionCollectorError]') {
                await interaction.editReply({ content: `Confirmation not received within 30 seconds, cancelling.`, components: [] });
            } else {
				await interaction.editReply({ content: `An error occurred! ${error}`, components: [] });
            }
        }
	}
};
