const client = require('../config');
const { handleWelcome, handleAttendantTransfer } = require('./conversation');

client.on('message', async msg => {
    const userId = msg.from;
    if (!userId.endsWith('@c.us')) return;

    const message = msg.body.trim().toLowerCase();

    if (/^(oi|ola|olá|iniciar|começar)$/i.test(message)) {
        await handleWelcome(userId, 'usuário');
    } else if (message === '3') {
        await handleAttendantTransfer(userId);
    } else {
        await client.sendMessage(userId, 'Opção inválida. Digite "oi" para começar.');
    }
});