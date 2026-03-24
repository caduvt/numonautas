# Backend

Esta pasta armazena o backend do jogo. Depois eu termino a descrição :)

## Tecnologias

Trata-se de um backend simples, usando FastAPI, e usando libs como pySerial, para comunicação serial, e pydantic, para tipagem de schemas.

## Execução

Primeiramente, é necessário configurar a permissão para uso de portas seriais no sistema. No caso de sistemas Linux, é necessário rodar o comando a seguir:

```
sudo usermod -a -G dialout $USER
```

Para que o comando faça efeito, é necessário deslogar e logar novamente no sistema (ou simplesmente reiniciar o computador).

Em seguida, para iniciar, basta executar os comandos a seguir

```
cd backend

# Cria o ambiente virtual (venv)
python3 -m venv venv

# Ativa o ambiente virtual
source venv/bin/activate

# instala as dependências
pip install -r requirements.txt

# Roda o servidor
uvicorn app.main:app --reload
```

sudo usermod -a -G dialout $USER

Com isso, o projeto vai ser iniciado em `http://localhost:5173/`.
