require('dotenv').config();

process.on('uncaughtException', (err) => {
    console.error('[uncaughtException]', err.message);
});

process.on('unhandledRejection', (reason) => {
    console.error('[unhandledRejection]', reason && reason.message ? reason.message : reason);
});

process.on('exit', (code) => {
    console.error('[exit] código:', code);
});

process.on('SIGTERM', () => { console.error('[SIGTERM]'); process.exit(0); });
process.on('SIGINT', () => { console.error('[SIGINT]'); process.exit(0); });

const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

// Remove locks do Chrome de sessões anteriores
const sessionDir = path.join(__dirname, '.wwebjs_auth', 'session');
['SingletonLock', 'SingletonSocket', 'SingletonCookie'].forEach(f => {
    try { fs.unlinkSync(path.join(sessionDir, f)); } catch (_) {}
});
const express = require('express');

const PORT = process.env.PORT || 3000;

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: '.wwebjs_auth' }),
    authTimeoutMs: 120000,
    webVersion: '2.3000.1041832074',
    webVersionCache: {
        type: 'local',
        path: '.wwebjs_cache',
    },
    puppeteer: {
        executablePath: process.env.CHROME_PATH ||
            '/usr/bin/chromium' ||
            '/home/ichigoarndt/.cache/puppeteer/chrome/linux-136.0.7103.92/chrome-linux64/chrome',
        protocolTimeout: 300000,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

client.on('qr', async qr => {
    qrcode.generate(qr, { small: true });
    const url = await QRCode.toDataURL(qr);
    console.log('QR Code gerado. Escaneie com o WhatsApp para autenticar.');
    console.log('Ou acesse: http://localhost:3000/qr para ver a imagem.');
    global._lastQR = url;
});

let clientReady = false;

client.on('ready', () => {
    clientReady = true;
    console.log('WhatsApp client pronto!');
});

client.on('auth_failure', msg => {
    console.error('Falha na autenticacao WhatsApp:', msg);
});

client.initialize();

const app = express();
app.use(express.json());

// POST /webhook/send
// Body: { "to": "5511999999999", "message": "Texto da mensagem" }
app.post('/webhook/send', async (req, res) => {
    const { to, message } = req.body;

    if (!to || !message) {
        return res.status(400).json({ error: 'Os campos "to" e "message" sao obrigatorios.' });
    }

    if (!clientReady) {
        return res.status(503).json({ error: 'WhatsApp client ainda não está pronto.' });
    }

    const number = to.replace(/\D/g, '');

    try {
        const numberId = await client.getNumberId(number);
        if (!numberId) {
            return res.status(404).json({ error: `Número ${number} não encontrado no WhatsApp.` });
        }
        await client.sendMessage(numberId._serialized, message);
        console.log(`Mensagem enviada para ${numberId._serialized}`);
        return res.json({ success: true, to: numberId._serialized });
    } catch (err) {
        console.error('Erro ao enviar mensagem:', err);
        return res.status(500).json({ error: 'Falha ao enviar mensagem via WhatsApp.' });
    }
});

app.get('/qr', (_req, res) => {
    if (!global._lastQR) return res.send('<html><head><meta http-equiv="refresh" content="3"/></head><body style="background:#000;color:#fff;display:flex;justify-content:center;align-items:center;height:100vh"><p>Aguardando QR Code...</p></body></html>');
    res.send(`<html><head><meta http-equiv="refresh" content="15"/></head><body style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;background:#000;color:#fff;font-family:sans-serif">
        <p style="margin-bottom:16px">Escaneie com o WhatsApp</p>
        <img src="${global._lastQR}" style="width:300px;height:300px"/>
        <p style="margin-top:16px;font-size:12px;opacity:0.5">Atualiza automaticamente a cada 15s</p>
    </body></html>`);
});

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Servidor webhook rodando na porta ${PORT}`);
});
