const express = require('express');
const fs = require('fs');
const app = express();
const port = 3000;

// Log de requisições
function logRequest(req, res, next) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] IP: ${req.ip} - ${req.method} ${req.url}\n`;

    fs.appendFile('./logs/requests.log', logEntry, (err) => {
        if (err) console.error('Erro ao salvar log:', err);
    });

    console.log(logEntry.trim());
    next();
}

// Garantir que a pasta de logs exista
if (!fs.existsSync('./logs')) {
    fs.mkdirSync('./logs');
}

// Middleware para log
app.use(logRequest);

// Configuração para lidar com muitas conexões
app.set('trust proxy', true);

// Rota simples para teste
app.get('/', (req, res) => {
    res.send('Servidor funcionando normalmente');
});

// Rota que simula uma operação pesada
app.get('/operacao-pesada', (req, res) => {
    // Simulando uma operação complexa que consome recursos
    const startTime = Date.now();

    // Algoritmo intensivo para CPU
    let result = 0;
    for (let i = 0; i < 10000000; i++) {
        result += Math.sqrt(i) * Math.random();
    }

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    // Registrar o tempo de processamento
    const perfLog = `[${new Date().toISOString()}] Tempo de processamento: ${processingTime}ms\n`;
    fs.appendFile('./logs/performance.log', perfLog, (err) => {
        if (err) console.error('Erro ao salvar log de performance:', err);
    });

    res.json({
        message: 'Operação concluída',
        processingTime: `${processingTime}ms`,
        result: result
    });
});

// Exibir o IP local na inicialização
const { networkInterfaces } = require('os');
const nets = networkInterfaces();
const results = {};

for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        // Pular interfaces não IPv4 e internas
        if (net.family === 'IPv4' && !net.internal) {
            if (!results[name]) {
                results[name] = [];
            }
            results[name].push(net.address);
        }
    }
}

app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://0.0.0.0:${port}`);
    console.log('IPs disponíveis na rede:');
    console.log(results);
});