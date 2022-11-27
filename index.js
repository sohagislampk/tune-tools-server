const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken')
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const app = express();

//middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.9qpmxm2.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('Unauthoirized Access');
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: "Forbidden Access" })
        }
        req.decoded = decoded;
        next()
    })
}


async function run() {
    try {

        const usersCollenction = client.db('tunetools').collection('users');
        const productsCollenction = client.db('tunetools').collection('products');
        const bookingsCollenction = client.db('tunetools').collection('bookings');
        const paymentsCollenction = client.db('tunetools').collection('payments');

        // Verify Admin
        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollenction.findOne(query);
            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'Forbidded Access' })
            }
            next()
        }
        // JWT
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = {
                email: email
            }
            const user = await usersCollenction.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' })
                return res.send({ accessToken: token })
            }
            res.status(403).send({ accessToken: '' })
        });

        // User add and get
        app.get('/users', verifyJWT, verifyAdmin, async (req, res) => {
            let query = {};
            const rolequery = req.query.role;
            if (rolequery) {
                query = { role: rolequery }
            }
            const result = await usersCollenction.find(query).toArray();
            res.send(result);
        });
        app.get('/users/:email', verifyJWT, async (req, res) => {
            const userEmail = req.params.email;

            const decodedEmail = req.decoded.email;
            if (userEmail !== decodedEmail) {
                return res.status(403).send({ message: 'Forbidden Access' })
            }
            const query = {
                email: userEmail
            }
            const result = await usersCollenction.findOne(query);
            res.send(result);
        });


        app.post('/users', async (req, res) => {
            const user = req.body
            const result = await usersCollenction.insertOne(user);
            res.send(result)
        });

        app.delete('/users/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: ObjectId(id)
            }
            const result = await usersCollenction.deleteOne(query);
            res.send(result)
        });
        app.put('/users/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: "verified"
                }
            }
            const result = await usersCollenction.updateOne(query, updateDoc, options);
            res.send(result);
        });
        // Admin
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollenction.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' })
        })
        // seller
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollenction.findOne(query);
            res.send({ isSeller: user?.role === 'seller' })
        })

        // add and get products

        app.get('/products', async (req, res) => {
            let query = {};
            const statusAdvertise = req.query.status;
            const userEmail = req.query.email;

            if (statusAdvertise) {
                query = { status: statusAdvertise }
            }
            if (userEmail) {
                query = { sellerEmail: userEmail }
            }
            const result = await productsCollenction.find(query).toArray();
            res.send(result);
        });
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollenction.findOne(query);
            res.send(result);
        });
        app.put('/products/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            console.log(req.body.status);
            const query = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: req.body.status
                }
            }
            const result = await productsCollenction.updateOne(query, updateDoc, options);
            res.send(result);
        });

        app.delete('/products/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: ObjectId(id)
            }
            const result = await productsCollenction.deleteOne(query);
            res.send(result)
        });

        app.post('/products', verifyJWT, async (req, res) => {
            const product = req.body
            const result = await productsCollenction.insertOne(product);
            res.send(result)
        });
        app.get('/category/:name', async (req, res) => {
            const name = req.params.name;
            const query = {
                category: name,
                status: { $ne: "sold" }
            }
            const result = await productsCollenction.find(query).toArray()
            res.send(result)
        })
        // Bookings
        app.get('/bookings', verifyJWT, async (req, res) => {

            const userEmail = req.query.email;
            const decodedEmail = req.decoded.email;
            if (userEmail !== decodedEmail) {
                return res.status(403).send({ message: 'Forbidden Access' })
            }


            if (userEmail) {
                const query = {
                    buyerEmail: userEmail,
                }
                const result = await bookingsCollenction.find(query).toArray();
                res.send(result)
            } else
                res.send("No Bookings found")

        });

        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {
                _id: ObjectId(id)
            };
            const result = await bookingsCollenction.findOne(filter);
            res.send(result)
        });
        app.post('/bookings', verifyJWT, async (req, res) => {
            const booking = req.body
            const result = await bookingsCollenction.insertOne(booking);
            res.send(result)
        });
        app.delete('/bookings/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: ObjectId(id)
            }
            const result = await bookingsCollenction.deleteOne(query);
            res.send(result)
        })
        // Payment
        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.price;
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            console.log(paymentIntent.client_secret);
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentsCollenction.insertOne(payment);
            const id = payment.bookingId;
            const productId = payment.productId;
            const filterProduct = { _id: ObjectId(productId) }
            const filter = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedDocProduct = {
                $set: {
                    status: "sold"
                }
            }
            const updatedResult = await bookingsCollenction.updateOne(filter, updatedDoc);
            const updatedProduct = await productsCollenction.updateOne(filterProduct, updatedDocProduct);

            res.send(result);
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