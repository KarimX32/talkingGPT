const dscJs = require('@discordjs/voice')
const { addSpeechEvent, SpeechEvents } = require("discord-speech-recognition");
const { GatewayIntentBits, Client } = require('discord.js')
const { token, apiKey } = require('./config.json')
const { Configuration, OpenAIApi } = require("openai");
const { createAudioFile } = require('simple-tts-mp3');

const client = new Client({
    intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildVoiceStates ],
    allowedMentions: { parse: ['users'], repliedUser: true } 
})

const configuration = new Configuration({ apiKey: apiKey });
const openai = new OpenAIApi(configuration);

let voiceConnection;
let player;

addSpeechEvent(client);

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`)
})

client.on('messageCreate', async message => {
    if(message.content.startsWith("!gpt")) {
        if(!message.member.voice.channel) return message.channel.send("You are not in a voice channel")

        voiceConnection = dscJs.joinVoiceChannel({
            channelId: message.member.voice.channel.id,
            guildId: message.member.voice.channel.guild.id,
            adapterCreator: message.member.voice.channel.guild.voiceAdapterCreator,
            selfDeaf: false,
        })

        let resource = dscJs.createAudioResource(`http://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodeURIComponent("Hello, How can i help you?")}&tl=en`)
        player = dscJs.createAudioPlayer()
        voiceConnection.subscribe(player)
        player.play(resource)
        
    }
})

client.on(SpeechEvents.speech, async (message) => {
    // If bot didn't recognize speech, content will be empty
    if (!message.content) return;

    if (message.content == 'disconnect') {
        return voiceConnection.disconnect()
    }

    if (message.content == 'play music') {
        let r = dscJs.createAudioResource(`./song.mp3`)
        player.play(r)
        return;
    }

    if (message.content.startsWith("hello")) {
        console.log(message.content);

        const res = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: message.content }],
            max_tokens: 50,
        })

        let text = res.data.choices[0].message.content
        console.log(text)


        let randomId = Math.floor(Math.random() * 10000000000000)
        await createAudioFile(text, "output/" + randomId, 'en')
        setTimeout(() => {
            let r = dscJs.createAudioResource(`./output/${randomId}.mp3`)
            player.play(r)
        }, 1000)
    }
});

client.login(token)