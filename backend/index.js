const cors = require("cors");
const MongoClient = require("mongodb").MongoClient;

let database;
const express = require('express');
const app = express();
const PORT = 5038;
const CONNECTION_STRING = `mongodb://localhost:27017`;
const DATABASE_NAME = "IgnisDB";
app.use(cors());
app.use(express.json()); // Use JSON parsing middleware

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

app.get('/api/v1/GetJobs', (req, res) => {
    database.collection("Jobs").find({}).toArray()
        .then(result => {
            res.json(result);
        })
        .catch(error => {
            // Manejar errores de la consulta
            console.error("Error al consultar la base de datos:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        });
});

app.post('/api/v1/UpdateAllJobs', (req, res) => {
    const newData = req.body;

    if (!Array.isArray(newData)) {
        return res.status(400).json({ error: "Invalid data format. Expected an array." });
    }

    database.collection("Jobs").deleteMany({})
        .then(() => {
            return database.collection("Jobs").insertMany(newData);
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

app.post('/api/v1/InsertJob', (req, res) => {
    const job = req.body;

    if (!job || !job.id) {
        return res.status(400).json({ error: "Invalid data. Job with an ID is required." });
    }

    database.collection("Jobs").findOne({ id: job.id })
        .then(existingJob => {
            if (existingJob) {
                return res.status(409).json({ message: "Job with this ID already exists. No action taken." });
            }

            return database.collection("Jobs").insertOne(job);
        })
        .then(result => {
            if (result.insertedId) {
                res.status(201).json({ message: "New job inserted successfully", insertedId: result.insertedId });
            }
        })
        .catch(error => {
            console.error("Error inserting job:", error);
            res.status(500).json({ error: "Error inserting job" });
        });
});

app.put('/api/v1/UpdateJob', (req, res) => {
    const updates = req.body;

    if (!updates || !updates.id) {
        return res.status(400).json({ error: "Invalid data. Job ID is required." });
    }

    // Extract id for finding the document
    const jobId = updates.id;

    database.collection("Jobs").findOne({ id: jobId })
        .then(existingJob => {
            if (!existingJob) {
                return res.status(404).json({ message: "Job not found." });
            }

            // Merge existing job with updates
            // This preserves fields that aren't in the update payload
            const updatedJob = { ...existingJob, ...updates };

            return database.collection("Jobs").updateOne(
                { id: jobId },
                { $set: updatedJob }
            );
        })
        .then(result => {
            if (result?.modifiedCount > 0) {
                res.json({
                    message: "Job updated successfully",
                    modifiedCount: result.modifiedCount
                });
            } else if (result?.matchedCount > 0) {
                res.json({
                    message: "Job found but no changes were needed",
                    modifiedCount: 0
                });
            }
        })
        .catch(error => {
            console.error("Error updating job:", error);
            res.status(500).json({ error: "Error updating job" });
        });
});
app.post('/api/v1/UpsertCluster', (req, res) => {
    const { jobId, cluster } = req.body;

    if (!jobId || !cluster || cluster.id == null) {
        return res.status(400).json({ error: "Invalid data. Job ID and cluster with an ID are required." });
    }

    database.collection("Jobs").findOne({ id: jobId })
        .then(job => {
            if (!job) {
                return res.status(404).json({ error: "Job not found." });
            }

            const existingClusterIndex = job.clusters.findIndex(c => c.id === cluster.id);

            let updateOperation;
            if (existingClusterIndex !== -1) {
                // Update existing cluster
                updateOperation = {
                    $set: { [`clusters.${existingClusterIndex}`]: cluster }
                };
            } else {
                // Add new cluster
                updateOperation = {
                    $push: { clusters: cluster }
                };
            }

            return database.collection("Jobs").updateOne(
                { id: jobId },
                updateOperation
            );
        })
        .then(result => {
            if (result.matchedCount > 0) {
                res.json({ message: "Cluster updated or inserted successfully" });
            } else {
                res.status(404).json({ error: "Job not found or update failed" });
            }
        })
        .catch(error => {
            console.error("Error upserting cluster:", error);
            res.status(500).json({ error: "Error upserting cluster" });
        });

});

app.post('/api/v1/UpsertWorker', (req, res) => {
    const { jobId, clusterId, worker } = req.body;
    console.log('Received UpsertWorker request:', JSON.stringify(req.body, null, 2));

    if (!jobId || clusterId == null || !worker || worker.id == null) {
        return res.status(400).json({ error: "Invalid data. Job ID, Cluster ID, and worker with an ID are required." });
    }

    database.collection("Jobs").findOne({ id: jobId })
        .then(job => {
            if (!job) {
                return res.status(404).json({ error: "Job not found." });
            }

            console.log('Found job:', JSON.stringify(job, null, 2));

            const cluster = job.clusters ? job.clusters.find(c => c.id === clusterId) : null;
            if (!cluster) {
                return res.status(404).json({ error: "Cluster not found in the specified job" });
            }

            const workers = cluster.workers || [];
            const existingWorkerIndex = workers.findIndex(w => w.id === worker.id);

            let updateOperation;
            if (existingWorkerIndex !== -1) {
                // Update existing worker
                updateOperation = {
                    $set: { [`clusters.$[cluster].workers.${existingWorkerIndex}`]: worker }
                };
            } else {
                // Add new worker
                updateOperation = {
                    $push: { "clusters.$[cluster].workers": worker }
                };
            }

            return database.collection("Jobs").updateOne(
                { id: jobId },
                updateOperation,
                {
                    arrayFilters: [{ "cluster.id": clusterId }]
                }
            );
        })
        .then(result => {
            if (result.matchedCount > 0) {
                res.json({ message: "Worker updated or inserted successfully" });
            } else {
                res.status(404).json({ error: "Job or Cluster not found or update failed" });
            }
        })
        .catch(error => {
            console.error("Error upserting worker:", error);
            res.status(500).json({ error: "Error upserting worker", details: error.message, stack: error.stack });
        });
});

app.post('/api/v1/UpsertMultipleContainers', async (req, res) => {
    const { jobId, clusterId, containers } = req.body;
    if (!jobId || clusterId == null || !Array.isArray(containers) || containers.length === 0) {
        return res.status(400).json({ error: "Invalid data. Job ID, Cluster ID, and an array of containers are required." });
    }

    try {
        // Check if the job and cluster exist

        const job = await database.collection("Jobs").findOne({ id: jobId });

        if (!job) {
            return res.status(404).json({ error: "Job not found" });
        }

        const cluster = job.clusters.find(c => c.id === clusterId);
        if (!cluster) {
            return res.status(404).json({ error: "Cluster not found in the specified job" });
        }

        // Get existing containers
        const existingContainers = cluster.containers || [];

        // Process each container
        const updatedContainers = [...existingContainers];
        const containerUpdates = [];

        for (const newContainer of containers) {
            const existingIndex = updatedContainers.findIndex(c => c.id === newContainer.id);

            if (existingIndex !== -1) {
                // Update existing container
                updatedContainers[existingIndex] = newContainer;
            } else {
                // Add new container
                updatedContainers.push(newContainer);
            }
            containerUpdates.push(newContainer);
        }

        // Update the cluster's containers
        const result = await database.collection("Jobs").updateOne(
            { id: jobId, "clusters.id": clusterId },
            {
                $set: {
                    "clusters.$[cluster].containers": updatedContainers
                }
            },
            {
                arrayFilters: [{ "cluster.id": clusterId }]
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Failed to update containers" });
        }

        // Update containers in workers if they exist
        if (containerUpdates.length > 0) {
            for (const container of containerUpdates) {
                await database.collection("Jobs").updateMany(
                    {
                        id: jobId,
                        "clusters.id": clusterId,
                        "clusters.workers.containers.id": container.id
                    },
                    {
                        $set: { "clusters.$[cluster].workers.$[].containers.$[container]": container }
                    },
                    {
                        arrayFilters: [
                            { "cluster.id": clusterId },
                            { "container.id": container.id }
                        ]
                    }
                );
            }
        }

        res.json({
            message: "Containers updated successfully",
            updatedCount: containerUpdates.length,
            totalContainers: updatedContainers.length
        });
    } catch (error) {
        console.error("Error updating containers:", error);
        res.status(500).json({ error: "Error updating containers" });
    }
});