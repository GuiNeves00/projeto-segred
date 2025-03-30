const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

// Configuração
const INTERVAL = 1000; // Intervalo em ms
const LOG_FILE = path.join('./logs', 'system_monitor.log');
const SERVER_PORT = 3000;

// Garantir que a pasta de logs exista
if (!fs.existsSync('./logs')) {
    fs.mkdirSync('./logs');
}

// Função para testar a resposta do servidor
function checkServerResponse() {
    const startTime = Date.now();

    const options = {
        hostname: 'localhost',
        port: SERVER_PORT,
        path: '/operacao-pesada',
        method: 'GET',
    };

    const req = http.request(options, (res) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        console.log(`Resposta do servidor: ${res.statusCode} (${responseTime}ms)`);
    });

    req.on('error', (error) => {
        console.error(`Erro ao testar servidor: ${error.message}`);
    });

    req.end();
}

function monitorarSistema() {
    // Timestamp
    const timestamp = new Date().toISOString();

    // Uso de CPU
    const cpuInfo = os.cpus();
    const cpuUsage = cpuInfo.map(cpu => {
        const total = Object.values(cpu.times).reduce((acc, time) => acc + time, 0);
        const idle = cpu.times.idle;
        return (1 - idle / total) * 100;
    });
    const cpuAvg = cpuUsage.reduce((acc, usage) => acc + usage, 0) / cpuUsage.length;

    // Uso de memória
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memUsagePercent = ((totalMem - freeMem) / totalMem) * 100;

    // Informações do sistema operacional
    const loadAvg = os.loadavg();

    // Conexões de rede ativas
    const { execSync } = require('child_process');
    let networkConnections = '';
    try {
        // Obter conexões TCP ativas (porta 3000)
        networkConnections = execSync('netstat -ant | grep :3000 | wc -l').toString().trim();
    } catch (error) {
        networkConnections = 'N/A';
    }

    // Formar log
    const logEntry = `[${timestamp}]
    CPU Utilização: ${cpuAvg.toFixed(2)}%
    Memória Utilização: ${memUsagePercent.toFixed(2)}%
    Load Average (1m, 5m, 15m): ${loadAvg.map(load => load.toFixed(2)).join(', ')}
    Conexões ativas (porta 3000): ${networkConnections}
    ---------------------------------\n`;

    // Salvar log
    fs.appendFile(LOG_FILE, logEntry, (err) => {
        if (err) console.error('Erro ao salvar log de monitoramento:', err);
    });

    console.log(logEntry);

    // A cada 5 segundos, testar resposta do servidor
    if (Math.floor(Date.now() / 1000) % 5 === 0) {
        checkServerResponse();
    }
}

// Iniciar monitoramento
console.log('Iniciando monitoramento do sistema...');
setInterval(monitorarSistema, INTERVAL);