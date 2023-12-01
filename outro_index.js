require('dotenv/config');
const{Client} = require('discord.js');
const{OpenAI} = require('openai');

const client = new Client({
    intents: ['Guilds', 'GuildMembers', 'GuildMessages', 'MessageContent']
});

client.on('ready', () => {
    console.log('The bot is online.');
});

const IGNORE_PREFIX = "!"; //ignorar comentários para outros bots
const CHANNELS = ['1179148014674255922'];

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
});

function filtrar_mensagem_user(mensagem){
    tags_obrigatorias = [
        "filme", "diretor de filme", "ator", "atores", "atrizes", "gênero",
        "gêneros", "filmes", "elenco"
    ]
    generos_filme = [
        "terror", "sci-fi", "ficção cientifica", "suspense", "ação", "aventura", 
        "comédia", "romance", "fantasia", "horror", "guerra", "faroeste", "policial"
    ]
    const total = [].concat(tags_obrigatorias, generos_filme)
    let permitido = false
    total.every(
        (tag) => {
            if(!mensagem.includes(tag)) {return true;}
            else {
                permitido = true;
                return false;
            }
        }
    )
    return permitido
}

client.on('messageCreate', async (message) => {
    
    if(message.author.bot) return;
    if(message.content.startsWith(IGNORE_PREFIX)) return;
    if(!CHANNELS.includes(message.channelID) && !message.mentions.users.has(client.user.id)) 
        return;

    if(!filtrar_mensagem_user(message.content)) {
        const texto = "Desculpe, posso apenas conversar sobre filmes, por favor refaça sua pergunta"
        message.reply(texto);
        return;
    }
    await message.channel.sendTyping();

    const sendTypingInterval = setInterval(() => {
        message.channel.sendTyping();
    }, 5000);

    let conversation = [];

    conversation.push({
        role:'system',
        content:'Fala mano sou o chatbot baseado no GPT 3.5, vou fazer de tudo pra ajudar.'
    });

    let prevMessages = await message.channel.messages.fetch({limit: 10});
    prevMessages.reverse();

    prevMessages.forEach((msg) => {
        if(msg.author.bot && msg.author.id !== client.user.id) return;
        if(msg.content.startsWith(IGNORE_PREFIX))return;

        const username = msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');

        if(msg.author.id === client.user.id){
            conversation.push({
                role: 'assistant',
                name: username,
                content: msg.content,
            });

            return;
        }

        conversation.push({
            role: 'user',
            name: username,
            content: msg.content,
        });
    })

    
    const response = await openai.chat.completions
        .create({
            model: 'gpt-3.5-turbo',
            messages: conversation,
        })
        .catch((error) => console.error('OpenAi Error:\n', error));

    clearInterval(sendTypingInterval);
    if(!response || !response.choices || response.choices.length === 0){
        console.error('Erro ao receber resposta do OpenAI ou resposta vazia:', response);
        message.reply("Perai mano, to tendo alguns problemas aqui com a API do OPENAI, tenta de novo em aguns estantes");
        return;
    }

    const responseMessage = response.choices[0].message.content;
    const chunkSinzeLimit = 2000;

    for(let i = 0; i < responseMessage.length; i+= chunkSinzeLimit){
        const chunk = responseMessage.substring(i, i + chunkSinzeLimit);

        await message.reply(chunk);
    }

});

client.login(process.env.TOKEN);
