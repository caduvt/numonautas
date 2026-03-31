module numonautas (
    input        clock,
    input        reset,

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

    // Fios internos para Event Manager
    wire pulso_som, pulso_difi, pulso_anim, pulso_iniciar;
    wire w_em_jogo;
    wire pulso_acertou, pulso_errou;
    wire pulso_r0, pulso_r1, pulso_r2, pulso_r3;
    wire w_tx_pronto;
    wire w_tx_partida;
    wire [7:0] w_tx_dados;

    // Detectores de borda p/ enviar cliques
    edge_detector ed_som(.clock(clock), .reset(reset), .sinal(btn_som), .pulso(pulso_som));
    edge_detector ed_difi(.clock(clock), .reset(reset), .sinal(btn_dificuldade), .pulso(pulso_difi));
    edge_detector ed_anim(.clock(clock), .reset(reset), .sinal(btn_animacoes), .pulso(pulso_anim));
    edge_detector ed_ini(.clock(clock), .reset(reset), .sinal(btn_iniciar_ext), .pulso(pulso_iniciar));
    
    // Antigos edge detectors dos botoes foram removidos porque a comparacao agora
    // gera o pulso de acerto/erro depois do processamento, entao checamos as transicoes deles.
    edge_detector ed_acertou(.clock(clock), .reset(reset), .sinal(acertou), .pulso(pulso_acertou));
    edge_detector ed_errou(.clock(clock), .reset(reset), .sinal(errou), .pulso(pulso_errou));

    // Instanciação do Queue Manager (Arbitra qual pacote eviar no TX)
    tx_event_manager event_manager (
        .clock(clock), .reset(reset),
        .em_jogo(w_em_jogo),
        .pulso_som(pulso_som), .pulso_dificuldade(pulso_difi), .pulso_animacoes(pulso_anim),
        .pulso_start(pulso_iniciar), .pulso_reset(reset_home), // reset_home gerado na holding de 3s do btn
        .pulso_proxima_fase(w_fpga_pronta),
        .pulso_acertou(pulso_acertou), .pulso_errou(pulso_errou),
        .tx_pronto(w_tx_pronto), .tx_partida(w_tx_partida), .tx_dados(w_tx_dados)
    );

    // ---> INSTÂNCIA DO RECEPTOR (RX) <---
    // Ele escuta o pino RX e gera o gabarito e o aviso de pc_pronto
    rx_serial_8N1 receptor (
        .clock      (clock),
        .reset      (reset),
        .RX         (RX),
        .dados_ascii(w_dados_rx),
        .pronto     (w_pc_pronto) // O RX avisa que chegou os dados do PC
    );

    // ---> INSTÂNCIA DO TRANSMISSOR (TX) <---
    // A FPGA usa ele para avisar o PC de status, de request e botoes config
    tx_serial_7N2 transmissor (
        .clock       (clock),
        .reset       (reset),
        .partida     (w_tx_partida),
        .dados_ascii (w_tx_dados),
        .saida_serial(TX),
        .pronto      (w_tx_pronto)
    );
    
    unidade_controle uc (
        .clock(clock),
        .reset(reset),
        .reset_home(reset_home), 
        .btn_iniciar(btn_iniciar_ext),
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
        .reset(reset),
        .zera_jogo(zera_jogo),
        .aguarda_player(aguarda_player),
        .valida_res(valida_res),
        .proximo_nivel(proximo_nivel),
        .sinaliza_erro(sinaliza_erro),
        .captura_gabarito(captura_gabarito),
        .botoes(botoes),
        .btn_iniciar_ext(btn_iniciar_ext),
        .resposta_pc(w_dados_rx), //passa os 8 bits
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