module fluxo_dados (
    input        clock,
    input        reset,

    // Sinais de Controle (vindos da UC)
    input        zera_jogo,
    input        configura_params,
    input        gera_fase,
    input        mostra_equacao,
    input        aguarda_player,
    input        valida_res,
    input        proximo_nivel,
    input        sinaliza_erro,
    input        escreve_mem,
    
    // Entradas do Usuário
    input  [3:0] botoes,
    input        btn_iniciar_ext,
    input        btn_confirma_som_ext,
    input        btn_confirma_dif_ext,
    input        btn_reiniciar_ext,
    
    // Status (enviados para a UC)
    output       btn_iniciar,
    output       confirma_som_luz,
    output       confirma_dif,
    output       pronto,
    output       resposta,
    output       acertou,
    output       errou,
    output       nivel_limite,
    output       fim_timer,
    output       reiniciar,

    // Saídas de monitoramento e display
    output [3:0] leds,
    output [3:0] db_nivel,
    output [3:0] db_jogada,
    output reset_home,
);

    // Fios internos
    wire [3:0] s_memoria_out;
    wire [3:0] s_registrador_out;
    wire [3:0] s_contador_nivel;
    wire [3:0] s_contador_endereco;
    wire s_igual;
    wire s_jogada_feita;
    wire s_fio_led;
    wire [3:0] s_sinal_leds;

    // --- Mapeamento de Status para a UC ---
    assign btn_iniciar      = btn_iniciar_ext;
    assign confirma_som_luz = btn_confirma_som_ext;
    assign confirma_dif     = btn_confirma_dif_ext;
    assign reiniciar        = btn_reiniciar_ext;
    assign resposta         = s_jogada_feita;
    assign acertou          = s_igual;
    assign errou            = ~s_igual;
    assign pronto           = 1'b1; // No modelo simples, a fase é gerada instantaneamente

    // --- Componentes do Datapath ---

    // 1. Detector de Jogada (Edge Detector)
    // Detecta quando o usuário pressiona qualquer botão
    edge_detector detector (
        .clock(clock),
        .reset(zera_jogo),
        .sinal(|botoes),
        .pulso(s_jogada_feita)
    );

    // 2. Contador de Nível (Equivale ao "Check_LVL") [cite: 8]
    contador_163 contador_lvl (
        .clock(clock),
        .clr(~zera_jogo),
        .ld(1'b1),
        .enp(proximo_nivel),
        .ent(1'b1),
        .D(4'h0),
        .Q(s_contador_nivel),
        .rco(nivel_limite)
    );

    // 3. Registrador da Resposta do Usuário [cite: 9]
    registrador_4 reg_jogada (
        .clock(clock),
        .clear(zera_jogo),
        .enable(aguarda_player && s_jogada_feita),
        .D(botoes),
        .Q(s_registrador_out)
    );

    // 4. Memória RAM (Armazena a fase/equação) 
    sync_ram_16x4_file memoria (
        .clk(clock),
        .we(escreve_mem || gera_fase), // Escreve durante a geração ou configuração
        .data(botoes), 
        .addr(s_contador_nivel), // Usa o nível como endereço
        .q(s_memoria_out)
    );

    // 5. Comparador (Valida a Resposta) [cite: 11]
    comparador_85 comparador_res (
        .A(s_memoria_out),
        .B(s_registrador_out),
        .AEBi(1'b1), .AGBi(1'b0), .ALBi(1'b0),
        .AEBo(s_igual), .ALBo(), .AGBo()
    );

    // 6. Timer de Exibição (fim_timer) 
    // Usado para o estado MOSTRA_RES ou tempo de exibição da fase
    contador_m #(.M(2000), .N(11)) timer_exibicao (
        .clock(clock),
        .zera_as(1'b0),
        .zera_s(zera_jogo || proximo_nivel),
        .conta(mostra_equacao || sinaliza_erro),
        .fim(fim_timer),
        .meio(),
        .Q()
    );

    contador_m #(.M(3000), .N(28)) timer_reset_3s (
    .clock(clock),
    .zera_as(1'b0),
    .zera_s(~btn_iniciar_ext || zera_jogo), // Zera se soltar o botão ou se já estiver no INICIO
    .conta(btn_iniciar_ext),                // Conta enquanto o botão estiver segurado
    .fim(reset_home),                       // Sinaliza quando atingir 3 segundos
    .meio(),
    .Q()
);

    // 7. Lógica de Display LEDs (cor única) [cite: 16, 17]
    // Seleciona o que mostrar nos LEDs baseado no estado da UC
    assign s_sinal_leds = (sinaliza_erro) ? 4'b1111 : // Tudo aceso em erro
                          (mostra_equacao) ? s_memoria_out : 
                          s_registrador_out;

    assign s_fio_led = (mostra_equacao || sinaliza_erro || aguarda_player);

    // Liga cada LED individualmente quando o sinal correspondente está ativo
    assign leds = s_fio_led ? s_sinal_leds : 4'b0000;

    // Saídas de Debug [cite: 18]
    assign db_nivel = s_contador_nivel;
    assign db_jogada = s_registrador_out;

endmodule