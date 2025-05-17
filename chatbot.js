// leitor de qr code
const qrcode = require('qrcode-terminal');
const { Client, Buttons, List, MessageMedia } = require('whatsapp-web.js'); // Mudança Buttons
const fs = require('fs');
const client = new Client();
let mensagemEnviada = false;
let mensagem2Enviada = false;
const userStatus = new Map(); // chave: número, valor: status


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
    const userId = msg.from;

    if (!userId.endsWith('@c.us')) return; // ignora grupos e não-contatos

    const chat = await msg.getChat();
    const contact = await msg.getContact();
    const name = contact.pushname?.split(" ")[0] || "usuário";

    const status = userStatus.get(userId) || 0;

    switch (status) {
        case 0: // Início da conversa
            if (/oi/i.test(msg.body)) {
                await chat.sendStateTyping();
                await delay(500);
                await client.sendMessage(userId, `Olá, ${name}! Somos do Orion Parque. Como posso ajudá-lo hoje?\n\n1 - Checar Evento\n2 - Checar Agenda\n3 - Falar com atendente`);
                userStatus.set(userId, 1);
            }
            break;

        case 1: // Primeira seleção (1, 2 ou 3)
            if (/^[1-3]$/.test(msg.body)) {
                switch (msg.body) {
                    case '1':
                        await opcao1(msg);
                        userStatus.set(userId, 0); // Reset após envio
                        break;
                    case '2':
                        await opcao2(msg);
                        userStatus.set(userId, 2);
                        break;
                    case '3':
                        await opcao3(msg);
                        userStatus.set(userId, 0); // Reset após atendimento
                        break;
                }
            } else {
                await client.sendMessage(userId, 'Por favor, digite uma opção válida: 1, 2 ou 3.');
            }
            break;

        case 2: // Após exibir as salas
            if (/^[1-3]$/.test(msg.body)) {
                switch (msg.body) {
                    case '1':
                        await chat.sendStateTyping();
                        await delay(2000);
                        await client.sendMessage(userId, 'Legal! Iremos te direcionar ao formulário: https://forms.gle/US6KSCpuSVxo7hsy9');
                        break;
                    case '2':
                        await chat.sendStateTyping();
                        await delay(2000);
                        await client.sendMessage(userId, 'Legal! Acesse: plid.in/seueventonoorion');
                        break;
                    case '3':
                        await chat.sendStateTyping();
                        await delay(1000);
                        await client.sendMessage(userId, 'Deseja:\n1 - Falar com atendente\n2 - Encerrar a conversa');
                        userStatus.set(userId, 3);
                        return;
                }
                userStatus.set(userId, 0);
            } else {
                await client.sendMessage(userId, 'Por favor, digite 1, 2 ou 3.');
            }
            break;

        case 3: // Decisão final
            if (msg.body === '1') {
                await client.sendMessage(userId, 'Certo, estamos transferindo você para um atendente. Aguarde um momento.');
            } else if (msg.body === '2') {
                await client.sendMessage(userId, 'Obrigado por entrar em contato! Até logo!');
            } else {
                await client.sendMessage(userId, 'Opção inválida. Por favor, digite 1 ou 2.');
                return;
            }
            userStatus.delete(userId); // Reset de status
            break;

        default:
            userStatus.set(userId, 0);
            break;
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

async function opcao2(msg,status) {
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
        if(mensagem2Enviada && status == 2)
        {
            switch (msg.body) {
            case '1':
                status = 4;
                await chat.sendStateTyping();
                await delay(2000);
                await client.sendMessage(msg.from, 'Legal! Iremos te direcionar ao formulário para agendar a sala. \n https://forms.gle/US6KSCpuSVxo7hsy9');
                break;
            case '2':
                status = 5;
                mensagem2Enviada = true;
                if(mensagem2Enviada){
                await chat.sendStateTyping();
                await delay(2000);
                await client.sendMessage(msg.from, 'Legal! Iremos te direcionar ao formulário para agendar a sala. \n plid.in/seueventonoorion');
                }
                break;
            case '3':
                status = 6;
                await chat.sendStateTyping();
                await delay(2000);
                await client.sendMessage(msg.from, '\n1 - Falar com atendente.\n2 - Encerrar a conversa.');
                switch (msg.body) {
                    case '1':
                        status = 7;
                        await chat.sendStateTyping();
                        await delay(2000);
                        await client.sendMessage(msg.from, 'Certo, estamos transferindo você para um atendente. Por favor, aguarde um momento.');
                        break;
                    case '2':
                        status = 8;
                        await chat.sendStateTyping();
                        await delay(2000);
                        await client.sendMessage(msg.from, 'Obrigado por entrar em contato! Se precisar de mais alguma coisa, é só chamar. Até logo!');
                        break;
                    default:
                        status = 9;
                        await chat.sendStateTyping();
                        await delay(2000);
                        await client.sendMessage(msg.from, 'Opção inválida. Por favor, digite 7 ou 8.');
                }
                break;
            default:
                status = 10;
                await chat.sendStateTyping();
                await delay(2000);
                await client.sendMessage(msg.from, 'Opção inválida. Por favor, digite 4, 5 ou 6.');
                break;
            }
        }
    }
}

async function opcao3(msg) {
    status = 3;
    const chat = await msg.getChat();
    await chat.sendStateTyping(); // Simulando Digitação
    await delay(2000);
    await client.sendMessage(msg.from, 'Certo, estamos transferindo você para um atendente. Por favor, aguarde um momento.');
}