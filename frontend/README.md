# Frontend

Esta pasta armazena o frontend web do jogo. Por meio do backend em python (vide `backend/`), ele recebe as questões sorteadas, exibindo-as na tela junto às alternativas. Quando o usuário acerta a questão, é exibido o nível seguinte. Quando ele erra, guia para a resposta correta e aguarda uma nova escolha do usuário.

Há também uma tela de configurações, permitindo ativar ou desativar sons e efeitos visuais, bem como alterar a dificuldade das questões.

## Tecnologias

Trata-se de um frontend simples com Vite + React, usando React Router para navegação.

## Execução

Para iniciar, basta executar os comandos a seguir

```
cd frontend

# instala dependências do projeto
npm install

# roda o projeto
npm run dev
```

Com isso, o projeto vai ser iniciado em `http://localhost:5173/`.
