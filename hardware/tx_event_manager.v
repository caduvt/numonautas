module tx_event_manager (
    input        clock,
    input        reset,
    
    // Status lock state
    input        em_jogo,
    
    // Sinais de Gatilho (Pulsos de 1 clock)
    input        pulso_som,
    input        pulso_dificuldade,
    input        pulso_animacoes,
    input        pulso_start,
    input        pulso_reset, // (segurar 3s)
    
    // Sinais de jogo
    input        pulso_proxima_fase,
    input        pulso_acertou,
    input        pulso_errou,

    // Interface com TX Serial
    input        tx_pronto,
    output reg       tx_partida,
    output reg [7:0] tx_dados
);

    // Registradores de Configuração (Estado)
    reg reg_som;
    reg reg_anim;
    reg [1:0] reg_difi;

    // Registradores para guardar eventos pendentes (Flags)
    reg flag_som, flag_dificuldade, flag_animacoes, flag_start, flag_reset;
    reg flag_proxima_fase;
    reg flag_acertou, flag_errou;

    // Estado do Gerenciador de TX
    reg [1:0] estado;
    localparam ESPERA = 2'b00, ENVIA = 2'b01, AGUARDA_TX_BAIXAR = 2'b10, AGUARDA_TX_SUBIR = 2'b11;

    always @(posedge clock or posedge reset) begin
        if (reset) begin
            reg_som <= 1'b1;     // Padrão Ligado
            reg_anim <= 1'b1;    // Padrão Ligado
            reg_difi <= 2'b00;   // Fácil
            
            flag_som <= 0;
            flag_dificuldade <= 0;
            flag_animacoes <= 0;
            flag_start <= 0;
            flag_reset <= 0;
            flag_proxima_fase <= 0;
            flag_acertou <= 0;
            flag_errou <= 0;
            
            estado <= ESPERA;
            tx_partida <= 0;
            tx_dados <= 8'h00;
        end else begin
            // 1. Atualizar configs internamente e setar flag para atualizar o PC
            // Apenas se NÃO estiver em jogo (!em_jogo)
            if (!em_jogo) begin
                if (pulso_som) begin
                    reg_som <= ~reg_som;
                    flag_som <= 1;
                end
                if (pulso_animacoes) begin
                    reg_anim <= ~reg_anim;
                    flag_animacoes <= 1;
                end
                if (pulso_dificuldade) begin
                    if (reg_difi == 2'd2) reg_difi <= 2'd0;
                    else                  reg_difi <= reg_difi + 2'd1;
                    flag_dificuldade <= 1;
                end
            end

            // 2. Capturar outros eventos de jogo e comando
            if (pulso_start)        flag_start <= 1;
            if (pulso_reset)        flag_reset <= 1;
            if (pulso_proxima_fase) flag_proxima_fase <= 1;
            if (pulso_acertou)      flag_acertou <= 1;
            if (pulso_errou)        flag_errou <= 1;

            // 3. Máquina de Estados para Despacho via TX Serial
            case (estado)
                ESPERA: begin
                    if (tx_pronto) begin
                        // Arbitragem por prioridade
                        if (flag_reset) begin
                            tx_dados <= {reg_som, reg_anim, reg_difi, 4'b0101};
                            flag_reset <= 0;
                            tx_partida <= 1;
                            estado <= ENVIA;
                        end
                        else if (flag_start) begin
                            tx_dados <= {reg_som, reg_anim, reg_difi, 4'b0001};
                            flag_start <= 0;
                            tx_partida <= 1;
                            estado <= ENVIA;
                        end
                        else if (flag_proxima_fase) begin
                            tx_dados <= {reg_som, reg_anim, reg_difi, 4'b0010};
                            flag_proxima_fase <= 0;
                            tx_partida <= 1;
                            estado <= ENVIA;
                        end
                        else if (flag_acertou) begin
                            tx_dados <= {reg_som, reg_anim, reg_difi, 4'b0011};
                            flag_acertou <= 0;
                            tx_partida <= 1;
                            estado <= ENVIA;
                        end
                        else if (flag_errou) begin
                            tx_dados <= {reg_som, reg_anim, reg_difi, 4'b0100};
                            flag_errou <= 0;
                            tx_partida <= 1;
                            estado <= ENVIA;
                        end
                        else if (flag_som || flag_animacoes || flag_dificuldade) begin
                            tx_dados <= {reg_som, reg_anim, reg_difi, 4'b0000};
                            // Limpa qualquer flag de config pendente
                            flag_som <= 0;
                            flag_animacoes <= 0;
                            flag_dificuldade <= 0;
                            tx_partida <= 1;
                            estado <= ENVIA;
                        end
                    end
                end

                ENVIA: begin
                    // Partida já subiu um clock
                    tx_partida <= 0;
                    estado <= AGUARDA_TX_BAIXAR;
                end

                AGUARDA_TX_BAIXAR: begin
                    // Espera tx_pronto cair para confirmar que iniciou
                    if (!tx_pronto) estado <= AGUARDA_TX_SUBIR;
                end
                
                AGUARDA_TX_SUBIR: begin
                    // Espera tx_pronto subir para liberar o próximo envio
                    if (tx_pronto) estado <= ESPERA;
                end
            endcase
        end
    end

endmodule
