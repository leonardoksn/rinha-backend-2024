// Configurações do banco de dados
const { POSTGRES_PASSWORD, POSTGRES_USER, POSTGRES_HOST, POSTGRES_DB } = process.env;
import { log } from "console";
import pg from 'pg';
const pool = new pg.Pool({
    user: POSTGRES_USER,
    host: POSTGRES_HOST,
    database: POSTGRES_DB,
    password: POSTGRES_PASSWORD,
    port: 5432,
});

pool.on('error', connect);

pool.once('connect', () => {
    log('Conectado ao postgres');

    return pool.query(`
    CREATE TABLE IF NOT EXISTS transacoes (
        id SERIAL PRIMARY KEY,
        valor INT NOT NULL,
        tipo VARCHAR(1) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        descricao VARCHAR(10) NOT NULL
        );

    CREATE TABLE IF NOT EXISTS clientes (
        id SERIAL PRIMARY KEY,
        limite INT NOT NULL,
        SALDO INT DEFAULT 0,
        nome VARCHAR(50) NOT NULL
        );

    `)

})

async function connect() {
    try {
        log(`Connecting to db ${POSTGRES_HOST}`);
        await pool.connect();
    } catch (err) {
        setTimeout(() => {
            connect();
            log(`database.js: an error occured when connecting ${err} retrying connection on 3 secs`);
        }, 3000)
    }
}

connect();

export default pool