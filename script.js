// CONFIGURAÇÃO SUPABASE
const SUPABASE_URL = "https://snyenbmszpaulmidxevm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ZStL2FdbZXEHnX5LCTUN1g_Fj5DUXVx";

let supabaseClient = null;

try {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (error) {
  console.error("🔴 Erro ao conectar ao banco de dados:", error);
}

// ==========================================
// INICIALIZAÇÃO ÚNICA (DOMContentLoaded)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // 1. Menu Hambúrguer
  const menuButton = document.querySelector(".menuHamburguer");
  const menu = document.getElementById("menu");

  if (menuButton && menu) {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "hsla(0, 0.00%, 0.00%, 0.45)";
    overlay.style.zIndex = "999";
    overlay.style.opacity = "0";
    overlay.style.visibility = "hidden";
    overlay.style.transition = "0.3s";
    document.body.appendChild(overlay);

    function abrirMenu() {
      menu.classList.add("active");
      menuButton.classList.add("active");
      overlay.style.opacity = "1";
      overlay.style.visibility = "visible";
      menuButton.innerHTML = "FECHAR";
      document.body.style.overflow = "hidden";

      // Oculta o botão do WhatsApp controlando o transform
      const btnWhats = document.querySelector(".btn-whatsapp-flutuante");
      if (btnWhats) btnWhats.style.transform = "scale(0)";
    }

    function fecharMenu() {
      menu.classList.remove("active");
      menuButton.classList.remove("active");
      overlay.style.opacity = "0";
      overlay.style.visibility = "hidden";
      menuButton.innerHTML = '<i class="fa-solid fa-bars"></i>';
      document.body.style.overflow = "";

      // Mostra novamente o botão do WhatsApp
      const btnWhats = document.querySelector(".btn-whatsapp-flutuante");
      if (btnWhats) btnWhats.style.transform = "scale(1)";
    }

    menuButton.addEventListener("click", () => {
      if (menu.classList.contains("active")) {
        fecharMenu();
      } else {
        abrirMenu();
      }
    });

    overlay.addEventListener("click", fecharMenu);

    document.querySelectorAll(".menu a").forEach(link => {
      link.addEventListener("click", fecharMenu);
    });
  }

  // 2. Lógica do Modal do Dízimo
  const btnDizimo = document.querySelector(".btnDizimo");
  const modal = document.getElementById("modalDizimo");
  const btnFecharX = document.getElementById("fecharModal");
  const btnEntendi = document.getElementById("btnEntendi");
  const btnCopiar = document.getElementById("btnCopiar");
  const cnpjTextoElement = document.getElementById("cnpjTexto");
  const alertaCopiado = document.getElementById("alertaCopiado");

  if (btnDizimo && modal) {
    btnDizimo.addEventListener("click", () => {
      modal.classList.add("active");
    });

    const fecharModal = () => {
      modal.classList.remove("active");
      if (alertaCopiado) alertaCopiado.classList.remove("show");
    };

    if (btnFecharX) btnFecharX.addEventListener("click", fecharModal);
    if (btnEntendi) btnEntendi.addEventListener("click", fecharModal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) fecharModal();
    });

    if (btnCopiar && cnpjTextoElement) {
      btnCopiar.addEventListener("click", () => {
        const textoParaCopiar = cnpjTextoElement.innerText.trim();

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(textoParaCopiar)
            .then(() => mostrarAlertaCopiado())
            .catch(err => usarMetodoAntigo(textoParaCopiar));
        } else {
          usarMetodoAntigo(textoParaCopiar);
        }
      });
    }

    function mostrarAlertaCopiado() {
      if (alertaCopiado) {
        alertaCopiado.classList.add("show");
        setTimeout(() => {
          alertaCopiado.classList.remove("show");
        }, 2500);
      }
    }

    function usarMetodoAntigo(texto) {
      try {
        const areaTexto = document.createElement("textarea");
        areaTexto.value = texto;
        areaTexto.style.position = "fixed";
        document.body.appendChild(areaTexto);
        areaTexto.select();
        document.execCommand("copy");
        document.body.removeChild(areaTexto);
        mostrarAlertaCopiado();
      } catch (err) {
        console.error("Erro crítico ao copiar texto: ", err);
      }
    }
  }

  // 3. Chamadas Iniciais das Funções Assíncronas
  carregarPostagens();
  carregarLeituraDoDia();
  
  // Executa e define o loop de atualização do contador da missa
  atualizarProximaMissa();
  setInterval(atualizarProximaMissa, 60000);
});

