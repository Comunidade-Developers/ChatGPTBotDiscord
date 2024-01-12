import { CacheType, Client, Events, GatewayIntentBits, Interaction, SlashCommandBuilder } from 'discord.js';
import OpenAI from "openai";
import { config } from 'dotenv';
config();

const openai = new OpenAI({
  apiKey: process.env.CHAT_GPT_KEY
});

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (c) => {
  console.log('Ready!');
  const chat = new SlashCommandBuilder()
    .setName('chat')
    .setDescription('conversa com o chat gpt')
    .addStringOption((input) => input.setName('prompt').setDescription('Faça sua pergunta ao Chat GPT').setRequired(true))

  client.application?.commands.create(chat.toJSON(), '1025475773626331207');
});

client.on(Events.InteractionCreate, async (interaction: Interaction<CacheType>) => {
  try {
    if (!interaction.isChatInputCommand()) return;
    const { commandName } = interaction;
    if (commandName !== 'chat') return;

    const [{ value }] = interaction.options.data;

    const completion = await openai.chat.completions.create({
      messages: [
        { "role": "system", "content": "You are a helpful assistant designed to output text." },
        { "role": "user", "content": `${value}` }
      ],
      model: "gpt-3.5-turbo",
    });

    const data = String(completion.choices[0].message.content);

    await interaction.reply({ content: `${data}`, fetchReply: true })
  } catch(er: any) {
    console.error(er.message)
  }
});

client.login(process.env.PUBLIC_KEY);