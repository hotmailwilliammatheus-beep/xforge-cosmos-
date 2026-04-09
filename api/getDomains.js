module.exports = async function (req, res) {
    let domainsPool = [];

    try {
        // Tenta pegar da Mail.gw, se der erro, apenas ignora e segue a vida
        try {
            const gwResponse = await fetch('https://api.mail.gw/domains?page=1');
            if (gwResponse.ok) {
                const gwData = await gwResponse.json();
                gwData['hydra:member']?.forEach(d => {
                    if (d.isActive) domainsPool.push({ domain: d.domain, api: 'https://api.mail.gw', label: 'GW' });
                });
            }
        } catch (e) { console.log("Mail.gw bloqueado"); }

        // Tenta pegar da Mail.tm, se der erro, ignora
        try {
            const tmResponse = await fetch('https://api.mail.tm/domains?page=1');
            if (tmResponse.ok) {
                const tmData = await tmResponse.json();
                tmData['hydra:member']?.forEach(d => {
                    if (d.isActive) domainsPool.push({ domain: d.domain, api: 'https://api.mail.tm', label: 'TM' });
                });
            }
        } catch (e) { console.log("Mail.tm bloqueado"); }

        // ADICIONA AS INTEGRAÇÕES FIXAS (Essas sempre vão funcionar!)
        domainsPool.push({ domain: "mail7.app", api: "MAIL7", label: "M7" });
        domainsPool.push({ domain: "maildrop.cc", api: "MAILDROP", label: "MD" });
        domainsPool.push({ domain: "sharklasers.com", api: "https://api.guerrillamail.com/ajax.php", label: "GRR" });
        domainsPool.push({ domain: "grr.la", api: "https://api.guerrillamail.com/ajax.php", label: "GRR" });

        // Devolve os domínios que conseguiu
        res.status(200).json(domainsPool);

    } catch (error) {
        res.status(500).json({ error: 'Erro fatal na API' });
    }
};
