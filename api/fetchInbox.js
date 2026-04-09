// Arquivo: api/fetchInbox.js

export default async function handler(req, res) {
    // Só aceita método POST
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

    try {
        // Recebe os dados do Front-end
        const { currentApiBase, activeToken, email } = req.body;
        let msgs = [];

        // 1. LÓGICA MAILDROP (GraphQL)
        if (currentApiBase === "MAILDROP") {
            const userOnly = email.split('@')[0];
            const response = await fetch(`https://api.maildrop.cc/graphql`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ query: `query { inbox(mailbox: "${userOnly}") { id headerfrom subject date } }` })
            });
            const data = await response.json();
            const rawMsgs = data.data?.inbox || [];
            
            msgs = rawMsgs.map((m) => ({
                id: m.id,
                subject: m.subject || "(Sem assunto)",
                from: { address: m.headerfrom || "unknown@sender.com" },
                intro: "",
                createdAt: m.date || new Date().toISOString()
            }));
        } 
        
        // 2. LÓGICA GUERRILLA MAIL
        else if (currentApiBase === "https://api.guerrillamail.com/ajax.php") {
            const response = await fetch(`${currentApiBase}?f=get_email_list&offset=0&sid_token=${activeToken}`);
            const data = await response.json();
            
            msgs = (data.list || []).filter(m => m.mail_id !== "1" && m.mail_from !== "no-reply@guerrillamail.com").map(m => ({
                id: m.mail_id,
                subject: m.mail_subject || "(Sem assunto)",
                from: { address: m.mail_from || "unknown@sender.com" },
                intro: m.mail_excerpt || "",
                createdAt: new Date(m.mail_timestamp * 1000).toISOString()
            }));
        } 
        
        // 3. LÓGICA MAIL7
        else if (currentApiBase === "MAIL7") {
            const response = await fetch(`https://api.mail7.app/api/emails?address=${email}`);
            if (response.ok) {
                const data = await response.json();
                let rawMsgs = Array.isArray(data) ? data : (data.data || []);
                
                msgs = rawMsgs.map((m, index) => {
                    let senderAddress = typeof m.from === 'string' ? m.from : (m.from?.address || "unknown@sender.com");
                    return {
                        id: `m7_${index}`,
                        subject: m.subject || "(Sem assunto)",
                        from: { address: senderAddress },
                        intro: m.text ? m.text.substring(0, 50) + "..." : "",
                        createdAt: m.date || new Date().toISOString(),
                        _rawIndex: index
                    };
                });
            }
        } 
        
        // 4. LÓGICA MAIL.GW e MAIL.TM
        else {
            const response = await fetch(`${currentApiBase}/messages?page=1`, { 
                headers: { 'Authorization': `Bearer ${activeToken}` } 
            });
            
            if (response.status === 401) {
                return res.status(401).json({ error: "Sessão expirada" });
            }
            
            const data = await response.json();
            msgs = data['hydra:member'] || [];
        }

        // Devolve os e-mails formatados para o Front-end
        res.status(200).json(msgs);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar a caixa de entrada' });
    }
}