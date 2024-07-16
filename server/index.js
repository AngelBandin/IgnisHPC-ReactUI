const cors = require("cors");
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

    app.post('/api/IClusterPrueba/UpdateAllClusters', express.json(), (req, res) => {
        const newData = req.body;

        if (!Array.isArray(newData)) {
            return res.status(400).json({ error: "Invalid data format. Expected an array." });
        }

        database.collection("ICluster").deleteMany({})
            .then(() => {
                return database.collection("ICluster").insertMany(newData);
            })
            .then(result => {
                res.json({
                    message: "Database updated successfully",
                    insertedCount: result.insertedCount
                });
            })
            .catch(error => {
                console.error("Error updating database:", error);
                res.status(500).json({ error: "Error updating database" });
            });
    });