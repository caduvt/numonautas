module numonautas (
    input        clock,
    input        reset,

    // Entradas do Usuário
    input  [3:0] botoes,
    input        btn_iniciar_ext,
    input        btn_confirma_som_ext,
    input        btn_confirma_dif_ext,
    input        btn_reiniciar_ext,

    // Saídas de monitoramento e display
    output [3:0] leds,
    output [3:0] db_nivel,
    output [3:0] db_jogada,

    // Saídas de status
    output       fim_timer,
    output       nivel_limite,
    output       acertou,
    output       errou
);

    // Fios internos
    wire zera_jogo;
    wire configura_params;
    wire gera_fase;
    wire mostra_equacao;
    wire aguarda_player;
    wire valida_res;
    wire proximo_nivel;
    wire sinaliza_erro;
    wire escreve_mem;

    // Instanciação da Unidade de Controle
    unidade_controle uc (
        .clock(clock),
        .reset(reset),
        .btn_iniciar(btn_iniciar_ext),
        .confirma_som(btn_confirma_som_ext),
        .confirma_dif(btn_confirma_dif_ext),
        .reiniciar(btn_reiniciar_ext),
        .zera_jogo(zera_jogo),
        .configura_params(configura_params),
        .gera_fase(gera_fase),
        .mostra_equacao(mostra_equacao),
        .aguarda_player(aguarda_player),
        .valida_res(valida_res),
        .proximo_nivel(proximo_nivel),
        .sinaliza_erro(sinaliza_erro),
        .escreve_mem(escreve_mem)
    );

    // Instanciação do Fluxo de Dados
    fluxo_dados dp (
        .clock(clock),
        .reset(reset),
        .zera_jogo(zera_jogo),
        .configura_params(configura_params),
        .gera_fase(gera_fase),
        .mostra_equacao(mostra_equacao),
        .aguarda_player(aguarda_player),
        .valida_res(valida_res),
        .proximo_nivel(proximo_nivel),
        .sinaliza_erro(sinaliza_erro),
        .escreve_mem(escreve_mem),
        .botoes(botoes),
        .btn_iniciar(btn_iniciar_ext),
        .btn_confirma_som_ext(btn_confirma_som_ext),
        .btn_confirma_dif_ext(btn_confirma_dif_ext),
        .btn_reiniciar_ext(btn_reiniciar_ext),
        .leds(leds),
        .db_nivel(db_nivel),
        .db_jogada(db_jogada),
        .fim_timer(fim_timer),
        .nivel_limite(nivel_limite),
        .acertou(acertou),
        .errou(errou)
    );

endmodule