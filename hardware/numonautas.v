module numonautas (
    input        clock,
    input        reset,

    // Entradas do Usuário
    input  [3:0] botoes,
    input        btn_iniciar_ext, // Iniciar e Reiniciar (segurar 3s)

    // Interface com o Notebook
    input  [3:0] resposta_pc,     // Gabarito enviado pelo PC
    input        pc_pronto,    

    // novas entradas para a comunicação serial (RX e TX)
    input        RX,
    output       TX,  
    // PC avisa que o gabarito é válido
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
    wire s_vitoria;

    // Fios internos para conectar a serial
    wire [7:0] w_dados_rx;
    wire       w_pc_pronto;
    wire       w_fpga_pronta;

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
    // A FPGA usa ele para avisar o PC que quer uma nova fase
    tx_serial_7N2 transmissor (
        .clock       (clock),
        .reset       (reset),
        .partida     (w_fpga_pronta), // A UC dá o gatilho
        .dados_ascii (8'h50),         // Manda a letra 'P' (0x50 em HEX) para o PC
        .saida_serial(TX),
        .pronto      ()
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