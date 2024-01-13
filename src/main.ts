import {
  CacheType,
  Client,
  Events,
  GatewayIntentBits,
  IntentsBitField,
  Interaction,
  Message,
  SlashCommandBuilder
} from 'discord.js';

import OpenAI from "openai";
import {
  ChatCompletionMessageParam
} from 'openai/resources';

import 'dotenv/config';


const openai = new OpenAI({
  apiKey: process.env.CHAT_GPT_KEY
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ]
});

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
    const { commandName, channel, options } = interaction;
    if (commandName !== 'chat') return;

    const conversation: Array<ChatCompletionMessageParam> = [
      {
        role: 'system',
        content: 'You are a friendly chatbot.'
      }
    ];

    const prevMessages = await channel?.messages.fetch({ limit: 15 });
    prevMessages?.reverse();

    const [{ value }] = options.data;

    prevMessages?.forEach(async (message: Message<boolean>) => {
      if (message.content.startsWith('!')) return;
      if (message.author.id !== client.user?.id && message.author.bot) return;
      if (message.author.id == client.user?.id) {

        interaction.reply({ content: "Aguarde que estou pensando..." });

        conversation.push({
          role: 'assistant',
          content: String(value),
          name: message.author.username
            .replace(/\s+/g, '_')
            .replace(/[^\w\s]/gi, ''),
        });

        conversation.push({
          role: 'user',
          content: String(value),
          name: message.author.username
            .replace(/\s+/g, '_')
            .replace(/[^\w\s]/gi, ''),
        });
      }

      const completion = await openai.chat.completions.create({
        messages: conversation,
        model: "gpt-3.5-turbo",
      });

      const response = String(completion.choices[0].message.content);
      message.reply({ content: response });
    })
  } catch(er: any) {
    console.error(er.message)
  }
});

client.login(process.env.PUBLIC_KEY);