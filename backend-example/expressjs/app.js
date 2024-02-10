// import express, { Express, Request, Response } from "express";
console.log('starting app.js...')
const express = require("express")

const app = express();
const port = 8383;
app.use(express.json());

let totalAmount = 0

app.get("/health", (req, res) => {
    req.header("x-msg_sender")
    res.send({ some: "response" });
});

app.post('/deposit', (req, res) => {
    axios.post('http://deroll/voucher')
})

app.get("/", (req, res) => {
    res.send({ some: "response" });
});

app.get('/games', (req, res) => {
    console.log('hi')
    res.send({ ok: 1 })
})

app.put('/update', (req, res) => {
    res.send({ updateBody: req.body })
})

app.patch('/patch', (req, res) => {
    res.send({ patchBody: req.body })
})

app.delete('/delete', (req, res) => {
    res.send({ query: req.query })
})

app.post('/player', (req, res) => {
    const name = req.body.name
    const id = req.user.id
    res.send({ msg: "created", player: { id, name } })
})

app.post('/games', (req, res) => {
    req.body.startBid
    res.send({ msg: "game created" })
})

app.post('/hit', (req, res) => {
    // req.user.id === 'msg_sender'
    if (!Number.isNaN(+req.body.amount)) {
        totalAmount += +req.body.amount
    }
    res.send({ amount: totalAmount, myPost: req.body });
});

app.post('/echo', (req, res) => {
    res.send({ myPost: req.body });
});

app.post('/echo/headers', (req, res) => {
    res.send({ headers: req.headers });
});

app.get('/echo/headers', (req, res) => {
    res.send({ headers: req.headers });
})

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});

/* client side */

async function ClientSideCodeFrontEnd() {

    await CartesiClient.post('/hit', { foo: "bar" })

    // por debaixo dos panos
    const payload = toHex(JSON.stringify({ "cartesify": { "method": "POST", "url": "http://127.0.0.1:8383/hit", data: { foo: "bar" } } }))

}
