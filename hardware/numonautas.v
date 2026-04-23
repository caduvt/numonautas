module numonautas (
    input        clock,

    // Entradas do Usuário
    input  [3:0] botoes,
    input        btn_iniciar_ext, // Iniciar e Reiniciar (segurar 3s)
    input        btn_som,
    input        btn_dificuldade,
    input        btn_animacoes,

    // novas entradas para a comunicação serial (RX e TX)
    input        RX,
    output       TX,  

    // Saídas de monitoramento e display
    output [3:0] leds,
    output [3:0] db_nivel,        // Mostra o nível atual (1 a 15)
    output [3:0] db_jogada,

    // Saídas de status
    output       fim_timer,
    output       nivel_limite,
    output       acertou,
    output       errou
);
    wire zera_jogo;
    wire aguarda_player;
    wire valida_res;
    wire proximo_nivel;
    wire sinaliza_erro;
    wire reset_home;
    wire captura_gabarito;
    wire s_vitoria;

    // Fios internos para conectar a serial
    wire [7:0] w_dados_rx;
    wire       w_pc_pronto;
    wire       w_fpga_pronta;

    reg power_on_reset = 1'b1;
    always @(posedge clock) power_on_reset <= 1'b0;

    // Fios internos para Event Manager
    wire pulso_som, pulso_difi, pulso_anim, pulso_iniciar;
    wire w_em_jogo;
    wire pulso_acertou, pulso_errou;
    wire pulso_r0, pulso_r1, pulso_r2, pulso_r3;
    wire w_tx_pronto;
    wire w_tx_partida;
    wire [7:0] w_tx_dados;

    // --- FIOS PARA SINAIS COM DEBOUNCE ---
    wire w_som_limpo, w_difi_limpo, w_anim_limpo, w_ini_limpo;
    wire pulso_fpga_pronta;
    wire [3:0] w_botoes_limpos;

// --- INSTANCIAÇÃO DOS DEBOUNCERS ---
    // MUDANÇA: Usar power_on_reset. Isso impede que eles criem transições falsas no reset do jogo.
    debounce db_som  (.clock(clock), .reset(power_on_reset), .botao_ruido(btn_som),         .botao_limpo(w_som_limpo));
    debounce db_difi (.clock(clock), .reset(power_on_reset), .botao_ruido(btn_dificuldade), .botao_limpo(w_difi_limpo));
    debounce db_anim (.clock(clock), .reset(power_on_reset), .botao_ruido(btn_animacoes),   .botao_limpo(w_anim_limpo));
    debounce db_ini  (.clock(clock), .reset(power_on_reset), .botao_ruido(btn_iniciar_ext), .botao_limpo(w_ini_limpo));

    debounce db_b0 (.clock(clock), .reset(power_on_reset), .botao_ruido(botoes[0]), .botao_limpo(w_botoes_limpos[0]));
    debounce db_b1 (.clock(clock), .reset(power_on_reset), .botao_ruido(botoes[1]), .botao_limpo(w_botoes_limpos[1]));
    debounce db_b2 (.clock(clock), .reset(power_on_reset), .botao_ruido(botoes[2]), .botao_limpo(w_botoes_limpos[2]));
    debounce db_b3 (.clock(clock), .reset(power_on_reset), .botao_ruido(botoes[3]), .botao_limpo(w_botoes_limpos[3]));

    // --- DETECTORES DE BORDA ---
    // MUDANÇA: Usar power_on_reset
    edge_detector ed_som (.clock(clock), .reset(power_on_reset), .sinal(w_som_limpo),  .pulso(pulso_som));
    edge_detector ed_difi(.clock(clock), .reset(power_on_reset), .sinal(w_difi_limpo), .pulso(pulso_difi));
    edge_detector ed_anim(.clock(clock), .reset(power_on_reset), .sinal(w_anim_limpo), .pulso(pulso_anim));
    edge_detector ed_ini (.clock(clock), .reset(power_on_reset), .sinal(w_ini_limpo),  .pulso(pulso_iniciar));
    
    // NOTA: Os detectores abaixo podem manter o reset_home, pois leem estados virtuais do jogo:
    edge_detector ed_acertou(.clock(clock), .reset(reset_home), .sinal(acertou), .pulso(pulso_acertou));
    edge_detector ed_errou  (.clock(clock), .reset(reset_home), .sinal(errou),   .pulso(pulso_errou));
