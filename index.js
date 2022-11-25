const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const productsCollenction = client.db('tunetools').collection('products');
        // User add and get
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

        // add and get products

        app.get('/products', async (req, res) => {
            const query = {};
            const result = await productsCollenction.find(query).toArray();
            res.send(result);
        });
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollenction.findOne(query);
            res.send(result);
        });


        app.post('/products', async (req, res) => {
            const product = req.body
            const result = await productsCollenction.insertOne(product);
            res.send(result)
        });
        app.get('/category/:name', async (req, res) => {
            const name = req.params.name;
            const query = { category: name }
            const result = await productsCollenction.find(query).toArray()
            res.send(result)
        })


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