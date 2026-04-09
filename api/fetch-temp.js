export default async function handler(req, res) {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Email requerido" });

    try {
        const response = await fetch(`https://api.internal.temp-mail.io/api/v3/email/${email}/messages`, {
            method: 'GET',
            headers: {
                'accept': '*/*',
                'application-name': 'web',
                'application-version': '4.0.0',
                'x-cors-header': 'iaWg3pchvFx48fY', // O token que você capturou
                'user-agent': 'Mozilla/5.0'
            }
        });

        const data = await response.json();

        // <<< CÓDIGO 1 INSERIDO AQUI >>>
        // Adaptamos o formato para ser idêntico ao Mail.gw / Mail.tm
        const formatted = data.map(msg => ({
            id: msg.id,
            subject: msg.subject,
            from: { address: msg.from },
            intro: msg.body_text?.substring(0, 60) + "...",
            createdAt: msg.created_at,
            body_html: msg.body_html, // Linha adicionada para carregar o visual
            body_text: msg.body_text, // Linha adicionada para fallback de texto
            isTempIo: true // Flag para controle interno
        }));
        // <<< FIM DO CÓDIGO 1 >>>

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({ 'hydra:member': formatted });
    } catch (error) {
        res.status(500).json({ error: "Erro no Proxy" });
    }
}