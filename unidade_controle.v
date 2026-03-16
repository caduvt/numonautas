module unidade_controle (
    input        clock,
    input        reset,
    // Sinais de entrada (Condições de transição do diagrama)
    input        btn_iniciar,      // Botão Iniciar
    input        confirma_som_luz, // Confirma Som e Luz
    input        confirma_dif,     // Confirma Dificuldade
    input        pronto,           // Sinal de fase gerada / pronto
    input        resposta,         // Usuário enviou resposta
    input        acertou,          // Resultado do processamento: Acerto
    input        errou,            // Resultado do processamento: Erro
    input        nivel_limite,     // Nível == Limite
    input        fim_timer,        // Fim do tempo de exibição do erro
    input        reiniciar,        // Voltar ao início após vitória
    input        reset_home,
    
    // Sinais de saída (Controle do Datapath)
    output reg   zera_jogo,
    output reg   configura_params,
    output reg   gera_fase,
    output reg   mostra_equacao,
    output reg   aguarda_player,
    output reg   valida_res,
    output reg   proximo_nivel,
    output reg   sinaliza_erro,
    output reg   vitoria,
    output reg [3:0] db_estado     // Depuração
);

    // Definição dos Estados baseada no Diagrama
    localparam INICIO           = 4'd0,
               CONFIG_AUDIO_LUZ = 4'd1,
               CONFIG_DIF       = 4'd2,
               GERAR_FASE       = 4'd3,
               MOSTRAR_EQ       = 4'd4,
               AGUARDAR_INPUT   = 4'd5,
               PROCESSAR_RES    = 4'd6,
               ACERTO           = 4'd7,
               ERRO             = 4'd8,
               CHECK_LVL        = 4'd9,
               MOSTRA_RES       = 4'd10,
               FINAL_VITORIA    = 4'd11;

    reg [3:0] Eatual, Eprox;

    // Memória de Estado
    always @(posedge clock or posedge reset) begin
        if (reset || reset_home) Eatual <= INICIO;
        else       Eatual <= Eprox;
    end

    // Lógica de Próximo Estado
    always @(*) begin
        case (Eatual)
            INICIO:           Eprox = btn_iniciar ? CONFIG_AUDIO_LUZ : INICIO;
            
            CONFIG_AUDIO_LUZ: Eprox = confirma_som_luz ? CONFIG_DIF : CONFIG_AUDIO_LUZ;
            
            CONFIG_DIF:       Eprox = confirma_dif ? GERAR_FASE : CONFIG_DIF;
            
            GERAR_FASE:       Eprox = pronto ? MOSTRAR_EQ : GERAR_FASE;
            
            MOSTRAR_EQ:       Eprox = AGUARDAR_INPUT; // Transição direta ou por sinal interno
            
            AGUARDAR_INPUT:   Eprox = resposta ? PROCESSAR_RES : AGUARDAR_INPUT;
            
            PROCESSAR_RES: begin
                if (acertou)      Eprox = ACERTO;
                else if (errou)   Eprox = ERRO;
                else              Eprox = PROCESSAR_RES;
            end
            
            ACERTO:           Eprox = CHECK_LVL;
            
            ERRO:             Eprox = MOSTRA_RES;
            
            CHECK_LVL:        Eprox = nivel_limite ? FINAL_VITORIA : GERAR_FASE;
            
            MOSTRA_RES:       Eprox = fim_timer ? AGUARDAR_INPUT : MOSTRA_RES;
            
            FINAL_VITORIA:    Eprox = reiniciar ? INICIO : FINAL_VITORIA;
            
            default:          Eprox = INICIO;
        endcase
    end

    // Lógica de Saída (Sinais de Controle)
    always @(*) begin
        // Valores padrão para evitar latches
        zera_jogo = 0; configura_params = 0; gera_fase = 0; 
        mostra_equacao = 0; aguarda_player = 0; valida_res = 0; 
        proximo_nivel = 0; sinaliza_erro = 0; vitoria = 0;
        db_estado = Eatual;

        case (Eatual)
            INICIO: begin
                zera_jogo = 1;
            end
            
            CONFIG_AUDIO_LUZ, CONFIG_DIF: begin
                configura_params = 1;
            end
            
            GERAR_FASE: begin
                gera_fase = 1;
            end
            
            MOSTRAR_EQ: begin
                mostra_equacao = 1;
            end
            
            AGUARDAR_INPUT: begin
                aguarda_player = 1;
            end
            
            PROCESSAR_RES: begin
                valida_res = 1;
            end
            
            ACERTO: begin
                proximo_nivel = 1;
            end
            
            ERRO: begin
                sinaliza_erro = 1;
            end
            
            FINAL_VITORIA: begin
                vitoria = 1;
            end
        endcase
    end

endmodule