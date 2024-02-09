import "dotenv/config";
import express from "express";
import db from "./db.js";
const { PORT } = process.env;

const app = express();
app.use(express.json({ limit: "50mb" }));

app.post("/clientes/:id/transacoes", async (req, res) => {

    const id = req.params.id

    const isFind = await findClient(id)
    if (!isFind) {
        return res.status(404).send("Client not found")
    }

    const { body } = req;
    console.log(body)
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

    res.status(200).send({
        "limite": 100000,
        "saldo": -9098
    })
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})


async function findClient(id) {
    return id
}