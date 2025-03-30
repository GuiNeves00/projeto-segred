# Projeto de Demonstração de Ataque DDoS
Este projeto demonstra um ataque DDoS simples em uma rede local, utilizando dois computadores:
- **Servidor (Vítima)**: Ubuntu conectado via cabo
- **Atacante**: MacBook conectado via Wi-Fi

## Requisitos

### Servidor (Ubuntu)
- Node.js (v14+ recomendado)
- npm

### Atacante (MacBook)
- Node.js (v14+ recomendado)
- npm

## Configuração

### 1. Servidor (Ubuntu)

1. Navegue até a pasta `servidor`
2. Instale as dependências: npm install
3. Inicie o servidor: npm start
**IMPORTANTE**: Anote o IP exibido no console quando o servidor iniciar.
4. Em outra janela de terminal, inicie o monitor do sistema:
npm run monitor
O servidor estará rodando na porta 3000 e acessível através do IP da máquina na rede local.

### 2. Atacante (MacBook)
1. Navegue até a pasta `atacante`
2. Instale as dependências: npm install
3. Inicie o script de ataque: npm start
4. Quando solicitado, insira o IP do servidor Ubuntu (anotado anteriormente)
5. Confirme a conexão e inicie o ataque quando estiver pronto

## Solução de Problemas
Se você encontrar erros como "EHOSTUNREACH" ou "ECONNRESET", verifique:
1. **Conectividade da rede**: Certifique-se de que ambos os computadores estão na mesma rede local
2. **Firewall**: Verifique se o firewall do Ubuntu não está bloqueando a conexão:
sudo ufw allow 3000/tcp
3. **IP correto**: Verifique se está usando o IP correto do servidor Ubuntu
4. **Teste manual**: Tente acessar o servidor a partir do MacBook em um navegador:
http://<IP-DO-UBUNTU>:3000/

## Demonstração

### Antes do Ataque
1. Acesse o servidor pelo navegador: `http://<IP-DO-UBUNTU>:3000/`
2. Teste a rota de operação pesada: `http://<IP-DO-UBUNTU>:3000/operacao-pesada`
3. Observe o tempo de resposta normal

### Durante o Ataque
1. Inicie o ataque no MacBook
2. Tente acessar novamente as rotas do servidor
3. Observe o aumento no tempo de resposta ou possível queda do servidor

### Análise dos Resultados
Após o ataque, você encontrará os seguintes arquivos de log para análise:

- **Servidor**:
- `logs/requests.log`: Registro de todas as requisições recebidas
- `logs/performance.log`: Tempo de processamento da operação pesada
- `logs/system_monitor.log`: Monitoramento do uso de CPU e memória

- **Atacante**:
- `attack_log.txt`: Registro de todas as requisições enviadas durante o ataque

## Observações
Este projeto é apenas para fins educacionais e deve ser executado apenas em ambientes controlados e com permissão. Realizar ataques DDoS em redes ou servidores sem autorização é ilegal.