// ==========================================
// FUNÇÕES AUXILIARES E REQUISIÇÕES SUPABASE
// ==========================================

function calcularTempoAtras(dataIso) {
  const agora = new Date();
  const dataPost = new Date(dataIso);
  const diferencaEmSegundos = Math.floor((agora - dataPost) / 1000);

  if (diferencaEmSegundos < 60) return "Agora mesmo";

  const diferencaEmMinutos = Math.floor(diferencaEmSegundos / 60);
  if (diferencaEmMinutos < 60) return `Há ${diferencaEmMinutos} ${diferencaEmMinutos === 1 ? 'minuto' : 'minutos'}`;

  const diferencaEmHoras = Math.floor(diferencaEmMinutos / 60);
  if (diferencaEmHoras < 24) return `Há ${diferencaEmHoras} ${diferencaEmHoras === 1 ? 'hora' : 'horas'}`;

  const diferencaEmDias = Math.floor(diferencaEmHoras / 24);
  if (diferencaEmDias < 7) return `Há ${diferencaEmDias} ${diferencaEmDias === 1 ? 'dia' : 'dias'}`;

  return dataPost.toLocaleDateString('pt-BR');
}

async function carregarPostagens() {
  const mural = document.getElementById("muralPostagens");
  if (!mural) return;

  try {
    const { data, error } = await supabaseClient
      .from("postagens")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    mural.innerHTML = "";

    if (!data || !data.length) {
      mural.innerHTML = `
        <p style="text-align: center; color: #888888; width: 100%; grid-column: 1 / -1; padding: 20px 0;">
          Ainda não existem avisos ou novidades cadastradas.
        </p>
      `;
      return;
    }

    data.forEach(post => {
      const tempoPassado = calcularTempoAtras(post.created_at);
      
      const artigo = document.createElement("article");
      artigo.className = "post-card";

      if (post.imagem_url) {
        const divImagem = document.createElement("div");
        divImagem.className = "post-imagem";

        const urlMidia = post.imagem_url.trim();

        if (urlMidia.toLowerCase().endsWith(".mp4")) {
          const video = document.createElement("video");
          video.src = urlMidia;
          video.controls = true;
          video.preload = "metadata";
          video.style.width = "100%";
          video.style.height = "100%";
          video.style.objectFit = "cover";
          divImagem.appendChild(video);
        } else {
          const img = document.createElement("img");
          img.src = urlMidia;
          img.alt = "Aviso da Paróquia";
          divImagem.appendChild(img);
        }

        artigo.appendChild(divImagem);
      }

      const divConteudo = document.createElement("div");
      divConteudo.className = "post-conteudo";

      const spanTempo = document.createElement("span");
      spanTempo.className = "post-tempo";
      spanTempo.innerHTML = `<i class="fa-regular fa-clock"></i> ${tempoPassado}`;

      const pLegenda = document.createElement("p");
      pLegenda.className = "post-legenda";
      pLegenda.textContent = post.legenda || "";

      divConteudo.appendChild(spanTempo);
      divConteudo.appendChild(pLegenda);

      if (post.link_url && post.link_url.trim() !== "") {
        const urlDestino = post.link_url.trim();
        
        let textoExibicao = urlDestino
          .replace(/^(https?:\/\/)?(www\.)?/, '')
          .split('/')[0];

        if (textoExibicao.length < 3) textoExibicao = urlDestino;

        const aLink = document.createElement("a");
        aLink.className = "post-link-texto";
        aLink.href = urlDestino;
        aLink.target = "_blank";
        aLink.rel = "noopener noreferrer";
        aLink.innerHTML = `<i class="fa-solid fa-link"></i> ${textoExibicao}`;
        
        divConteudo.appendChild(aLink);
      }
      
      artigo.appendChild(divConteudo);
      mural.appendChild(artigo);
    });

  } catch (error) {
    console.error("🔴 Erro ao buscar dados do Supabase:", error);
    mural.innerHTML = `
      <p style="text-align: center; color: #d32f2f; width: 100%; grid-column: 1 / -1; padding: 20px 0;">
        Não foi possível buscar as informações no momento.
      </p>
    `;
  }
}

