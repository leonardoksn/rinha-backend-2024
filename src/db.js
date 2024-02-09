// Configurações do banco de dados
const { POSTGRES_PASSWORD, POSTGRES_USER, POSTGRES_HOST, POSTGRES_DB } = process.env;
import pg from 'pg';
const pool = new pg.Pool({
    user: POSTGRES_USER,
    host: POSTGRES_HOST,
    database: POSTGRES_DB,
    password: POSTGRES_PASSWORD,
    port: 5432,
});

export default pool