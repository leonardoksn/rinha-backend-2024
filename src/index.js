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
    //Verify body.valor is int that is greater than 0
    if (!Number.isInteger(body.valor) || body.valor <= 0) {
        return res.status(404).send("Body not found")
    }
    //Verify body.tipo is string "c" or "d"
    if (body.tipo !== "c" && body.tipo !== "d") {
        return res.status(404).send("Body not found")
    }
    //Verify body.descricao is string that hava 1 a 10 caracters
    if (body.descricao.length < 1 || body.descricao.length > 10) {
        return res.status(404).send("Body not found")
    }
    // const { rows } = await db.query("INSERT INTO transacoes (valor, tipo, descricao) VALUES ($1, $2, $3) RETURNING *", [body.valor, body.tipo, body.descricao]);
    const newBalance = costumer.saldo - body.valor;

    if (body.tipo === "d") {
        const isNegative = (newBalance + costumer.limite) < 0;
        if (isNegative) {
            return res.status(422).send()
        }
    }
    const client = await db.connect()

    try {

        await client.query('BEGIN')

        await client.query("INSERT INTO transacoes (valor, tipo, descricao) VALUES ($1, $2, $3)", [body.valor, body.tipo, body.descricao]);

        await client.query("UPDATE clientes SET saldo = $1 WHERE id = $2", [newBalance, id]);

        await client.query('COMMIT')
    } catch (error) {

        await client.query('ROLLBACK')
        return res.status(500).send(error.message)
    }
    res.status(200).send({
        "limite": costumer.limite,
        "saldo": newBalance
    })


})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})


async function findClient(id) {
    const { rows } = await db.query("SELECT LIMITE, SALDO FROM clientes WHERE id = $1", [id]);
    return rows[0]

}