async function carregarLeituraDoDia() {
    const containerLeitura = document.getElementById("leituraDoDia");
    if (!containerLeitura) return;
  
    try {
      const { data, error } = await supabaseClient
        .from("leituras")
        .select("*")
        .order("id", { ascending: false })
        .limit(1)
        .single();
  
      if (error) throw error;
  
      if (data) {
        let corTratada = (data.cor_liturgica || '#242424').trim().toUpperCase();
        if (!corTratada.startsWith('#')) {
          corTratada = '#' + corTratada;
        }
  
        let nomeCor = "Comum";
        if (corTratada === '#00A859' || corTratada === '#2E7D32') { 
          nomeCor = "VERDE";
        } else if (corTratada === '#8A2BE2' || corTratada === '#6A1B9A') { 
          nomeCor = "ROXO";
        } else if (corTratada === '#FF0000' || corTratada === '#C62828') { 
          nomeCor = "VERMELHO";
        } else if (corTratada === '#FFD700' || corTratada === '#D4AF37' || corTratada === '#FFFFFF' || corTratada === '#F5F5F5') { 
          nomeCor = "BRANCO / DOURADO";
        } else if (corTratada === '#FF1493' || corTratada === '#FF8F00') { 
          nomeCor = "ROSA";
        }
  
        // Monta o esqueleto com os containers e classes CSS corretas
        containerLeitura.innerHTML = `
          <h2 class="titulo-liturgia" style="color: ${corTratada}; transition: color 0.3s ease; text-align: center; font-size: 17px">
            LITÚRGIA - ${data.data_texto} 
            <span style="display: block; font-size: 14px; font-weight: 500; margin-top: 5px; color: #777777; text-transform: none; text-align: center;">
              COR LITÚRGICA: <strong style="color: ${corTratada}; font-weight: 600;">${nomeCor}</strong>
            </span>
          </h2>
          <div class="resumo-liturgia-container">
            <p style="text-align: left; margin-bottom: 8px;"><strong>${data.referencia}</strong></p>
            <div class="resumo-liturgia-texto" id="texto-liturgia-paragrafo">${data.resumo}</div>
            <button class="btn-ler-mais" id="btn-liturgia-toggle">Ler mais</button>
          </div>
        `;
  
        containerLeitura.style.borderLeft = `5px solid ${corTratada}`;
        containerLeitura.style.transition = "border-color 0.3s ease";
  
        // LÓGICA DINÂMICA DO LER MAIS
        const textoElemento = document.getElementById("texto-liturgia-paragrafo");
        const btnToggle = document.getElementById("btn-liturgia-toggle");
  
        if (textoElemento && btnToggle) {
          // Verifica se a altura total do texto passa do limite visível de 10 linhas
          const deveraMostrarBotao = textoElemento.scrollHeight > textoElemento.clientHeight;
          
          if (deveraMostrarBotao) {
            btnToggle.style.display = "inline-block"; // Mostra o botão se o texto for grande
            
            btnToggle.addEventListener("click", () => {
              const estaExpandido = textoElemento.classList.toggle("expandido");
              btnToggle.textContent = estaExpandido ? "Ler menos" : "Ler mais";
            });
          }
        }
      }
    } catch (error) {
      console.error("🔴 Erro ao carregar a leitura do dia:", error);
      containerLeitura.innerHTML = `<p style="color: #888888; text-align: left;">Não foi possível carregar a leitura de hoje.</p>`;
    }
  }