// Instanciação do Queue Manager (Arbitra qual pacote eviar no TX)
    tx_event_manager event_manager (
        .clock(clock), 
        .reset(power_on_reset), // MUDANÇA AQUI: Mantém o módulo vivo para conseguir disparar a mensagem
        .em_jogo(w_em_jogo),
        .pulso_som(pulso_som), .pulso_dificuldade(pulso_difi), .pulso_animacoes(pulso_anim),
        .pulso_start(pulso_iniciar), 
        .pulso_reset(reset_home), // O reset_home entra AQUI, atuando só como um gatilho para enviar 0x05
        .pulso_proxima_fase(proximo_nivel),
        .pulso_acertou(pulso_acertou), .pulso_errou(pulso_errou),
        .tx_pronto(w_tx_pronto), .tx_partida(w_tx_partida), .tx_dados(w_tx_dados)
    );

    // ---> INSTÂNCIA DO RECEPTOR (RX) <---
    rx_serial_8N1 receptor (
        .clock      (clock),
        .reset      (power_on_reset), // MUDANÇA AQUI
        .RX         (RX),
        .dados_ascii(w_dados_rx),
        .pronto     (w_pc_pronto) 
    );

    // ---> INSTÂNCIA DO TRANSMISSOR (TX) <---
    tx_serial_8N1 transmissor (
        .clock       (clock),
        .reset       (power_on_reset), // MUDANÇA AQUI
        .partida     (w_tx_partida),
        .dados_ascii (w_tx_dados),
        .saida_serial(TX),
        .pronto      (w_tx_pronto)
    );
    
    unidade_controle uc (
        .clock(clock),
        .reset_home(reset_home), 
        .btn_iniciar(pulso_iniciar),
        .pc_pronto(w_pc_pronto), //nova conexão do sinal pc_pronto vindo do receptor serial
        .acertou(acertou),
        .errou(errou),
        .nivel_limite(nivel_limite),
        .fim_timer(fim_timer),
        .zera_jogo(zera_jogo),
        .fpga_pronta(w_fpga_pronta), //nova conexão do sinal fpga_pronta para o transmissor serial
        .em_jogo(w_em_jogo),         //Indica se a config está bloqueada
        .captura_gabarito(captura_gabarito),
        .aguarda_player(aguarda_player),
        .valida_res(valida_res),
        .proximo_nivel(proximo_nivel),
        .sinaliza_erro(sinaliza_erro),
        .vitoria(s_vitoria)
    );
    
    fluxo_dados dp (
        .clock(clock),
        .zera_jogo(zera_jogo),
        .aguarda_player(aguarda_player),
        .valida_res(valida_res),
        .proximo_nivel(proximo_nivel),
        .sinaliza_erro(sinaliza_erro),
        .captura_gabarito(captura_gabarito),
        
        // CORREÇÕES AQUI:
        .botoes(w_botoes_limpos),       // Entrega os botões limpos e já em lógica positiva
        .btn_iniciar_ext(w_ini_limpo),  // Entrega o botão start limpo pro Timer de 3s
        
        .resposta_pc(w_dados_rx),
        .leds(leds),
        .db_nivel(db_nivel),
        .db_jogada(db_jogada),
        .reset_home(reset_home),
        .fim_timer(fim_timer),
        .nivel_limite(nivel_limite),
        .acertou(acertou),
        .errou(errou)
    );
endmodule