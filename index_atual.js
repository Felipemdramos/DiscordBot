require('dotenv/config'); 
// .env contém as variaveis de ambiente do projeto
const{Client} = require('discord.js');
const{OpenAI} = require('openai');
// puxando os dados do .env e das bibliotecas
const client = new Client({
    intents: ['Guilds', 'GuildMembers', 'GuildMessages', 'MessageContent']
});

client.on('ready', () => {
    console.log('The bot is online.');
}); // aviso no terminal que o bot ja pode interagir

const IGNORE_PREFIX = "!"; //ignorar comentários para outros bots
const id_canal_especifico = '1179148014674255922'
const CHANNELS = [id_canal_especifico];

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
});

tags_obrigatorias = [
    "filme", "diretor", "ator", "atores", "atrizes", "gênero",
    "gêneros", "filmes", "elenco"
]
generos_filme = [
    "terror", "sci-fi", "ficção cientifica", "suspense", "ação", "aventura", 
    "comédia", "romance", "fantasia", "horror", "guerra", "faroeste", "policial"
]
const total = [].concat(tags_obrigatorias, generos_filme)
function filtrar_mensagem_user(mensagem, tags){
    let permitido = false
    for (const tag in tags) {
        if (mensagem.includes(tag)) {
            permitido = true;
            break;
        }
    }
    // total.every(
    //     (tag) => {
    //         if(!mensagem.includes(tag)) {return true;}
    //         else {
    //             permitido = true;
    //             return false;
    //         }
    //     }
    // )
    return permitido
}

let mensagem_incial = "Olá sou o bot Oficial, tenho amplo conhecimento em filmes.\n"
mensagem_incial += "Posso falar sobre filmes de algum gênero especifico informações como a trilha sonora, quais atores participaram ou se seu filme favorito é a adaptação de algum livro, HQ, mangá ou games?\n"
mensagem_incial += "mas aqui entre nós, evite as adaptações de games.\n"
mensagem_incial += "Por favor, faça sua pergunta: "

const saudacoes = ["oi", "eae", "fala", "ola"];
client.on('messageCreate', async (message) => {
    
    if(message.author.bot) return; // n responder mensagens do proprio bot
    if(message.content.startsWith(IGNORE_PREFIX)) return; // n responder mensagens para outros bots ou pessoas
    if(!CHANNELS.includes(message.channelID) && !message.mentions.users.has(client.user.id)){ 
        return; // n responder mensagens fora dos canais especificos
    }

    if(!filtrar_mensagem_user(message.content, total)) {
        //const texto = "Desculpe, posso apenas conversar sobre filmes, por favor refaça sua pergunta";
        message.reply(mensagem_incial); 
        return;
    }
    else{
        tags_generos = ["gênero", "subgênero", "tema", "gêneros"]
        tags_diretores = ["diretor", "diretora", "diretores", "quem dirigiu"]
        tags_atores = ["ator", "atores", "atriz", "atrizes", "estrela", "estrelas"]
        tags_ost = ["músicos", "trilha sonora"]
        tags_adaptacoes = ["adaptação", "baseado na obra", "filme", "livro", "hq", "anime", "mangá", "videogame", "adaptado"]
        if(filtrar_mensagem_user(message.content, tags_generos)){
            const resposta = "Ok, vamos falar sobre esse gênero"
            message.reply(resposta);
        }
        else if(filtrar_mensagem_user(message.content, tags_atores)){
            const resposta = "Ok, vamos falar sobre a carreira desses atores"
            message.reply(resposta);
        }
        else if(filtrar_mensagem_user(message.content, tags_ost)){
            const resposta = "Ok, vamos falar sobre essa trilha sonora"
            message.reply(resposta);
        }
        else if(filtrar_mensagem_user(message.content, tags_adaptacoes)){
            const resposta = "Ok, vamos falar sobre quais foram as inspirações desse filme"
            message.reply(resposta);
        }
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

client.login(process.env.TOKEN); // bot fazendo login
