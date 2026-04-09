// Arquivo: api/getDomains.js

export default async function handler(req, res) {
    try {
        let domainsPool = [];

        // 1. Busca os domínios do Mail.gw e Mail.tm ao mesmo tempo (mais rápido)
        const [gwResponse, tmResponse] = await Promise.all([
            fetch('https://api.mail.gw/domains?page=1'),
            fetch('https://api.mail.tm/domains?page=1')
        ]);

        const gwData = await gwResponse.json();
        const tmData = await tmResponse.json();

        // Extrai apenas os domínios ativos e formata igual você fazia
        if (gwData['hydra:member']) {
            gwData['hydra:member'].forEach(d => {
                if (d.isActive) domainsPool.push({ domain: d.domain, api: 'https://api.mail.gw', label: 'GW' });
            });
        }

        if (tmData['hydra:member']) {
            tmData['hydra:member'].forEach(d => {
                if (d.isActive) domainsPool.push({ domain: d.domain, api: 'https://api.mail.tm', label: 'TM' });
            });
        }

        // 2. Adiciona as integrações manuais (M7, Maildrop, Guerrilla)
        domainsPool.push({ domain: "mail7.app", api: "MAIL7", label: "M7" });
        domainsPool.push({ domain: "maildrop.cc", api: "MAILDROP", label: "MD" });
        domainsPool.push({ domain: "sharklasers.com", api: "https://api.guerrillamail.com/ajax.php", label: "GRR" });
        domainsPool.push({ domain: "grr.la", api: "https://api.guerrillamail.com/ajax.php", label: "GRR" });

        // 3. Devolve a lista completa e formatada para o seu site
        res.status(200).json(domainsPool);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao montar a rede de domínios' });
    }
}