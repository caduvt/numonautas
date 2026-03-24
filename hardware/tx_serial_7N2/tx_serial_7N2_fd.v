/* -------------------------------------------------------------
 * Arquivo   : tx_serial_7N2_fd.v
 *--------------------------------------------------------------
 * Descricao : fluxo de dados do circuito base de transmissao 
 *             serial assincrona (7N2) 
 *             ==> contem deslocador com 11 bits e contador
 *                 modulo 12
 * 
 *--------------------------------------------------------------
 * Revisoes  :
 *     Data        Versao  Autor             Descricao
 *     30/08/2025  1.0     Edson Midorikawa  criacao
 *--------------------------------------------------------------
 */
 
 module tx_serial_7N2_fd (
    input        clock        ,
    input        reset        ,
    input        zera         ,
    input        conta        ,
    input        carrega      ,
    input        desloca      ,
    input  [7:0] dados_ascii  , //mudança aqui
    output       saida_serial ,
    output       fim
);

    wire [10:0] s_dados;
    wire [10:0] s_saida;

    // composicao dos dados seriais
    assign s_dados[0]   = 1'b1;              // repouso [cite: 124, 125]
    assign s_dados[1]   = 1'b0;              // start bit [cite: 126]
    assign s_dados[9:2] = dados_ascii[7:0];  // 8 bits de dados (antes era [6:0] e ocupava [8:2]) [cite: 127]
    assign s_dados[10]  = 1'b1;              // apenas 1 stop bit no final [cite: 128]
  
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
        .M(11), // Era 12 
        .N(4)
    ) U2 (
        .clock   (clock),
        .zera_as (1'b0 ),
        .zera_s  (zera ),
        .conta   (conta),
        .Q       (     ), // porta Q em aberto (desconectada)
        .fim     (fim  ),
        .meio    (     )  // porta meio em aberto (desconectada)
    );
    
    // Saida serial do transmissor
    assign saida_serial = s_saida[0];
  
endmodule
