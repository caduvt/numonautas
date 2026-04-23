/* -------------------------------------------------------------
 * Arquivo   : tx_serial_8N1_fd.v
 *--------------------------------------------------------------
 * Descricao : fluxo de dados do circuito base de transmissao 
 *             serial assincrona (8N1) 
 *             ==> contem deslocador com 11 bits e contador
 *                 modulo 11
 *--------------------------------------------------------------
 */
 
 module tx_serial_8N1_fd (
    input        clock        ,
    input        reset        ,
    input        zera         ,
    input        conta        ,
    input        carrega      ,
    input        desloca      ,
    input  [7:0] dados_ascii  , 
    output       saida_serial ,
    output       fim
);

    wire [10:0] s_dados;
    wire [10:0] s_saida;

    // Composição dos dados seriais (Padrão 8N1)
    assign s_dados[0]   = 1'b1;              // bit de repouso (idle)
    assign s_dados[1]   = 1'b0;              // start bit
    assign s_dados[9:2] = dados_ascii[7:0];  // 8 bits de dados
    assign s_dados[10]  = 1'b1;              // 1 stop bit no final
  
    // Instanciação do deslocador_n
    deslocador_n #(
        .N(11) 
    ) U1 (
        .clock         (clock  ),
        .reset         (reset  ),
        .carrega       (carrega),
        .desloca       (desloca),
        .entrada_serial(1'b1   ), 
        .dados         (s_dados),
        .saida         (s_saida)
    );
    
    // Instanciação do contador_m
    contador_m #(
        .M(11),
        .N(4)
    ) U2 (
        .clock   (clock),
        .zera_as (1'b0 ),
        .zera_s  (zera ),
        .conta   (conta),
        .Q       (     ), // porta Q em aberto
        .fim     (fim  ),
        .meio    (     )  // porta meio em aberto
    );
    
    // Saida serial do transmissor (desloca pelo LSB)
    assign saida_serial = s_saida[0];
  
endmodule