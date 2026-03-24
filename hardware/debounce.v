module debounce (
    input wire clock,
    input wire reset,
    input wire botao_ruido,
    output reg botao_limpo
);

    parameter DELAY = 100000; // Ajustar conforme testes

    reg [$clog2(DELAY)-1:0] counter;
    reg botao_sync;

    always @(posedge clock or posedge reset) begin
        if (reset) begin
            counter <= 0;
            botao_sync <= 0;
            botao_limpo <= 0;
        end else begin
            // Sincroniza o botão com o clock
            botao_sync <= botao_ruido;

            // Incrementa o contador enquanto o botão está estável
            if (botao_sync == botao_limpo) begin
                counter <= 0;
            end else begin
                counter <= counter + 1;
                // Ai, se o contador atingir nosso threshhold, a saída é atualizada
                if (counter == DELAY) begin
                    botao_limpo <= botao_sync;
                end
            end
        end
    end

endmodule
