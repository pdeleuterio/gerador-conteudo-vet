// /api/generate.ts

// @google/genai SDK is imported to follow best practices.
import { GoogleGenAI } from "@google/genai";

// Este arquivo funciona como um backend seguro quando implantado em plataformas como a Vercel.
// As chaves de API devem ser configuradas como Variáveis de Ambiente na plataforma de hospedagem.

export const config = {
  runtime: 'edge',
};

async function handleRequest(request: Request) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Método não permitido' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const body = await request.json();
        const { action } = body;

        // As chaves são lidas das variáveis de ambiente do servidor (seguras)
        // FIX: Use process.env.API_KEY as per the guidelines.
        const apiKey = process.env.API_KEY;
        const unsplashApiKey = process.env.UNSPLASH_ACCESS_KEY;

        if (action === 'generateContent') {
            if (!apiKey) {
                return new Response(JSON.stringify({ error: 'Chave da API Gemini não configurada no servidor.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
            return await generateContent(body, apiKey);
        } else if (action === 'searchImages') {
             if (!unsplashApiKey) {
                return new Response(JSON.stringify({ error: 'Chave da API Unsplash não configurada no servidor.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
            return await searchUnsplashImages(body, unsplashApiKey);
        } else {
            return new Response(JSON.stringify({ error: 'Ação inválida.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

    } catch (error) {
        console.error('Erro na API:', error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno do servidor' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}


async function generateContent(body: any, apiKey: string) {
    // FIX: Refactored to use the @google/genai SDK.
    const ai = new GoogleGenAI({ apiKey });

    const { date: dateStr, tone } = body;
    
    // Lógica do calendário
    const calendar = getCalendarData();
    const date = new Date(dateStr);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const key = `${month}-${day}`;
    const post_idea = calendar[key] || "Crie um post sobre um caso de sucesso da sua clínica!";

    // Prompts para a IA
    const captionPrompt = `Você é um especialista em marketing de mídia social para clínicas veterinárias. Sua tarefa é criar uma legenda e hashtags para um post no Instagram com base na ideia: "${post_idea}". Tom da comunicação: ${tone}. Retorne um JSON com "caption" (string) e "hashtags" (array de strings).`;
    const imageStyleMap: { [key: string]: string } = {
        'Informativo': 'foto realista, clara e bem iluminada',
        'Profissional': 'foto profissional de estúdio, com fundo neutro',
        'Divertido': 'ilustração colorida e divertida no estilo cartoon ou 3D Pixar',
        'Empático': 'foto com iluminação suave e quente, transmitindo emoção',
        'Urgente': 'foto com um leve toque dramático, foco nítido no problema'
    };
    const imageStyle = imageStyleMap[tone] || 'foto realista';
    const imagePromptPrompt = `Baseado na ideia "${post_idea}", crie um prompt curto e direto em PORTUGUÊS para um gerador de imagens IA. Estilo: ${imageStyle}. Retorne um JSON com "image_prompt" (string).`;

    // Função auxiliar para chamar a API Gemini usando o SDK
    const callGemini = async (prompt: string) => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
            }
        });
        
        // FIX: Extract text content using response.text as per guidelines.
        const textContent = response.text;
        return JSON.parse(textContent.trim());
    };

    // Executa as duas chamadas em paralelo
    const [captionData, imageData] = await Promise.all([
        callGemini(captionPrompt),
        callGemini(imagePromptPrompt)
    ]);

    const result = {
        post_idea,
        caption: captionData.caption,
        hashtags: captionData.hashtags,
        image_prompt: imageData.image_prompt,
    };
    
    return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}

async function searchUnsplashImages(body: any, apiKey: string) {
    const { searchTerm } = body;
    const UNSPLASH_API_URL = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm)}&per_page=9&client_id=${apiKey}`;

    const response = await fetch(UNSPLASH_API_URL, {
        headers: { 'Accept-Version': 'v1' }
    });

    if (!response.ok) {
        throw new Error(`Erro ao buscar imagens no Unsplash: ${response.statusText}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}

// Handler principal que será usado pela Vercel
export default handleRequest;


// Função auxiliar do calendário
function getCalendarData(): { [key: string]: string } {
    return {
        "01-01": "Dia da Paz: Mensagem de ano novo sobre a importância de um ambiente tranquilo para os pets.", "01-02": "Check-up de Ano Novo: Lembrete para agendar o check-up anual.", "01-03": "Pets e o calor: Dicas para proteger os pets das altas temperaturas de verão.", "01-04": "Curiosidade Felina: Por que gatos amassam pãozinho?", "01-05": "Segurança nas Viagens: Guia rápido para viajar com pets.", "01-06": "Mitos sobre a Ração: Desmistifique a alimentação dos pets.", "01-07": "Benefícios da Vacinação: Fale sobre a importância das vacinas de rotina.", "01-08": "Identificando a Dor: Como saber se seu pet está sentindo dor?", "01-09": "Sinais de Desidratação: Alerta para o verão.", "01-10": "Brincadeiras Indoor: Sugestões para manter pets ativos dentro de casa.", "01-11": "Importância da Castração: Benefícios para a saúde e comportamento.", "01-12": "Curiosidade Canina: Por que cães inclinam a cabeça?", "01-13": "Alimentos Proibidos: Lista de comidas que pets não podem comer.", "01-14": "Saúde do Coração: Dicas para cuidar do coração do pet.", "01-15": "Depoimento de Cliente: Compartilhe a história de um tutor.", "01-16": "Pergunte ao Vet: Abra uma caixa de perguntas nos Stories.", "01-17": "Check-up Dentário: Fale sobre a importância da higiene bucal.", "01-18": "Curiosidade sobre Pássaros: Fatos sobre a inteligência de aves.", "01-19": "Primeiros Socorros: O que fazer em caso de engasgo.", "01-20": "Homenagem a Adoção: Conte a história de um pet adotado.", "01-21": "Por que o meu pet treme? Explique causas e o que fazer.", "01-22": "Pets e Crianças: Dicas de convivência segura.", "01-23": "Cuidado com Fogos: Alerte sobre os perigos do barulho para pets.", "01-24": "Dicas de Adestramento: Conselhos de obediência básica.", "01-25": "Sinais de Estresse: Como identificar e ajudar um pet estressado.", "01-26": "Pets Idosos: Cuidados essenciais para a terceira idade.", "01-27": "Dia de Foto Pet: Convide seguidores a postarem fotos.", "01-28": "Mitos sobre a Pelagem: Desmistifique mitos sobre banho e tosa.", "01-29": "Especial Banho e Tosa: Destaque os serviços da clínica.", "01-30": "Sinais de Infecção: O que observar na pele e nos ouvidos.", "01-31": "Resumo do Mês: Destaque os pets mais fofos de janeiro.",
        "02-01": "\"Amores Pet\": Post sobre o amor incondicional dos pets.", "02-02": "Rotina de Vacinas: Lembrete sobre as vacinas de reforço.", "02-03": "Importância da Água: Fale sobre a hidratação correta.", "02-04": "Curiosidade sobre Coelhos: Fatos sobre o comportamento e dieta.", "02-05": "Filtros Solares: Dicas para proteger a pele dos pets.", "02-06": "Doenças Parasitárias: Alerte sobre pulgas e carrapatos.", "02-07": "Perigos de Alimentos: Alerte sobre alimentos tóxicos como uvas.", "02-08": "Aprenda com o Vet: Explique termos veterinários de forma simples.", "02-09": "Como escolher a ração: Guia rápido de escolha da ração.", "02-10": "Enriquecimento Ambiental: Brinquedos e desafios para pets.", "02-11": "Tutor Presente: Fale sobre a importância de dar atenção ao pet.", "02-12": "Saúde Bucal: Como escovar os dentes do pet.", "02-13": "Sinais de Alergia: Como identificar alergias em pets.", "02-14": "Dia dos Namorados: Post sobre o amor incondicional dos pets.", "02-15": "Pergunte ao Vet: Tire dúvidas sobre o comportamento felino.", "02-16": "Pets e a Rotina: Dicas para adaptar o pet à sua rotina.", "02-17": "Dia Mundial do Gato: Curiosidades e homenagem aos felinos.", "02-18": "Importância da Vermifugação: Fale sobre os vermes intestinais.", "02-19": "Guia de Brinquedos: Sugestões de brinquedos para diferentes pets.", "02-20": "Primeira Vacina: Conte a história de um pet na primeira vacina.", "02-21": "Curiosidade sobre Hamsters: Fatos sobre a vida e cuidados.", "02-22": "Sinais de Obesidade: Como identificar o excesso de peso.", "02-23": "O que o veterinário faz? Mostre o dia a dia na clínica.", "02-24": "Passeios com Segurança: Dicas de coleiras e guias.", "02-25": "Por que gatos ronronam? Explique o comportamento.", "02-26": "Benefícios do Banho e Tosa: Fale sobre higiene e saúde da pele.", "02-27": "Sinais de Infecção Urinária: O que observar em gatos.", "02-28": "Pets e Outros Animais: Dicas de convivência entre espécies.", "02-29": "Dia Bissexto: \"Um dia a mais para amar seu pet\".",
        "03-01": "Guia de Emergência: O que fazer em caso de ingestão de veneno.", "03-02": "Cães Guia: Curiosidades sobre cães-guias.", "03-03": "Doença do Carrapato: Sintomas e prevenção.", "03-04": "Sinais de Otite: Como identificar infecção de ouvido.", "03-05": "Caminhadas Seguras: Dicas para passeios em trilhas.", "03-06": "Diferença entre Rações: Explique ração seca, úmida e natural.", "03-07": "Vacina da Raiva: Lembrete sobre a vacinação anual.", "03-08": "Dia da Mulher: Homenagem às veterinárias e tutoras.", "03-09": "Curiosidade sobre Iguanas: Fatos sobre o comportamento e cuidados.", "03-10": "Plantas Tóxicas: Lista de plantas perigosas para pets.", "03-11": "Benefícios da Dieta Natural: Prós e contras.", "03-12": "Sinais de Doença Hepática: O que observar.", "03-13": "Rotina de Higiene: Como limpar olhos e orelhas.", "03-14": "Dia Nacional dos Animais: Campanha contra o abandono.", "03-15": "Cuidados com a Pelagem: Dicas para o outono.", "03-16": "Curiosidade sobre Porquinhos-da-Índia: Fatos sobre o comportamento.", "03-17": "Cinomose: Alerta sobre os sintomas e prevenção.", "03-18": "Mitos sobre Comportamento: Desmistifique mitos sobre \"dominância\".", "03-19": "Enriquecimento Mental: Brincadeiras para pets.", "03-20": "Início do Outono: Post com dicas para a estação.", "03-21": "Perigo de Ingestão: Alerte sobre a ingestão de objetos pequenos.", "03-22": "Curiosidade sobre Gatos Pretos: Fatos interessantes.", "03-23": "Sinais de Cistite: Como identificar problemas urinários.", "03-24": "Cuidados com Pets Exóticos: Fale sobre a saúde de répteis.", "03-25": "Dia Nacional da Adoção: Apresente pets para adoção.", "03-26": "Importância da Medicação: Lembrete sobre a dose correta.", "03-27": "Curiosidade sobre Jabutis: Fatos sobre a dieta e o ambiente.", "03-28": "Benefícios dos Suplementos: Fale sobre suplementos para pets.", "03-29": "Reconhecendo Sinais: Dicas para identificar comportamentos estranhos.", "03-30": "Antes e Depois: Mostre a recuperação de um pet.", "03-31": "Pergunte ao Vet: Sessão de perguntas sobre saúde felina.",
        "04-01": "Dia da Mentira: Brinque com fatos e mitos divertidos sobre pets.", "04-02": "Importância dos Exames de Sangue: O que eles revelam.", "04-03": "Sinais de Problemas Renais: Alerta para a saúde dos rins.", "04-04": "Dia Mundial dos Animais de Rua: Peça doações para abrigos.", "04-05": "Por que o meu pet come grama? Explique o comportamento.", "04-06": "Alerta Pulgas e Carrapatos: Dicas de prevenção e tratamento.", "04-07": "Saúde Reprodutiva: Fale sobre a importância da castração para a saúde reprodutiva.", "04-08": "Primeiros Socorros: O que fazer em caso de cortes leves.", "04-09": "Pets e a Cozinha: Dicas de segurança na cozinha.", "04-10": "Check-up Dentário: Mostre a rotina de limpeza de dentes.", "04-11": "Sinais de Obesidade: Como identificar o excesso de peso.", "04-12": "Páscoa Segura: Alerte sobre chocolate e outros perigos.", "04-13": "Dicas para Viagens de Carro: Como manter o pet seguro.", "04-14": "Benefícios dos Passeios: Fale sobre a saúde física e mental.", "04-15": "Pet do Dia: Destaque um pet que passou pela clínica.", "04-16": "Sinais de Dor de Ouvido: Como identificar e tratar.", "04-17": "Curiosidade sobre Chinchilas: Fatos sobre esses roedores.", "04-18": "Como Ajudar um Pet Adoecido: Dicas para cuidar em casa.", "04-19": "Importância do Microchip: Fale sobre a identificação.", "04-20": "Brincadeiras Indoor: Sugestões para dias de chuva.", "04-21": "Alimentos Proibidos: Reforço sobre comidas tóxicas.", "04-22": "Dia da Terra: Fale sobre como cuidar dos pets e do meio ambiente.", "04-23": "Tudo sobre Tosa: Explique os tipos de tosa.", "04-24": "Sinais de Diabetes: Alerta para os sintomas.", "04-25": "Cães e Gatos juntos: Dicas para uma convivência harmoniosa.", "04-26": "Saúde Ocular: Dicas para cuidar dos olhos do pet.", "04-27": "Dia Mundial do Veterinário: Homenagem à profissão.", "04-28": "Benefícios de Suplementos: Fale sobre vitaminas e minerais.", "04-29": "Rotina de Vermifugação: Lembrete para vermifugar o pet.", "04-30": "Antes e Depois: Mostre a recuperação de um pet.",
        "05-01": "Saúde Animal: Inicie a campanha do \"Mês da Saúde Animal\".", "05-02": "Alerta Carrapatos: Fale sobre a doença do carrapato.", "05-03": "Sinais de Parasitas: Como identificar vermes e pulgas.", "05-04": "Curiosidade sobre Porcos: Fatos interessantes sobre o comportamento.", "05-05": "Dia de Foto Pet: Peça para os seguidores enviarem fotos.", "05-06": "Pergunte ao Vet: Sessão de perguntas nos Stories.", "05-07": "Cuidados com Pet Idoso: Dicas para a saúde do idoso.", "05-08": "Sinais de Problemas Renais: Como identificar problemas nos rins.", "05-09": "Benefícios da Dieta Natural: Fale sobre a alimentação natural.", "05-10": "Pets e Crianças: Como ensinar a convivência.", "05-11": "Cuidados com a Pelagem: Dicas de escovação.", "05-12": "Dia das Mães: Homenagem às \"mães de pet\".", "05-13": "Sinais de Dor de Cabeça: Como saber se seu pet está com dor de cabeça.", "05-14": "Curiosidade sobre Cobras: Fatos sobre o comportamento.", "05-15": "Primeiros Socorros: O que fazer em caso de choque.", "05-16": "Pets com Câncer: Como cuidar de pets em tratamento.", "05-17": "Importância do Microchip: Fale sobre o microchip.", "05-18": "Sinais de Obesidade: Dicas para evitar a obesidade.", "05-19": "Rotina de Vacinas: Lembrete sobre vacinas de reforço.", "05-20": "Guia de Brinquedos: Sugestões de brinquedos para pets.", "05-21": "Perigos do Chocolate: Alerte sobre o chocolate.", "05-22": "Curiosidade sobre Tartarugas: Fatos sobre tartarugas.", "05-23": "Pets e a Cozinha: Dicas de segurança na cozinha.", "05-24": "Sinais de Estresse: Como identificar e ajudar.", "05-25": "Dia Nacional da Adoção: Apresente pets para adoção.", "05-26": "Benefícios dos Passeios: Fale sobre a saúde mental e física.", "05-27": "Sinais de Infecção Urinária: Alerta para infecções.", "05-28": "Tudo sobre Tosa: Explique os tipos de tosa.", "05-29": "Pergunte ao Vet: Sessão de perguntas sobre pets idosos.", "05-30": "Curiosidade sobre Coelhos: Fatos sobre a dieta.", "05-31": "Resumo do Mês: Destaque os pets mais fofos de maio.",
        "06-01": "Cuidados no Frio: Dicas para proteger o pet no inverno.", "06-02": "Sinais de Gripe Canina: Alerta para doenças respiratórias.", "06-03": "Primeiros Socorros: O que fazer em caso de hipotermia.", "06-04": "Benefícios do Banho e Tosa: Fale sobre a importância da higiene.", "06-05": "Pet do Dia: Destaque um pet que passou pela clínica.", "06-06": "Curiosidade sobre Furões: Fatos sobre o comportamento.", "06-07": "Importância da Hidratação: Reforço sobre a água.", "06-08": "Dicas de Adestramento: Conselhos de obediência.", "06-09": "Perigos de Alimentos: Alerte sobre alimentos tóxicos.", "06-10": "Sinais de Alergia: Como identificar alergias.", "06-11": "Curiosidade sobre Répteis: Fatos sobre o comportamento.", "06-12": "Dia dos Namorados: Post sobre o amor por pets.", "06-13": "Pets e Chuva: Dicas para dias chuvosos.", "06-14": "Sinais de Problemas Dentários: Alerta para a saúde bucal.", "06-15": "Pets Idosos: Cuidados essenciais para pets idosos.", "06-16": "Rotina de Vermifugação: Lembrete para vermifugar.", "06-17": "Cuidados com a Pelagem: Dicas para o inverno.", "06-18": "Importância da Vacinação: Fale sobre a vacina da gripe.", "06-19": "Pets e Crianças: Dicas de convivência.", "06-20": "Sinais de Estresse: Como identificar o estresse.", "06-21": "Início do Inverno: Post com dicas para a estação.", "06-22": "Curiosidade sobre Gatos: Fatos sobre o comportamento.", "06-23": "Sinais de Otite: Como identificar infecção de ouvido.", "06-24": "Pets e a Cozinha: Dicas de segurança.", "06-25": "A importância do Brinquedo: Fale sobre enriquecimento ambiental.", "06-26": "Sinais de Desidratação: Alerta para a desidratação.", "06-27": "Pets e Outros Animais: Dicas de convivência.", "06-28": "Benefícios dos Passeios: Fale sobre a saúde mental e física.", "06-29": "Rotina de Vacinas: Lembrete sobre vacinas de reforço.", "06-30": "Resumo do Mês: Destaque os pets mais fofos de junho.",
        "07-01": "Pets em Férias: Dicas de segurança em viagens.", "07-02": "Sinais de Dor de Ouvido: Alerta para infecções.", "07-03": "Curiosidade sobre Coelhos: Fatos sobre a dieta.", "07-04": "Primeiros Socorros: O que fazer em caso de torção.", "07-05": "Benefícios do Banho e Tosa: Fale sobre a importância da higiene.", "07-06": "Pet do Dia: Destaque um pet que passou pela clínica.", "07-07": "Sinais de Obesidade: Como identificar o excesso de peso.", "07-08": "Rotina de Vacinas: Lembrete sobre vacinas de reforço.", "07-09": "Perigos de Alimentos: Alerte sobre alimentos tóxicos.", "07-10": "Dicas de Adestramento: Conselhos de obediência.", "07-11": "Sinais de Alergia: Como identificar alergias.", "07-12": "Curiosidade sobre Furões: Fatos sobre o comportamento.", "07-13": "Importância da Hidratação: Reforço sobre a água.", "07-14": "Pets e a Cozinha: Dicas de segurança.", "07-15": "Benefícios dos Passeios: Fale sobre a saúde mental e física.", "07-16": "Rotina de Vermifugação: Lembrete para vermifugar.", "07-17": "Sinais de Estresse: Como identificar o estresse.", "07-18": "Curiosidade sobre Gatos: Fatos sobre o comportamento.", "07-19": "Pets e Outros Animais: Dicas de convivência.", "07-20": "Tudo sobre Tosa: Explique os tipos de tosa.", "07-21": "Sinais de Infecção: O que observar na pele e nos ouvidos.", "07-22": "Dicas de Adestramento: Conselhos de obediência.", "07-23": "Sinais de Dor de Ouvido: Alerta para infecções.", "07-24": "Perigos de Alimentos: Alerte sobre alimentos tóxicos.", "07-25": "Benefícios do Banho e Tosa: Fale sobre a importância da higiene.", "07-26": "Sinais de Desidratação: Alerta para a desidratação.", "07-27": "Pets e Outros Animais: Dicas de convivência.", "07-28": "Importância da Hidratação: Reforço sobre a água.", "07-29": "Rotina de Vacinas: Lembrete sobre vacinas de reforço.", "07-30": "Sinais de Estresse: Como identificar o estresse.", "07-31": "Resumo do Mês: Destaque os pets mais fofos de julho.",
        "08-01": "Mês do Cachorro: Inicie a campanha de agosto.", "08-02": "Sinais de Dor: Como identificar a dor em cães.", "08-03": "Curiosidade sobre Cães: Fatos sobre o comportamento.", "08-04": "Primeiros Socorros: O que fazer em caso de picadas.", "08-05": "Benefícios do Banho e Tosa: Fale sobre a importância da higiene.", "08-06": "Pet do Dia: Destaque um pet que passou pela clínica.", "08-07": "Sinais de Obesidade: Como identificar o excesso de peso.", "08-08": "Dia Mundial do Gato: Curiosidades e homenagem aos felinos.", "08-09": "Rotina de Vacinas: Lembrete sobre vacinas de reforço.", "08-10": "Perigos de Alimentos: Alerte sobre alimentos tóxicos.", "08-11": "Sinais de Alergia: Como identificar alergias.", "08-12": "Curiosidade sobre Gatos: Fatos sobre o comportamento.", "08-13": "Importância da Hidratação: Reforço sobre a água.", "08-14": "Pets e a Cozinha: Dicas de segurança.", "08-15": "Benefícios dos Passeios: Fale sobre a saúde mental e física.", "08-16": "Rotina de Vermifugação: Lembrete para vermifugar.", "08-17": "Sinais de Estresse: Como identificar o estresse.", "08-18": "Curiosidade sobre Gatos: Fatos sobre o comportamento.", "08-19": "Pets e Outros Animais: Dicas de convivência.", "08-20": "Tudo sobre Tosa: Explique os tipos de tosa.", "08-21": "Sinais de Infecção: O que observar na pele e nos ouvidos.", "08-22": "Dicas de Adestramento: Conselhos de obediência.", "08-23": "Sinais de Dor de Ouvido: Alerta para infecções.", "08-24": "Perigos de Alimentos: Alerte sobre alimentos tóxicos.", "08-25": "Benefícios do Banho e Tosa: Fale sobre a importância da higiene.", "08-26": "Dia Mundial do Cão: Homenagem aos cães.", "08-27": "Sinais de Desidratação: Alerta para a desidratação.", "08-28": "Pets e Outros Animais: Dicas de convivência.", "08-29": "Importância da Hidratação: Reforço sobre a água.", "08-30": "Rotina de Vacinas: Lembrete sobre vacinas de reforço.", "08-31": "Resumo do Mês: Destaque os pets mais fofos de agosto.",
        "09-01": "Mês do Veterinário: Inicie a campanha de setembro.", "09-02": "Sinais de Dor: Como identificar a dor em gatos.", "09-03": "Curiosidade sobre Cães: Fatos sobre o comportamento.", "09-04": "Primeiros Socorros: O que fazer em caso de engasgo.", "09-05": "Benefícios do Banho e Tosa: Fale sobre a importância da higiene.", "09-06": "Pet do Dia: Destaque um pet que passou pela clínica.", "09-07": "Sinais de Obesidade: Como identificar o excesso de peso.", "09-08": "Rotina de Vacinas: Lembrete sobre vacinas de reforço.", "09-09": "Dia do Veterinário: Homenagem à profissão.", "09-10": "Perigos de Alimentos: Alerte sobre alimentos tóxicos.", "09-11": "Sinais de Alergia: Como identificar alergias.", "09-12": "Curiosidade sobre Gatos: Fatos sobre o comportamento.", "09-13": "Importância da Hidratação: Reforço sobre a água.", "09-14": "Pets e a Cozinha: Dicas de segurança.", "09-15": "Benefícios dos Passeios: Fale sobre a saúde mental e física.", "09-16": "Rotina de Vermifugação: Lembrete para vermifugar.", "09-17": "Sinais de Estresse: Como identificar o estresse.", "09-18": "Curiosidade sobre Gatos: Fatos sobre o comportamento.", "09-19": "Pets e Outros Animais: Dicas de convivência.", "09-20": "Tudo sobre Tosa: Explique os tipos de tosa.", "09-21": "Sinais de Infecção: O que observar na pele e nos ouvidos.", "09-22": "Início da Primavera: Post com dicas para a estação.", "09-23": "Dicas de Adestramento: Conselhos de obediência.", "09-24": "Sinais de Dor de Ouvido: Alerta para infecções.", "09-25": "Perigos de Alimentos: Alerte sobre alimentos tóxicos.", "09-26": "Benefícios do Banho e Tosa: Fale sobre a importância da higiene.", "09-27": "Sinais de Desidratação: Alerta para a desidratação.", "09-28": "Pets e Outros Animais: Dicas de convivência.", "09-29": "Importância da Hidratação: Reforço sobre a água.", "09-30": "Resumo do Mês: Destaque os pets mais fofos de setembro.",
        "10-01": "Mês da Conscientização: Inicie a campanha de outubro.", "10-02": "Sinais de Dor: Como identificar a dor em pets.", "10-03": "Curiosidade sobre Cães: Fatos sobre o comportamento.", "10-04": "Dia Mundial dos Animais: Homenagem aos animais.", "10-05": "Primeiros Socorros: O que fazer em caso de torção.", "10-06": "Benefícios do Banho e Tosa: Fale sobre a importância da higiene.", "10-07": "Pet do Dia: Destaque um pet que passou pela clínica.", "10-08": "Sinais de Obesidade: Como identificar o excesso de peso.", "10-09": "Rotina de Vacinas: Lembrete sobre vacinas de reforço.", "10-10": "Perigos de Alimentos: Alerte sobre alimentos tóxicos.", "10-11": "Sinais de Alergia: Como identificar alergias.", "10-12": "Dia das Crianças: Post sobre a importância dos pets para as crianças.", "10-13": "Importância da Hidratação: Reforço sobre a água.", "10-14": "Pets e a Cozinha: Dicas de segurança.", "10-15": "Benefícios dos Passeios: Fale sobre a saúde mental e física.", "10-16": "Rotina de Vermifugação: Lembrete para vermifugar.", "10-17": "Sinais de Estresse: Como identificar o estresse.", "10-18": "Curiosidade sobre Gatos: Fatos sobre o comportamento.", "10-19": "Pets e Outros Animais: Dicas de convivência.", "10-20": "Tudo sobre Tosa: Explique os tipos de tosa.", "10-21": "Sinais de Infecção: O que observar na pele e nos ouvidos.", "10-22": "Dicas de Adestramento: Conselhos de obediência.", 
        // FIX: Corrected duplicate key from "03-23" to "10-23". This resolves the object literal error.
        "10-23": "Sinais de Dor de Ouvido: Alerta para infecções.", "10-24": "Perigos de Alimentos: Alerte sobre alimentos tóxicos.", "10-25": "Benefícios do Banho e Tosa: Fale sobre a importância da higiene.", "10-26": "Sinais de Desidratação: Alerta para a desidratação.", "10-27": "Pets e Outros Animais: Dicas de convivência.", "10-28": "Importância da Hidratação: Reforço sobre a água.", "10-29": "Rotina de Vacinas: Lembrete sobre vacinas de reforço.", "10-30": "Sinais de Estresse: Como identificar o estresse.", "10-31": "Halloween: Dicas de segurança para pets no Halloween.",
        "11-01": "Black Friday: Inicie a campanha de novembro.", "11-02": "Sinais de Dor: Como identificar a dor em pets.", "11-03": "Curiosidade sobre Cães: Fatos sobre o comportamento.", "11-04": "Primeiros Socorros: O que fazer em caso de torção.", "11-05": "Benefícios do Banho e Tosa: Fale sobre a importância da higiene.", "11-06": "Pet do Dia: Destaque um pet que passou pela clínica.", "11-07": "Sinais de Obesidade: Como identificar o excesso de peso.", "11-08": "Rotina de Vacinas: Lembrete sobre vacinas de reforço.", "11-09": "Perigos de Alimentos: Alerte sobre alimentos tóxicos.", "11-10": "Sinais de Alergia: Como identificar alergias.", "11-11": "Curiosidade sobre Gatos: Fatos sobre o comportamento.", "11-12": "Importância da Hidratação: Reforço sobre a água.", "11-13": "Pets e a Cozinha: Dicas de segurança.", "11-14": "Benefícios dos Passeios: Fale sobre a saúde mental e física.", "11-15": "Rotina de Vermifugação: Lembrete para vermifugar.", "11-16": "Sinais de Estresse: Como identificar o estresse.", "11-17": "Curiosidade sobre Gatos: Fatos sobre o comportamento.", "11-18": "Pets e Outros Animais: Dicas de convivência.", "11-19": "Tudo sobre Tosa: Explique os tipos de tosa.", "11-20": "Sinais de Infecção: O que observar na pele e nos ouvidos.", "11-21": "Dicas de Adestramento: Conselhos de obediência.", "11-22": "Sinais de Dor de Ouvido: Alerta para infecções.", "11-23": "Perigos de Alimentos: Alerte sobre alimentos tóxicos.", "11-24": "Benefícios do Banho e Tosa: Fale sobre a importância da higiene.", "11-25": "Sinais de Desidratação: Alerta para a desidratação.", "11-26": "Pets e Outros Animais: Dicas de convivência.", "11-27": "Importância da Hidratação: Reforço sobre a água.", "11-28": "Rotina de Vacinas: Lembrete sobre vacinas de reforço.", "11-29": "Black Friday: Promoções e ofertas especiais.", "11-30": "Sinais de Estresse: Como identificar o estresse.",
        "12-01": "Dezembro Verde: Inicie a campanha contra o abandono.", "12-02": "Sinais de Dor: Como identificar a dor em pets.", "12-03": "Curiosidade sobre Cães: Fatos sobre o comportamento.", "12-04": "Primeiros Socorros: O que fazer em caso de engasgo.", "12-05": "Benefícios do Banho e Tosa: Fale sobre a importância da higiene.", "12-06": "Pet do Dia: Destaque um pet que passou pela clínica.", "12-07": "Sinais de Obesidade: Como identificar o excesso de peso.", "12-08": "Rotina de Vacinas: Lembrete sobre vacinas de reforço.", "12-09": "Perigos de Alimentos: Alerte sobre alimentos tóxicos.", "12-10": "Sinais de Alergia: Como identificar alergias.", "12-11": "Curiosidade sobre Gatos: Fatos sobre o comportamento.", "12-12": "Importância da Hidratação: Reforço sobre a água.", "12-13": "Pets e a Cozinha: Dicas de segurança.", "12-14": "Benefícios dos Passeios: Fale sobre a saúde mental e física.", "12-15": "Rotina de Vermifugação: Lembrete para vermifugar.", "12-16": "Sinais de Estresse: Como identificar o estresse.", "12-17": "Curiosidade sobre Gatos: Fatos sobre o comportamento.", "12-18": "Pets e Outros Animais: Dicas de convivência.", "12-19": "Tudo sobre Tosa: Explique os tipos de tosa.", "12-20": "Sinais de Infecção: O que observar na pele e nos ouvidos.", "12-21": "Início do Verão: Post com dicas para a estação.", "12-22": "Dicas de Adestramento: Conselhos de obediência.", "12-23": "Sinais de Dor de Ouvido: Alerta para infecções.", "12-24": "Véspera de Natal: Dicas para manter o pet seguro.", "12-25": "Natal: Mensagem de Feliz Natal com os pets.", "12-26": "Pós-Natal: Dicas para pets que comeram demais.", "12-27": "Pets e Outros Animais: Dicas de convivência.", "12-28": "Importância da Hidratação: Reforço sobre a água.", "12-29": "Rotina de Vacinas: Lembrete sobre vacinas de reforço.", "12-30": "Sinais de Estresse: Como identificar o estresse.", "12-31": "Ano Novo: Dicas para proteger o pet do barulho dos fogos."
    };
}