// ==========================================
// LÓGICA DINÂMICA DA PRÓXIMA MISSA (ATUALIZADO)
// ==========================================
function atualizarProximaMissa() {
  const textoElemento = document.getElementById("texto-proxima-missa");
  const contadorElemento = document.getElementById("contador-missa");
  
  if (!textoElemento) return;

  const agora = new Date();
  
  // Sincronizado exatamente com o seu novo HTML
  const horariosConfig = {
    0: [{ hora: 8, minuto: 0 }],                         // Domingo: 08h00
    1: [{ hora: 19, minuto: 30 }],                        // Segunda: 19h30
    2: [{ hora: 19, minuto: 30 }],                        // Terça: 19h30
    3: [{ hora: 19, minuto: 30 }],                        // Quarta: 19h30
    4: [{ hora: 16, minuto: 0 }],                         // Quinta: 16h00
    5: [{ hora: 19, minuto: 30 }],                        // Sexta: 19h30
    6: [{ hora: 18, minuto: 30 }]                         // Sábado: 18h30
  };

  const diasSemanaPorExtenso = [
    "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", 
    "Quinta-feira", "Sexta-feira", "Sábado"
  ];

  let listaProximasMissas = [];

  for (let i = 0; i < 7; i++) {
    const dataVerificada = new Date(agora);
    dataVerificada.setDate(agora.getDate() + i);
    const diaSemana = dataVerificada.getDay();
    
    const configuracoesDoDia = horariosConfig[diaSemana];
    
    if (configuracoesDoDia) {
      configuracoesDoDia.forEach(horario => {
        const dataMissa = new Date(dataVerificada);
        dataMissa.setHours(horario.hora, horario.minuto, 0, 0);
        
        if (dataMissa >= agora) {
          listaProximasMissas.push({
            data: dataMissa,
            diaTexto: diasSemanaPorExtenso[diaSemana],
            horaTexto: `${String(horario.hora).padStart(2, '0')}h${String(horario.minuto).padStart(2, '0')}`
          });
        }
      });
    }
  }

  listaProximasMissas.sort((a, b) => a.data - b.data);

  if (listaProximasMissas.length > 0) {
    const proxima = listaProximasMissas[0];
    let diaExibicao = proxima.diaTexto;
    
    if (proxima.data.toDateString() === agora.toDateString()) {
      diaExibicao = "Hoje";
    } else {
      const amanha = new Date(agora);
      amanha.setDate(agora.getDate() + 1);
      if (proxima.data.toDateString() === amanha.toDateString()) {
        diaExibicao = "Amanhã";
      }
    }

    textoElemento.innerHTML = `${diaExibicao} às ${proxima.horaTexto}`;
    
    const diferencaMs = proxima.data - agora;
    const diferencaHoras = Math.floor(diferencaMs / (1000 * 60 * 60));
    const diferencaMinutos = Math.floor((diferencaMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diaExibicao === "Hoje" && diferencaHoras === 0 && diferencaMinutos <= 10) {
      contadorElemento.innerHTML = `⚠️ A missa está prestes a começar ou já iniciou!`;
      contadorElemento.style.color = "#d32f2f";
    } else if (diferencaHoras === 0) {
      contadorElemento.innerHTML = `Faltam apenas ${diferencaMinutos} minutos.`;
      contadorElemento.style.color = "#666666";
    } else if (diferencaHoras < 24) {
      contadorElemento.innerHTML = `Faltam aproximadamente ${diferencaHoras}h e ${diferencaMinutos}min.`;
      contadorElemento.style.color = "#666666";
    } else {
      contadorElemento.innerHTML = `Data: ${proxima.data.toLocaleDateString('pt-BR')}`;
      contadorElemento.style.color = "#666666";
    }
  } else {
    textoElemento.innerText = "Nenhum horário de missa encontrado.";
    contadorElemento.innerText = "";
  }
}