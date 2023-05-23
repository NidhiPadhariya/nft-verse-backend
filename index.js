const mongoose = require('mongoose');
require('dotenv').config();
const express = require('express');
const path = require("path")
const port = process.env.PORT;
const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json())

app.use(express.urlencoded({ extended: true }));
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

mongoose.connect(process.env.MONGO_Db, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => { console.log("Database Connection Sucessfully"); })
    .catch(() => { console.log("Not connected To database"); });

const swaggerDefinition = {
    openapi: '3.0.1',
    info: {
        title: 'NFT Metaverse',
        version: '1.0.0',
        description: 'NFT APIs',
    },
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'apiKey',
                scheme: 'apiKey',
                name: 'authorization',
                in: 'header'
            }
        }
    },
    security: [{
        bearerAuth: []
    }],
    servers: [
        {
            url: process.env.LOCAL_SWAGGER,
            description: 'Localhost',
        }, {
            url: process.env.SERVER_SWAGGER,
            description: 'server',
        }
    ],
};

const options = {
    swaggerDefinition,
    apis: ['./route/mintnft.js'],
};

const swaggerSpec = swaggerJSDoc(options);
app.use('/nft-metaverse', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/", require("./route/mintnft"));

// app.get('/', (req, res) => {
//     res.send("Hello World!");
// });
app.use(express.static("../nft-metaverse-react-frontend/build/"))
// app.use("/home", async (req, res) => {
//     console.log(path.join(__dirname, '../nft-metaverse-react-frontend/build/'))
//     console.log("inside homepage")
//     res.sendFile(path.join(__dirname, '../nft-metaverse-react-frontend/build/')
//     )
// })

app.listen(port, () => {
    console.log(`Connected to ${port}`);
})
