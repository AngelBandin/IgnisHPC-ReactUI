const cors = require("cors");
const multer = require("multer");
const MongoClient = require("mongodb").MongoClient;

let database;

const express = require('express');
const app = express();
app.use(cors());
app.use(express.json()); // Use JSON parsing middleware

const PORT = 5038;
const CONNECTION_STRING = "mongodb://localhost:27017";
const DATABASE_NAME = "DB_pruebas";

// Conexión a MongoDB y configuración de la ruta para obtener datos
app.listen(PORT, () => {
    MongoClient.connect(CONNECTION_STRING)
        .then(client => {
            database = client.db(DATABASE_NAME);
            console.log("Conexión a MongoDB exitosa");
        })
        .catch(error => {
            console.error("Error al conectar a MongoDB:", error);
        });
    console.log(`Servidor Express escuchando en el puerto ${PORT}`);
});
    app.get('/api/IClusterPrueba/GetCluster', (req, res) => {
    database.collection("ICluster").find({}).toArray()
        .then(result => {
            res.json(result);
        })
        .catch(error => {
            // Manejar errores de la consulta
            console.error("Error al consultar la base de datos:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        });
});
    /*
app.post('/api/IClusterPrueba/AddCluster',multer().none(),
    (request,response)=>{
        database.collection("ICluster").count({},function (error,numOfDocs) {
            database.collection("ICluster").insertOne({
                name:"Cluster3",
                id: parseInt(numOfDocs+1),
                containers: [{
                    id: parseInt(numOfDocs+1),
                    cluster: parseInt(numOfDocs+1),
                    infoid: 'info4',
                    host: 'host4',
                    image: 'image4',
                    command: 'command4',
                    resets: parseInt(numOfDocs+1)
                }]
            });
            response.json("Added Succesfully");
        })
})

app.delete('/api/IClusterPrueba/DeleteCluster',(request,response)=>{
    database.collection("ICluster").deleteOne({
        id:request.query.id
    });
    response.json("Delete Successfully")
})*/