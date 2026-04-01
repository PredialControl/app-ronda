import { useState } from "react";

const secoes = {
  implantacao: {
    titulo: "Implantação",
    subtitulo: "Acompanhe todas as etapas do processo de implantação do empreendimento",
    cor: "orange",
    icone: "🔨",
    cards: [
      { key: "kanban", icone: "📋", titulo: "Kanban", descricao: "Acompanhe o andamento de cada etapa: comissionamentos, conferências, documentação e vistoria. Registre fotos, checklists e pendências." },
      { key: "relatorio", icone: "📝", titulo: "Relatório de Pendências", descricao: "Crie e gerencie relatórios com as pendências do contrato. Organize itens por seção e acompanhe o status de cada pendência." },
      { key: "evolucao", icone: "📈", titulo: "Evolução dos Recebimentos", descricao: "Visualize a evolução com tabela resumo por relatório, gráficos de distribuição e linha do tempo de recebimentos." },
      { key: "doc", icone: "📂", titulo: "Documentação Técnica", descricao: "Acesse manuais, projetos as built, alvarás, ARTs, certificados e demais documentos obrigatórios para entrega." },
      { key: "plano", icone: "🔧", titulo: "Plano de Manutenção", descricao: "Consulte e registre o plano de manutenção preventiva com frequências, responsáveis e histórico de execuções." },
    ]
  },
  supervisao: {
    titulo: "Supervisão",
    subtitulo: "Gerencie as atividades de supervisão técnica e acompanhamento do condomínio",
    cor: "blue",
    icone: "🛡️",
    cards: [
      { key: "rondas", icone: "🔍", titulo: "Rondas de Supervisão", descricao: "Registre e acompanhe as rondas realizadas no condomínio. Documente inspeções, ocorrências e conformidades observadas." },
      { key: "parecer", icone: "📋", titulo: "Parecer Técnico", descricao: "Elabore e consulte pareceres técnicos sobre o estado do empreendimento. Registre avaliações e recomendações." },
      { key: "documentos", icone: "📂", titulo: "Documentos do Condomínio", descricao: "Centralize atas, regulamentos, apólices, contratos de manutenção e demais arquivos da gestão condominial." },
      { key: "preventivas", icone: "✅", titulo: "Verificar Preventivas", descricao: "Verifique a execução das manutenções preventivas programadas e acompanhe o plano de manutenção." },
    ]
  }
};

function Card({ icone, titulo, descricao, cor }) {
  const [hov, setHov] = useState(false);
  const accent = cor === "orange" ? "#f97316" : "#3b82f6";
  const border = hov ? accent : (cor === "orange" ? "#431407" : "#1e3a5f");
  const iconBg = cor === "orange" ? "rgba(249,115,22,0.12)" : "rgba(59,130,246,0.12)";
  const shadow = hov ? `0 8px 28px ${cor === "orange" ? "rgba(249,115,22,0.15)" : "rgba(59,130,246,0.15)"}` : "none";

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative", background: "rgba(31,41,55,0.8)", border: `1.5px solid ${border}`,
        borderRadius: 16, padding: "20px", cursor: "pointer",
        transform: hov ? "translateY(-3px)" : "none",
        transition: "all 0.2s ease", boxShadow: shadow,
      }}
    >
      {/* Top glow line */}
      {hov && (
        <div style={{
          position: "absolute", top: 0, left: 24, right: 24, height: 1,
          background: `linear-gradient(to right, transparent, ${accent}, transparent)`,
          borderRadius: 1,
        }} />
      )}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{
          width: 44, height: 44, background: iconBg, borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, flexShrink: 0,
        }}>
          {icone}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: hov ? accent : "#fff", fontSize: 14, marginBottom: 6, transition: "color 0.2s" }}>
            {titulo}
          </div>
          <div style={{ color: "#9ca3af", fontSize: 12, lineHeight: 1.65 }}>{descricao}</div>
        </div>
      </div>
      <div style={{ position: "absolute", top: 16, right: 16, color: hov ? accent : "#374151", fontSize: 13, transition: "color 0.2s" }}>
        →
      </div>
    </div>
  );
}

export default function Preview() {
  const [aba, setAba] = useState("implantacao");
  const s = secoes[aba];
  const accent = s.cor === "orange" ? "#f97316" : "#3b82f6";
  const badgeBg = s.cor === "orange" ? "rgba(249,115,22,0.15)" : "rgba(59,130,246,0.15)";

  return (
    <div style={{ background: "#111827", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Switcher */}
      <div style={{ background: "#030712", borderBottom: "1px solid #1f2937", padding: "10px 20px", display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ color: "#6b7280", fontSize: 11, marginRight: 4 }}>Preview tela:</span>
        {["implantacao", "supervisao"].map(k => {
          const active = aba === k;
          const bg = active ? (k === "implantacao" ? "#ea580c" : "#2563eb") : "#1f2937";
          return (
            <button key={k} onClick={() => setAba(k)} style={{
              padding: "6px 16px", borderRadius: 8, border: "none", fontSize: 12,
              fontWeight: 600, cursor: "pointer", background: bg,
              color: active ? "#fff" : "#9ca3af", transition: "all 0.15s",
            }}>
              {k === "implantacao" ? "🔨 Implantação" : "🛡️ Supervisão"}
            </button>
          );
        })}
      </div>

      {/* Conteúdo */}
      <div style={{ padding: "44px 36px", maxWidth: 920, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 4 }}>
          <div style={{
            width: 52, height: 52, background: `${accent}20`, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0,
          }}>
            {s.icone}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h1 style={{ margin: 0, color: "#fff", fontWeight: 800, fontSize: 26, letterSpacing: -0.5 }}>{s.titulo}</h1>
              <span style={{
                background: badgeBg, color: accent,
                border: `1px solid ${accent}40`, borderRadius: 20,
                padding: "2px 10px", fontSize: 11, fontWeight: 600,
              }}>
                {s.cards.length} seções
              </span>
            </div>
            <p style={{ margin: "5px 0 0", color: "#9ca3af", fontSize: 13 }}>{s.subtitulo}</p>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          height: 1,
          background: "linear-gradient(to right, transparent, #374151 30%, #374151 70%, transparent)",
          margin: "28px 0 32px",
        }} />

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {s.cards.map(c => <Card key={c.key} {...c} cor={s.cor} />)}
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", color: "#374151", fontSize: 11, marginTop: 36 }}>
          Use o menu lateral para navegar diretamente entre as seções
        </p>
      </div>
    </div>
  );
}
