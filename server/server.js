const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = 5000; // Puerto del servidor

// Configuración de la conexión a MongoDB
const MONGODB_URI = 'mongodb://localhost:27017/DB_pruebas';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Conexión a MongoDB establecida correctamente');

    // Generar automáticamente el modelo basado en la colección ICluster
    const IClusterModel = mongoose.model('ICluster', {});

    // Utilizar el modelo para realizar operaciones en la colección ICluster
    app.get('/api/IClusterPrueba/GetCluster', (req, res) => {
        IClusterModel.find({}, (err, clusters) => {
            if (err) {
                console.error('Error al consultar la base de datos:', err);
                res.status(500).json({ error: 'Error interno del servidor' });
                return;
            }
            res.json(clusters); // Enviar los documentos como respuesta
        });
    });

}).catch(err => {
    console.error('Error al conectar a MongoDB:', err);
});