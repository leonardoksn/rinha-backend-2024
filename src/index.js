import "dotenv/config";
import express from "express";
import db from "./db.js";
const { PORT } = process.env;

const app = express();
app.use(express.json({ limit: "50mb" }));

app.post("/clientes/:id/transacoes", async (req, res) => {

    const id = req.params.id

    const costumer = await findClient(id)
    if (!costumer) {
        return res.status(404).send("Client not found")
    }

    const { body } = req;

    if (typeof body.descricao !== "string" ||
        typeof body.valor !== "number" ||
        typeof body.tipo !== "string"
    ) {
        return res.status(400).send("Body not found")
    }

    //Verify body.valor is int that is greater than 0
    if (!Number.isInteger(body?.valor) || body?.valor <= 0) {
        return res.status(400).send("Body not found")
    }
    //Verify body.tipo is string "c" or "d"
    if (body?.tipo !== "c" && body?.tipo !== "d") {
        return res.status(400).send("Body not found")
    }
    //Verify body.descricao is string that hava 1 a 10 caracters
    if (body?.descricao?.length < 1 || body?.descricao?.length > 10) {
        return res.status(400).send("Body not found")
    }

    const client = await db.connect()
    let value;
    try {

        await client.query('BEGIN')

        if (body?.tipo === "c") {
            await client.query(`
            UPDATE clientes
            SET
                saldo = saldo + $1
            WHERE
                id = $2
            RETURNING
                limite,
                saldo;
            `, [body.valor, id])
                .then(({ rows }) => value = rows[0]);

        }

        if (body?.tipo === "d") {
            await client.query(`
            UPDATE clientes
			SET saldo = saldo - $1
			WHERE id = $2
			AND abs(saldo - $3) <= limite
			RETURNING limite, saldo;
            `, [body.valor, id, body?.valor])
                .then(({ rows }) => value = rows[0]);
        }
        if (!value) {
            await client.query('ROLLBACK')

            return res.status(422).send()
        }

        await client.query(`
            insert into 
            transacoes (
                valor, 
                tipo, 
                descricao, 
                cliente_id
            )
            values
            (
                $1, 
                $2, 
                $3, 
                $4
            );
        `, [body.valor, body.tipo, body.descricao, id]);

        await client.query('COMMIT')
    } catch (error) {
        await client.query('ROLLBACK')
        return res.status(500).send(error.message)
    } finally {
        client.release()
    }

    return res.status(200).send(value)

})


app.get('/clientes/:id/extrato', async (req, res) => {

    const id = req.params.id;
    const extract = await db.query(`
    SELECT A.saldo, A.limite, 
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'valor', B.valor,
                'tipo', B.tipo,
                'descricao', B.descricao,
                'realizada_em', B.realizada_em
            )
        ) AS transacoes
    FROM clientes A
    LEFT JOIN transacoes B ON A.id = B.cliente_id
    WHERE A.id = $1
    
    GROUP BY A.saldo, A.limite;
    `, [id])
        .then(({ rows }) => rows[0]);
    
    if(!Object.values(extract.transacoes[0])[0]){
        extract.transacoes = [] 
    }
        
    if (!extract) {
        return res.status(404).send("Client not found")
    }

    const response = {
        saldo: {
            total: extract.saldo,
            data_extrato: new Date(),
            limite: extract.limite
        },
        ultimas_transacoes: extract.transacoes
    }


    return res.send(response);

})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})


async function findClient(id) {
    const { rows } = await db.query("SELECT LIMITE, SALDO FROM clientes WHERE id = $1", [id]);
    return rows[0]

}