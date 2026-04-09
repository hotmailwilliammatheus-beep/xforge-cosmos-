// Arquivo: api/createEmail.js

export default async function handler(req, res) {
    // Só aceita envio de dados (POST)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        // Recebe os dados que o seu Front-end mandou
        const { address, password, currentApiBase, domain } = req.body;
        const user = address.split('@')[0]; // Pega só a parte antes do @

        // ==========================================
        // 1. SE A API FOR GUERRILLA MAIL
        // ==========================================
        if (currentApiBase === "https://api.guerrillamail.com/ajax.php") {
            const response = await fetch(`${currentApiBase}?f=set_email_user&email_user=${user}&domain=${domain}`);
            
            if (!response.ok) {
                return res.status(500).json({ error: "Erro de comunicação com Guerrilla Mail" });
            }
            
            const data = await response.json();
            
            // A Guerrilla devolve o token e o endereço oficial. Mandamos de volta pro Front-end.
            return res.status(200).json({ 
                token: data.sid_token, 
                address: data.email_addr // Retorna o email certinho
            });
        }

        // ==========================================
        // 2. SE A API FOR MAILDROP OU MAIL7 (Bypass)
        // ==========================================
        if (currentApiBase === "MAIL7" || currentApiBase === "MAILDROP") {
            // Essas APIs não precisam "criar" conta, é só escutar a caixa.
            // Mandamos um token falso só pro Front-end saber que deu certo.
            const fakeToken = currentApiBase === "MAIL7" ? "mail7_bypass" : "maildrop_bypass";
            return res.status(200).json({ 
                token: fakeToken, 
                address: address 
            });
        }

        // ==========================================
        // 3. SE A API FOR MAIL.GW ou MAIL.TM (O padrão)
        // ==========================================
        
        // Passo A: Cria a conta na API
        const createRes = await fetch(`${currentApiBase}/accounts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, password })
        });

        const createData = await createRes.json();

        // Se deu erro na criação (ex: e-mail já existe), avisa o front pra ele sortear outro nome
        if (!createRes.ok) {
            return res.status(createRes.status).json(createData);
        }

        // Passo B: Pega o Token de acesso
        // Precisamos dar um tempinho pequeno para a API respirar, se não ela falha
        await new Promise(r => setTimeout(r, 500)); 

        const authRes = await fetch(`${currentApiBase}/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, password })
        });

        if (!authRes.ok) {
             return res.status(authRes.status).json({ error: "Conta criada, mas falha ao obter token" });
        }

        const authData = await authRes.json();

        // Tudo certo! Devolve o token de acesso verdadeiro.
        return res.status(200).json({ 
            token: authData.token, 
            address: address 
        });

    } catch (error) {
        console.error("Erro no Servidor:", error);
        return res.status(500).json({ error: 'Erro interno ao criar identidade' });
    }
}