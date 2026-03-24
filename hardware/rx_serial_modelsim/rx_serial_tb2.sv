
/* ---------------------------------------------------------------------------
 *  Arquivo   : rx_serial_tb.v
 * ---------------------------------------------------------------------------
 *  Descricao : testbench basico para o circuito de recepcao serial assincrona
 *              usa task UART_WRITE_BYTE para envio de bits seriais
 *              pode ser usado para verificar diversas configuracoes seriais
 *
 *  envia 2 caracteres em sequencia
 * ---------------------------------------------------------------------------
 *  Revisoes  :
 *      Data        Versao  Autor             Descricao
 *      28/10/2024  4.0     Edson Midorikawa  versao em Verilog
 * ---------------------------------------------------------------------------
 */

 
`timescale 1ns/1ns

module rx_serial_tb2;

  // Declaração de sinais para conectar o componente a ser testado (DUT)
  logic       clock_in        = 1'b0;
  logic       reset_in        = 1'b0;
  logic       pronto_out      = 1'b0;
  logic [7:0] dados_ascii_out = 1'b0;

  // Sinais usados com UART_WRITE_BYTE
  logic       Sinal_Serial;
  logic [7:0] serialData;

  // Configurações do clock
  localparam clockPeriod = 20ns; // clock 50MHz
  localparam bitPeriod   = 434*clockPeriod; // 115.200 bauds

  // Gerador de clock
  always #(clockPeriod/2) clock_in = ~clock_in;

  // UART_WRITE_BYTE()
  // Procedimento para geracao da sequencia de comunicacao serial
  // - com envio de 8 dados seriais + 2 stop bits
  // - adaptacao de codigo acessado de:
  //   https://nandland.com/uart-serial-port-module/
  // - pode ser usado para testar diversas configurações (7O1, 8E1,7N2, etc)
  task UART_WRITE_BYTE (
    input  logic [7:0] Data_In
  );
    begin

      // envia Start Bit
      Sinal_Serial = 1'b0;
      #bitPeriod;

      // envia 8 bits seriais
      for (integer ii=0; ii<8; ii++) begin
        Sinal_Serial = Data_In[ii];
        #bitPeriod;
      end

      // envia 2 Stop Bits
      Sinal_Serial = 1'b1;
      #(2*bitPeriod); 

    end
  endtask

  // Casos de teste
  typedef struct {
    integer     id;
    logic [7:0] dado1;
    logic [7:0] dado2;
  } caso_teste_type;

  // Array dos casos de teste
  localparam caso_teste_type casos_teste [] = '{
    '{1, 8'b00110101, 8'b00001111}, // 35H + 0FH
    '{2, 8'b10110101, 8'b10101010}, // B5H + AAH
    '{3, 8'b11010101, 8'b00100001}  // D5H + 21H
    // inserir aqui outros casos de teste (inserir "," na linha anterior)
  };

  integer caso;

  // Instanciação do DUT (Device Under Test)
  // => instancia modulo rx_serial_8N1 de autoria de Augusto Vaccarelli
  rx_serial_8N1 DUT (
    .clock       ( clock_in        ),
    .reset       ( reset_in        ), 
    .RX          ( Sinal_Serial    ),
    .pronto      ( pronto_out      ),
    .dados_ascii ( dados_ascii_out ),
    .db_clock    (                 ), 
    .db_tick     (                 ),
    .db_dados    (                 ),
    .db_estado   (                 )    
  );

  // Geracao dos sinais de entrada (estimulo)
  initial begin
    // inicio da simulacao
    $display("Inicio da simulacao");

    // Valores iniciais
    Sinal_Serial = 1'b1;

    // reset com 5 periodos de clock
    reset_in = 1'b1;
    #(5*clockPeriod);
    reset_in = 1'b0;
    #bitPeriod;

    // loop pelos casos de teste
    foreach (casos_teste[i]) begin
      caso = casos_teste[i].id;
      $display("Caso de teste %0d", casos_teste[i].id);
      serialData = casos_teste[i].dado1;

      // 1) aguarda 2 periodos de bit antes de enviar bits
      // # (2*bitPeriod);

      // 2) envia bits seriais para circuito de recepcao 
      //    usando task UART_WRITE_BYTE()
      UART_WRITE_BYTE(serialData);

      // 3) envia segundo caractere
      serialData = casos_teste[i].dado2;
      UART_WRITE_BYTE(serialData);
      // #bitPeriod;

      // 4) intervalo entre casos de teste
      # (2*bitPeriod);
    end

    // final dos casos de teste da simulacao
    caso = 99;
    // Reset do circuito
    reset_in = 1'b0;
    reset_in = # (5*clockPeriod) 1'b1;
    #bitPeriod;

    // fim da simulação
    $display("Fim da simulacao");
    $stop;
  end

endmodule
