const client = require('../config');
const { delay } = require('../helper');

async function handleWelcome(userId, name) {
    await client.sendMessage(userId, `Olá, ${name}! Somos do Orion Parque. Como posso ajudá-lo hoje?\n\n` +
        '1 - Checar Evento\n' +
        '2 - Checar Agenda\n' +
        '3 - Falar com atendente');
}

async function handleAttendantTransfer(userId) {
    await client.sendMessage(userId, 'Estamos transferindo você para um atendente. Aguarde um momento...');
}

module.exports = { handleWelcome, handleAttendantTransfer };