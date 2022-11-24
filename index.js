const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;


const app = express();

//middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.9qpmxm2.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {

        const usersCollenction = client.db('tunetools').collection('users');

        app.get('/users', async (req, res) => {
            let query = {};
            const rolequery = req.query.role;
            if (rolequery) {
                query = { role: rolequery }
            }
            const result = await usersCollenction.find(query).toArray();
            res.send(result);
        });


        app.post('/users', async (req, res) => {
            const user = req.body
            const result = await usersCollenction.insertOne(user);
            res.send(result)
        });



    }
    finally {

    }
}
run().catch(e => console.error(e));


app.get('/', (req, res) => {
    res.send('Tune Tools Server Is Running');
})

app.listen(port, (req, res) => {
    console.log('Server is running on port :', port);
})