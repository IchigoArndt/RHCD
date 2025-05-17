// leitor de qr code
const qrcode = require('qrcode-terminal');
const { Client, Buttons, List, MessageMedia } = require('whatsapp-web.js'); // Mudança Buttons
const fs = require('fs');
const client = new Client();

// serviço de leitura do qr code
client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
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

    if (msg.body.match(/(menu|Menu|dia|tarde|noite|oi|Oi|Olá|olá|ola|teste)/i) && msg.from.endsWith('@c.us')) {

        const chat = await msg.getChat();

        await delay(1000); //delay de 3 segundos
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(1000); //Delay de 3000 milisegundos mais conhecido como 3 segundos
        const contact = await msg.getContact(); //Pegando o contato
        const name = contact.pushname; //Pegando o nome do contato
        await client.sendMessage(msg.from,'Olá! '+ name.split(" ")[0] + ', somos do Orion Parque. Como posso ajudá-lo hoje? Por favor, digite uma das opções abaixo:\n\n1 - Checar Evento\n2 - Checar Agenda \n3 - Falar com atendente'); //Primeira mensagem de texto
        await delay(1000); //delay de 3 segundos
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(1000); //Delay de 5 segundos
    
        
    }


    if (msg.body !== null && msg.body === '1' && msg.from.endsWith('@c.us')) {
        const chat = await msg.getChat();

        //await delay(1000); //delay de 2 segundos
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(2000);
        await client.sendMessage(msg.from, 'Para verificar os eventos que estão ocorrendo, acesse nossa página web: https://www.orionparque.com');

    }

    if (msg.body !== null && msg.body === '2' && msg.from.endsWith('@c.us')) {
        
        const chat = await msg.getChat();
        const idsDasSalas = obterTodosOsIds();
        await chat.sendStateTyping();
        await delay(1000);
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

        if (mensagemFinal) 
        {
            console.log(mensagemFinal);
            await client.sendMessage(msg.from, mensagemFinal);
        }

    }

    if (msg.body !== null && msg.body === '3' && msg.from.endsWith('@c.us')) {
        const chat = await msg.getChat();
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(2000);
        await client.sendMessage(msg.from, 'Certo, estamos transferindo você para um atendente. Por favor, aguarde um momento.');
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