module tx_event_manager (
    input        clock,
    input        reset,
    
    // Sinais de Gatilho (Pulsos de 1 clock)
    input        pulso_som,
    input        pulso_dificuldade,
    input        pulso_animacoes,
    input        pulso_start,
    input        pulso_reset, // (segurar 3s)
    
    // Pedir Próxima Fase (Vem da FPGA pronta)
    input        pulso_proxima_fase,
    
    // Respostas (Gabarito clicado - pulsos)
    input        pulso_resp_0,
    input        pulso_resp_1,
    input        pulso_resp_2,
    input        pulso_resp_3,

    // Interface com TX Serial
    input        tx_pronto,
    output reg       tx_partida,
    output reg [7:0] tx_dados
);

    // Registradores para guardar eventos pendentes (Flags)
    reg flag_som, flag_dificuldade, flag_animacoes, flag_start, flag_reset;
    reg flag_proxima_fase;
    reg flag_resp_0, flag_resp_1, flag_resp_2, flag_resp_3;

    // Estado do Gerenciador
    reg [1:0] estado;
    localparam ESPERA = 2'b00, ENVIA = 2'b01, AGUARDA_TX_BAIXAR = 2'b10, AGUARDA_TX_SUBIR = 2'b11;

    always @(posedge clock or posedge reset) begin
        if (reset) begin
            flag_som <= 0;
            flag_dificuldade <= 0;
            flag_animacoes <= 0;
            flag_start <= 0;
            flag_reset <= 0;
            flag_proxima_fase <= 0;
            flag_resp_0 <= 0;
            flag_resp_1 <= 0;
            flag_resp_2 <= 0;
            flag_resp_3 <= 0;
            
            estado <= ESPERA;
            tx_partida <= 0;
            tx_dados <= 8'h00;
        end else begin
            // 1. Capturar qualquer pulso assíncrono (em relação ao TX) e guardar
            if (pulso_som)          flag_som <= 1;
            if (pulso_dificuldade)  flag_dificuldade <= 1;
            if (pulso_animacoes)    flag_animacoes <= 1;
            if (pulso_start)        flag_start <= 1;
            if (pulso_reset)        flag_reset <= 1;
            if (pulso_proxima_fase) flag_proxima_fase <= 1;
            
            if (pulso_resp_0)       flag_resp_0 <= 1;
            if (pulso_resp_1)       flag_resp_1 <= 1;
            if (pulso_resp_2)       flag_resp_2 <= 1;
            if (pulso_resp_3)       flag_resp_3 <= 1;

            // 2. Máquina de Estados para Despacho
            case (estado)
                ESPERA: begin
                    if (tx_pronto) begin
                        // Arbitragem por prioridade
                        if (flag_proxima_fase) begin
                            tx_dados <= 8'hC0; // 1100 0000
                            flag_proxima_fase <= 0;
                            tx_partida <= 1;
                            estado <= ENVIA;
                        end
                        else if (flag_resp_0) begin
                            tx_dados <= 8'h80; // 1000 0000
                            flag_resp_0 <= 0;
                            tx_partida <= 1;
                            estado <= ENVIA;
                        end
                        else if (flag_resp_1) begin
                            tx_dados <= 8'h81; // 1000 0001
                            flag_resp_1 <= 0;
                            tx_partida <= 1;
                            estado <= ENVIA;
                        end
                        else if (flag_resp_2) begin
                            tx_dados <= 8'h82; // 1000 0010
                            flag_resp_2 <= 0;
                            tx_partida <= 1;
                            estado <= ENVIA;
                        end
                        else if (flag_resp_3) begin
                            tx_dados <= 8'h83; // 1000 0011
                            flag_resp_3 <= 0;
                            tx_partida <= 1;
                            estado <= ENVIA;
                        end
                        else if (flag_reset) begin
                            tx_dados <= 8'h20; // 0010 0000
                            flag_reset <= 0;
                            tx_partida <= 1;
                            estado <= ENVIA;
                        end
                        else if (flag_start) begin
                            tx_dados <= 8'h10; // 0001 0000
                            flag_start <= 0;
                            tx_partida <= 1;
                            estado <= ENVIA;
                        end
                        else if (flag_animacoes) begin
                            tx_dados <= 8'h08; // 0000 1000
                            flag_animacoes <= 0;
                            tx_partida <= 1;
                            estado <= ENVIA;
                        end
                        else if (flag_dificuldade) begin
                            tx_dados <= 8'h04; // 0000 0100
                            flag_dificuldade <= 0;
                            tx_partida <= 1;
                            estado <= ENVIA;
                        end
                        else if (flag_som) begin
                            tx_dados <= 8'h02; // 0000 0010
                            flag_som <= 0;
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
