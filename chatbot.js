const qrcode = require('qrcode-terminal');
const { Client } = require('whatsapp-web.js');
const fs = require('fs');

const client = new Client();
const userStatus = new Map(); // Tracks conversation state for each user
const userContext = new Map(); // Stores additional context for each user

// Helper functions
const delay = ms => new Promise(res => setTimeout(res, ms));

// Service initialization
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp client is ready!');
});

client.initialize();

// Data functions
function getRoomById(id) {
    const data = fs.readFileSync('salas.json', 'utf-8');
    const rooms = JSON.parse(data);
    return rooms.find(room => room.id === id) || null;
}

function getAllRoomIds() {
    const data = fs.readFileSync('salas.json', 'utf-8');
    const rooms = JSON.parse(data);
    return rooms.map(room => room.id);
}

// Conversation handlers
async function handleWelcome(userId, name) {
    await client.sendMessage(
        userId,
        `Olá, ${name}! Somos do Orion Parque. Como posso ajudá-lo hoje?\n\n` +
        '1 - Checar Evento\n' +
        '2 - Checar Agenda\n' +
        '3 - Falar com atendente'
    );
    userStatus.set(userId, 'AWAITING_OPTION');
}

async function handleEventCheck(userId) {
    await client.sendMessage(
        userId,
        'Para verificar os eventos que estão ocorrendo, acesse nossa página web:\n' +
        'https://www.orionparque.com\n\n' +
        'Posso ajudar em algo mais?\n' +
        '1 - Voltar ao menu\n' +
        '2 - Encerrar'
    );
    userStatus.set(userId, 'POST_EVENT_CHECK');
}

async function handleRoomList(userId) {
    const roomIds = getAllRoomIds();
    let message = 'Nosso prédio abriga as seguintes salas:\n\n';

    for (const id of roomIds) {
        const room = getRoomById(id);
        if (room) {
            message += `*${room.nome}* (ID: ${room.id})\n` +
                `Capacidade: ${room.capacidade}\n` +
                `Valor por hora: R$ ${room.valorPorHora}/h\n` +
                `Taxa de limpeza: R$ ${room.taxaLimpeza}\n` +
                `Desconto: ${room.desconto}\n\n`;
        }
    }

    message += 'Caso tenha interesse, qual tipo de sala deseja agendar?\n\n' +
        '1 - Sala de Reunião ou PodCast\n' +
        '2 - Sala de Auditório ou SerraLab\n' +
        '3 - Voltar ao menu\n' +
        '4 - Encerrar';

    await client.sendMessage(userId, message);
    userStatus.set(userId, 'ROOM_SELECTION');
}

async function handleRoomSelection(userId, option) {
    switch (option) {
        case '1':
            await client.sendMessage(
                userId,
                'Para agendar uma Sala de Reunião ou PodCast, acesse:\n' +
                'https://forms.gle/US6KSCpuSVxo7hsy9\n\n' +
                'Posso ajudar em algo mais?\n' +
                '1 - Voltar ao menu\n' +
                '2 - Encerrar'
            );
            userStatus.set(userId, 'POST_ROOM_SELECTION');
            break;
        case '2':
            await client.sendMessage(
                userId,
                'Para agendar uma Sala de Auditório ou SerraLab, acesse:\n' +
                'plid.in/seueventonoorion\n\n' +
                'Posso ajudar em algo mais?\n' +
                '1 - Voltar ao menu\n' +
                '2 - Encerrar'
            );
            userStatus.set(userId, 'POST_ROOM_SELECTION');
            break;
        case '3':
            await handleWelcome(userId, userContext.get(userId)?.name || 'usuário');
            break;
        case '4':
            await endConversation(userId);
            break;
        default:
            await client.sendMessage(userId, 'Opção inválida. Por favor, escolha 1, 2, 3 ou 4.');
    }
}

async function handleAttendantTransfer(userId) {
    await client.sendMessage(
        userId,
        'Estamos transferindo você para um atendente. Por favor, aguarde um momento...\n\n' +
        'Se precisar de mais alguma coisa, é só chamar. Tenha um ótimo dia!'
    );
    userStatus.delete(userId);
    userContext.delete(userId);
}

async function endConversation(userId) {
    await client.sendMessage(
        userId,
        'Obrigado por entrar em contato com o Orion Parque! Se precisar de mais alguma coisa, é só chamar. Tenha um ótimo dia!'
    );
    userStatus.delete(userId);
    userContext.delete(userId);
}

// Main message handler
client.on('message', async msg => {
    const userId = msg.from;

    // Ignore group messages and non-contacts
    if (!userId.endsWith('@c.us')) return;

    try {
        const chat = await msg.getChat();
        const contact = await msg.getContact();
        const name = contact.pushname?.split(' ')[0] || 'usuário';

        // Store user context if not already present
        if (!userContext.has(userId)) {
            userContext.set(userId, { name });
        }

        const currentStatus = userStatus.get(userId) || 'INITIAL';
        const message = msg.body.trim().toLowerCase();

        // Handle initial greeting
        if (currentStatus === 'INITIAL' && /^(oi|ola|olá|iniciar|começar)$/i.test(message)) {
            await chat.sendStateTyping();
            await delay(800);
            await handleWelcome(userId, name);
            return;
        }

        // Main conversation flow
        switch (currentStatus) {
            case 'AWAITING_OPTION':
                await chat.sendStateTyping();
                await delay(800);

                if (message === '1') {
                    await handleEventCheck(userId);
                } else if (message === '2') {
                    await handleRoomList(userId);
                } else if (message === '3') {
                    await handleAttendantTransfer(userId);
                } else {
                    await client.sendMessage(
                        userId,
                        'Opção inválida. Por favor, escolha:\n\n' +
                        '1 - Checar Evento\n' +
                        '2 - Checar Agenda\n' +
                        '3 - Falar com atendente'
                    );
                }
                break;

            case 'ROOM_SELECTION':
                await chat.sendStateTyping();
                await delay(800);
                await handleRoomSelection(userId, message);
                break;

            case 'POST_EVENT_CHECK':
            case 'POST_ROOM_SELECTION':
                await chat.sendStateTyping();
                await delay(800);

                if (message === '1') {
                    await handleWelcome(userId, name);
                } else if (message === '2') {
                    await endConversation(userId);
                } else {
                    await client.sendMessage(
                        userId,
                        'Opção inválida. Por favor, escolha:\n\n' +
                        '1 - Voltar ao menu\n' +
                        '2 - Encerrar'
                    );
                }
                break;

            default:
                if (/^(oi|ola|olá|iniciar|começar)$/i.test(message)) {
                    await chat.sendStateTyping();
                    await delay(800);
                    await handleWelcome(userId, name);
                } else {
                    await client.sendMessage(
                        userId,
                        `Olá ${name}! Digite "oi" para começar.`
                    );
                }
        }
    } catch (error) {
        console.error('Error handling message:', error);
        await client.sendMessage(
            userId,
            'Desculpe, ocorreu um erro. Por favor, tente novamente mais tarde.'
        );
    }
});