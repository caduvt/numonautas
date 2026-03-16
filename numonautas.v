module numonautas (
    input        clock,
    input        reset,

    // Entradas do Usuário
    input  [3:0] botoes,
    input        btn_iniciar_ext, // Iniciar e Reiniciar (segurar 3s)

    // Interface com o Notebook
    input  [3:0] resposta_pc,     // Gabarito enviado pelo PC
    input        pc_pronto,       // PC avisa que o gabarito é válido
    output       fpga_pronta,     // FPGA pede a próxima fase ao PC

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

    unidade_controle uc (
        .clock(clock),
        .reset(reset),
        .reset_home(reset_home), 
        .btn_iniciar(btn_iniciar_ext),
        .pc_pronto(pc_pronto),
        .acertou(acertou),
        .errou(errou),
        .nivel_limite(nivel_limite),
        .fim_timer(fim_timer),
        .zera_jogo(zera_jogo),
        .fpga_pronta(fpga_pronta),
        .captura_gabarito(captura_gabarito),
        .aguarda_player(aguarda_player),
        .valida_res(valida_res),
        .proximo_nivel(proximo_nivel),
        .sinaliza_erro(sinaliza_erro)
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
        .resposta_pc(resposta_pc),
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


