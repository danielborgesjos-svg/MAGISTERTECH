# Entrega: Estrutura Organizacional e Fluxos

O novo painel de Organograma foi reescrito **do zero** para garantir que sua visualização da equipe seja totalmente limpa (sem tela branca) e altamente funcional para a Gestão de Contratos e Setores.

## 1. Múltiplas Visões Interativas

Criamos três modos distintos de visualização, disponíveis via Switcher no topo do módulo da equipe:

1. **Organograma (Hierárquico):** Exibe o CEO (diretoria) acima, os Gestores intermediários e alinhados num grid, todos agrupados pelo Setor (`CRIATIVO`, `TECNOLOGIA`, `COMERCIAL` etc).
2. **Fluxograma (Processos):** Uma apresentação visual do pipeline oficial que descreve os "7 Passos" desde o chumbamento e _Onboarding_ até a conclusão da "Produção e Relatórios".
3. **Lista por Setor:** Visão compacta tipo lista colapsável, excelente para achar um membro rápido se a agência ficar superlotada.

## 2. Alocação de Contratos (Admin Master)

Usuários que são `ADMIN` ou `CEO` agora têm acesso ao botão **Editar** sobre qualquer cartão no Diagrama. O painel modal de edição garante:

> [!IMPORTANT]
> **O Poder do Master**
> - **Mudança de Setor:** Você pode definir "CRIATIVO", "CONTEÚDO" alterando-os sob demanda via texto, e ele recriará o setor no diagrama instantaneamente!
> - **Atribuição de Contratos:** Traz todos os clientes em lista de checkboxes. Tudo que é assinalado a uma pessoa reflete diretamente no card dela que "X e Y são sob a responsabilidade" dessa pessoa.

## 3. Dinamismo de Backend

- O Backend (`server.ts`: Rota de update `PUT` do user) foi reprogramado para injetar **bio**, modificar **sector** e colocar o array selecionado **contracts** encapsulado de forma engenhosa no campo json de *preferences*, garantindo a persistência.
- O Frontend usa o React `useContext(DataContext)` com uma nova função assíncrona `refreshTeam()`, para que ao trocar um funcionário de setor, a tela atualize realocando-o na hora. 

Agora a estrutura da empresa escala com seu negócio sem nenhum *crash*. Sugiro checar a tela de Organograma na viação Local e mudar alguem de setor para ver a mágica estrutural se refazendo!
