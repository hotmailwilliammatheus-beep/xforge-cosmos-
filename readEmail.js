// Arquivo: api/readEmail.js

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

    try {
        const { currentApiBase, activeToken, id, email } = req.body;
        let msg;

        // 1. MAILDROP
        if (currentApiBase === "MAILDROP") {
            const userOnly = email.split('@')[0];
            const response = await fetch(`https://api.maildrop.cc/graphql`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    query: `query { message(mailbox: "${userOnly}", id: "${id}") { id headerfrom subject date html data } }`
                })
            });
            const jsonRes = await response.json();
            const rawMsg = jsonRes.data?.message;
            if (!rawMsg) throw new Error("Mensagem não encontrada");
            
            msg = {
                subject: rawMsg.subject || "(Sem assunto)",
                html: rawMsg.html ? [rawMsg.html] : null,
                text: rawMsg.data || ""
            };
        } 
        
        // 2. GUERRILLA MAIL
        else if (currentApiBase === "https://api.guerrillamail.com/ajax.php") {
            const response = await fetch(`${currentApiBase}?f=fetch_email&email_id=${id}&sid_token=${activeToken}`);
            const rawMsg = await response.json();
            
            const bodyStr = rawMsg.mail_body || "";
            const isHtml = bodyStr.includes('<') && bodyStr.includes('>');
            
            msg = { 
                subject: rawMsg.mail_subject || "(Sem assunto)", 
                html: isHtml ? [bodyStr] : null, 
                text: isHtml ? "" : bodyStr 
            };
        } 
        
        // 3. MAIL.GW e MAIL.TM (Padrão)
        // NOTA: O Mail7 não precisa bater na API de novo, pois o HTML/Text já vem na primeira busca (está no cache do front).
        else if (currentApiBase !== "MAIL7") {
            const response = await fetch(`${currentApiBase}/messages/${id}`, { 
                headers: { 'Authorization': `Bearer ${activeToken}` } 
            });
            msg = await response.json();
        } else {
             return res.status(400).json({ error: "Para Mail7, use o cache do frontend." });
        }

        res.status(200).json(msg);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao abrir o email' });
    }
}