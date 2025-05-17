// leitor de qr code
const qrcode = require('qrcode-terminal');
const { Client, Buttons, List, MessageMedia } = require('whatsapp-web.js'); // Mudança Buttons
const fs = require('fs');
const client = new Client();
let mensagemEnviada = false;
let mensagem2Enviada = false;

// serviço de leitura do qr code
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});
// apos isso ele diz que foi tudo certo
client.on('ready', () => {
    console.log('Tudo certo! WhatsApp conectado.');
});
// E inicializa tudo 
client.initialize();

const delay = ms => new Promise(res => setTimeout(res, ms)); // Função que usamos para criar o delay entre uma ação e outra

// Funil

client.on('message', async msg => {

    if (msg.body.match(/(oi)/i) && msg.from.endsWith('@c.us')) {

        const chat = await msg.getChat();

        await chat.sendStateTyping();
        await delay(500);
        const contact = await msg.getContact();
        const name = contact.pushname;
        await client.sendMessage(msg.from, 'Olá! ' + name.split(" ")[0] + ', somos do Orion Parque. Como posso ajudá-lo hoje? Por favor, digite uma das opções abaixo:\n\n1 - Checar Evento\n2 - Checar Agenda \n3 - Falar com atendente'); //Primeira mensagem de texto
        mensagemEnviada = true;
        console.log(msg);
    } else if (msg.body.match(/(1|2|3)/i) && msg.from.endsWith('@c.us')) {
        if (mensagemEnviada) {
            console.log("entramos no if 123");
            switch (msg.body) {
                case '1':
                    opcao1(msg);
                    break;

                case '2':
                    console.log("entramos na opção 2");
                    opcao2(msg);
                    break;

                case '3':
                    opcao3(msg);
                    break;

                default:
                    await client.sendMessage(msg.from, 'Ops! Acho que não entendi direito');
            }
        } else {
        await client.sendMessage(msg.from, 'Olá! ' + name.split(" ")[0] + ', somos do Orion Parque. Como posso ajudá-lo hoje? Por favor, digite uma das opções abaixo:\n\n1 - Checar Evento\n2 - Checar Agenda \n3 - Falar com atendente'); //Primeira mensagem de texto
        mensagemEnviada = true;
        }

    }
});

// Função para buscar uma sala por ID
function buscarSalaPorId(id) {
    // Ler o arquivo JSON
    const dados = fs.readFileSync('salas.json', 'utf-8');

    // Converter o conteúdo para um objeto JavaScript
    const salas = JSON.parse(dados);

    // Buscar a sala pelo ID
    const salaEncontrada = salas.find(sala => sala.id === id);

    // Retornar a sala encontrada ou uma mensagem caso não exista
    return salaEncontrada ? salaEncontrada : `Sala com ID ${id} não encontrada.`;
}

function obterTodosOsIds() {
    const dados = fs.readFileSync('salas.json', 'utf-8');
    const salas = JSON.parse(dados);
    return salas.map(sala => sala.id);
}

async function opcao1(msg) {
    const chat = await msg.getChat();
    await chat.sendStateTyping(); // Simulando Digitação
    await delay(2000);
    await client.sendMessage(msg.from, 'Para verificar os eventos que estão ocorrendo, acesse nossa página web: https://www.orionparque.com');
}

async function opcao2(msg) {
    const chat = await msg.getChat();
    const idsDasSalas = obterTodosOsIds();
    await chat.sendStateTyping();
    await client.sendMessage(msg.from, "Nosso prédio abriga as seguintes salas: ");

    let mensagemFinal = '';

    for (const id of idsDasSalas) {
        let sala = buscarSalaPorId(id);
        await delay(1000);

        if (sala) {
            mensagemFinal += 'Nome: ' + sala.nome + ' (ID: ' + sala.id + ')\n' +
                'Capacidade: ' + sala.capacidade + '\n' +
                'Valor por hora: R$' + sala.valorPorHora + '/h\n' +
                'Taxa de limpeza: R$' + sala.taxaLimpeza + '\n' +
                'Desconto: ' + sala.desconto + '\n\n';
        }
    }

    if (mensagemFinal) {
        console.log(mensagemFinal);
        await client.sendMessage(msg.from, mensagemFinal);
    }

    await client.sendMessage(msg.from, 'Caso tenha interesse, deseja agendar qual tipo de sala?\n\n1 - Sala de Reunião ou PodCast\n2 - Sala de Auditório ou SerraLab\n3 - Não tenho interesse.');
    mensagem2Enviada = true;

    if (msg.body !== null && msg.from.endsWith('@c.us')) {
        if(mensagem2Enviada)
        {
            switch (msg.body) {
            case '1':
                await chat.sendStateTyping();
                await delay(2000);
                await client.sendMessage(msg.from, 'Legal! Iremos te direcionar ao formulário para agendar a sala. \n https://forms.gle/US6KSCpuSVxo7hsy9');
                break;
            case '2':
                mensagem2Enviada = true;
                if(mensagem2Enviada){
                await chat.sendStateTyping();
                await delay(2000);
                await client.sendMessage(msg.from, 'Legal! Iremos te direcionar ao formulário para agendar a sala. \n plid.in/seueventonoorion');
                }
                break;
            case '3':
                await chat.sendStateTyping();
                await delay(2000);
                await client.sendMessage(msg.from, '\n4 - Falar com atendente.\n5 - Encerrar a conversa.');
                switch (msg.body) {
                    case '4':
                        await chat.sendStateTyping();
                        await delay(2000);
                        await client.sendMessage(msg.from, 'Certo, estamos transferindo você para um atendente. Por favor, aguarde um momento.');
                        break;
                    case '5':
                        await chat.sendStateTyping();
                        await delay(2000);
                        await client.sendMessage(msg.from, 'Obrigado por entrar em contato! Se precisar de mais alguma coisa, é só chamar. Até logo!');
                        break;
                    default:
                        await chat.sendStateTyping();
                        await delay(2000);
                        await client.sendMessage(msg.from, 'Opção inválida. Por favor, digite 7 ou 8.');
                }
                break;
            default:
                await chat.sendStateTyping();
                await delay(2000);
                await client.sendMessage(msg.from, 'Opção inválida. Por favor, digite 4, 5 ou 6.');
                break;
            }
        }
    }
}

async function opcao3(msg) {
    const chat = await msg.getChat();
    await chat.sendStateTyping(); // Simulando Digitação
    await delay(2000);
    await client.sendMessage(msg.from, 'Certo, estamos transferindo você para um atendente. Por favor, aguarde um momento.');
}