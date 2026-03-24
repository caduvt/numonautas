`timescale 1ns/1ns

module tb_numonautas;

    // Declaração de sinais
    reg        clock;
    reg        reset;
    reg  [3:0] botoes;
    reg        btn_iniciar_ext;
    reg  [3:0] resposta_pc;
    reg        pc_pronto;

    wire       fpga_pronta;
    wire [3:0] leds;
    wire [3:0] db_nivel;
    wire [3:0] db_jogada;
    wire       fim_timer;
    wire       nivel_limite;
    wire       acertou;
    wire       errou;

    // Variável para loop
    integer i;

    // Instanciação do Módulo de Topo (DUT - Device Under Test)
    numonautas dut (
        .clock(clock),
        .reset(reset),
        .botoes(botoes),
        .btn_iniciar_ext(btn_iniciar_ext),
        .resposta_pc(resposta_pc),
        .pc_pronto(pc_pronto),
        .fpga_pronta(fpga_pronta),
        .leds(leds),
        .db_nivel(db_nivel),
        .db_jogada(db_jogada),
        .fim_timer(fim_timer),
        .nivel_limite(nivel_limite),
        .acertou(acertou),
        .errou(errou)
    );

    // Geração de Clock (50MHz -> período de 20ns)
    always #10 clock = ~clock;

    initial begin
        // Inicialização dos sinais
        clock = 0;
        reset = 0;
        botoes = 4'b0000;
        btn_iniciar_ext = 0;
        resposta_pc = 4'b0000;
        pc_pronto = 0;

        $display("Iniciando Cenário de Teste 1...");

        // Aplicando Reset Global
        reset = 1;
        #40;
        reset = 0;
        #40;

        // ---------------------------------------------------------
        // ETAPA 1: Inicialização (Apertar Iniciar)
        // ---------------------------------------------------------
        $display("[Etapa 1] Inicializando o jogo...");
        btn_iniciar_ext = 1; #40;
        btn_iniciar_ext = 0; #40;
        
        // Aguarda a máquina ir para ESPERA_PC e pedir a fase
        wait(fpga_pronta == 1);
        #20;

        // ---------------------------------------------------------
        // ETAPA 2: Envio de Gabarito (Resposta correta = 2)
        // ---------------------------------------------------------
        $display("[Etapa 2] Computador envia gabarito (2)...");
        envia_gabarito(4'b0010);

        // ---------------------------------------------------------
        // ETAPA 3: Resposta Incorreta (Jogador aperta 1)
        // ---------------------------------------------------------
        $display("[Etapa 3] Jogador erra (aperta 1)...");
        pressiona_botao(4'b0001);
        
        // Verifica se os LEDs acenderam indicando erro (1111)
        #40;
        if (leds == 4'b1111) $display("  -> OK: LEDs indicam erro!");
        else $display("  -> ERRO: LEDs nao acenderam 1111.");

        // ---------------------------------------------------------
        // ETAPA 4: Fim do Timer de Erro
        // ---------------------------------------------------------
        $display("[Etapa 4] Aguardando timer de erro...");
        wait(fim_timer == 1);
        #40;

        // ---------------------------------------------------------
        // ETAPA 5: Resposta Correta (Jogador aperta 2)
        // ---------------------------------------------------------
        $display("[Etapa 5] Jogador acerta (aperta 2)...");
        pressiona_botao(4'b0010);
        
        // Aguarda FPGA pedir nova fase (transição para Nível 2)
        wait(fpga_pronta == 1);
        #40;

        // ---------------------------------------------------------
        // ETAPA 6: Reset Home (Segurar botão Iniciar)
        // ---------------------------------------------------------
        $display("[Etapa 6] Segurando Iniciar para Reset Home...");
        btn_iniciar_ext = 1;
        // Aguarda o sinal interno reset_home subir (Independente do tamanho do M)
        wait(dut.dp.reset_home == 1); 
        #40;
        btn_iniciar_ext = 0;
        #40;

        // Dá um novo pulso no iniciar para recomeçar de verdade
        btn_iniciar_ext = 1; #40;
        btn_iniciar_ext = 0; #40;
        wait(fpga_pronta == 1);
        #20;

        // ---------------------------------------------------------
        // ETAPA 7 e 8: Avanço Rápido e Condição de Vitória (Nível 1 a 15)
        // ---------------------------------------------------------
        $display("[Etapa 7/8] Simulando acertos consecutivos ate a vitoria...");
        
        for (i = 1; i <= 14; i = i + 1) begin
            // Computador envia resposta (vamos usar 4'b0100 como gabarito padrão aqui)
            envia_gabarito(4'b0100);
            
            // Jogador acerta
            pressiona_botao(4'b0100);
            
            // Se não for o último nível, espera pedir a próxima fase
            if (i < 14) begin
                wait(fpga_pronta == 1);
                #20;
            end
        end

        // Verifica condição de Vitória
        #40;
        if (nivel_limite == 1) $display("  -> OK: Vitoria detectada! (nivel_limite = 1)");
        else $display("  -> ERRO: Vitoria nao detectada.");

        $display("Teste concluido!");
        $stop; // Pausa a simulação no ModelSim
    end

    // =========================================================
    // TASKS (Funções Auxiliares para limpar o código principal)
    // =========================================================

    // Simula o computador enviando o gabarito
    task envia_gabarito(input [3:0] gabarito);
        begin
            resposta_pc = gabarito;
            pc_pronto = 1;
            #40; // Mantém o sinal alto por alguns ciclos
            pc_pronto = 0;
            // Aguarda a máquina processar (sair do estado ESPERA_PC)
            #40; 
        end
    endtask

    // Simula o jogador pressionando um botão
    task pressiona_botao(input [3:0] btn);
        begin
            botoes = btn;
            #40; // Duração do "dedo" no botão (2 ciclos de clock)
            botoes = 4'b0000;
            // Aguarda a máquina processar o acerto/erro
            #40;
        end
    endtask

endmodule