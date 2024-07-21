const cors = require("cors");
const MongoClient = require("mongodb").MongoClient;

let database;
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5038;
const CONNECTION_STRING = `mongodb://localhost:27017`;
const DATABASE_NAME = process.env.DATABASE_NAME || "DB_pruebas";
app.use(cors());
app.use(express.json()); // Use JSON parsing middleware



//const DATABASE_NAME = "DB_IgnisHPC";

// Conexión a MongoDB y configuración de la ruta para obtener datos
app.listen(PORT, () => {
    MongoClient.connect(CONNECTION_STRING)
        .then(client => {
            database = client.db(DATABASE_NAME);
            console.log("Conexión a MongoDB exitosa");

            // Access the collection here after successful connection
            app.get('/api/IClusterPrueba/GetCluster', (req, res) => {
                database.collection("ICluster").find({}).toArray()
                    .then(result => {
                        res.json(result);
                    })
                // ... rest of the handler code
            });
            // ... other routes with database access
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

app.post('/api/IClusterPrueba/InsertJob', express.json(), (req, res) => {
    const job = req.body;

    if (!job || !job.id) {
        return res.status(400).json({ error: "Invalid data. Job with an ID is required." });
    }

    database.collection("ICluster").findOne({ id: job.id })
        .then(existingJob => {
            if (existingJob) {
                return res.status(409).json({ message: "Job with this ID already exists. No action taken." });
            }

            return database.collection("ICluster").insertOne(job);
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

app.post('/api/IClusterPrueba/UpsertCluster', express.json(), (req, res) => {
    const { jobId, cluster } = req.body;

    if (!jobId || !cluster || !cluster.id) {
        return res.status(400).json({ error: "Invalid data. Job ID and cluster with an ID are required." });
    }

    database.collection("ICluster").findOne({ id: jobId })
        .then(job => {
            if (!job) {
                return res.status(404).json({ error: "Job not found" });
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

            return database.collection("ICluster").updateOne(
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

    //json template
    /*
            *   {
                  "jobid": "1",
                  "cluster": {
                    "id": "1",
                    "name": "ICluster1",
                    ... // resto de la información del cluster
                   }
                }*/

});

app.post('/api/IClusterPrueba/UpsertWorker', express.json(), (req, res) => {
    const { jobId, clusterId, worker } = req.body;

    if (!jobId || !clusterId || !worker || !worker.id) {
        return res.status(400).json({ error: "Invalid data. Job ID, Cluster ID, and worker with an ID are required." });
    }

    database.collection("ICluster").findOne({ id: jobId, "clusters.id": clusterId })
        .then(job => {
            if (!job) {
                return res.status(404).json({ error: "Job or Cluster not found" });
            }

            const clusterIndex = job.clusters.findIndex(c => c.id === clusterId);
            if (clusterIndex === -1) {
                return res.status(404).json({ error: "Cluster not found in the specified job" });
            }

            const existingWorkerIndex = job.clusters[clusterIndex].workers.findIndex(w => w.id === worker.id);

            let updateOperation;
            if (existingWorkerIndex !== -1) {
                // Update existing worker
                updateOperation = {
                    $set: { [`clusters.${clusterIndex}.workers.${existingWorkerIndex}`]: worker }
                };
            } else {
                // Add new worker
                updateOperation = {
                    $push: { [`clusters.${clusterIndex}.workers`]: worker }
                };
            }

            return database.collection("ICluster").updateOne(
                { id: jobId, "clusters.id": clusterId },
                updateOperation
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
            res.status(500).json({ error: "Error upserting worker" });
        });
});
/*app.post('/api/IClusterPrueba/UpsertJob', express.json(), (req, res) => {
    const job = req.body;

    if (!job || !job.id) {
        return res.status(400).json({ error: "Invalid data. Job with an ID is required." });
    }

    database.collection("ICluster").updateOne(
        { id: job.id },
        { $set: job },
        { upsert: true }
    )
        .then(result => {
            if (result.matchedCount > 0) {
                res.json({ message: "Job updated successfully" });
            } else {
                res.json({ message: "New job inserted successfully" });
            }
        })
        .catch(error => {
            console.error("Error upserting job:", error);
            res.status(500).json({ error: "Error upserting job" });
        });
});
*/
// New endpoint: Destroy Job
app.post('/api/IClusterPrueba/UpsertContainer', express.json(), async (req, res) => {
    const { jobId, clusterId, container } = req.body;

    if (!jobId || !clusterId || !container || !container.id) {
        return res.status(400).json({ error: "Invalid data. Job ID, Cluster ID, and container with an ID are required." });
    }

    try {
        // First, check if the job and cluster exist
        const job = await database.collection("ICluster").findOne({ id: jobId, "clusters.id": clusterId });

        if (!job) {
            return res.status(404).json({ error: "Job or Cluster not found" });
        }

        const cluster = job.clusters.find(c => c.id === clusterId);

        if (!cluster) {
            return res.status(404).json({ error: "Cluster not found in the specified job" });
        }

        // Check if the container already exists
        const existingContainerIndex = cluster.containers ? cluster.containers.findIndex(c => c.id === container.id) : -1;

        let updateOperation;
        if (existingContainerIndex !== -1) {
            // Update existing container
            updateOperation = {
                $set: { [`clusters.$[cluster].containers.${existingContainerIndex}`]: container }
            };
        } else {
            // Add new container
            updateOperation = {
                $push: { "clusters.$[cluster].containers": container }
            };
        }

        const result = await database.collection("ICluster").updateOne(
            { id: jobId, "clusters.id": clusterId },
            updateOperation,
            {
                arrayFilters: [{ "cluster.id": clusterId }]
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: "Failed to update or insert container" });
        }

        // Update container in workers
        await database.collection("ICluster").updateMany(
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

        res.json({ message: "Container upserted successfully in cluster and relevant workers" });
    } catch (error) {
        console.error("Error upserting container:", error);
        res.status(500).json({ error: "Error upserting container" });
    }
});

app.post('/api/IClusterPrueba/UpsertMultipleContainers', express.json(), async (req, res) => {
    const { jobId, clusterId, containers } = req.body;

    if (!jobId || !clusterId || !Array.isArray(containers) || containers.length === 0) {
        return res.status(400).json({ error: "Invalid data. Job ID, Cluster ID, and an array of containers are required." });
    }

    try {
        // Check if the job and cluster exist
        const job = await database.collection("ICluster").findOne({ id: jobId, "clusters.id": clusterId });

        if (!job) {
            return res.status(404).json({ error: "Job or Cluster not found" });
        }

        const cluster = job.clusters.find(c => c.id === clusterId);

        if (!cluster) {
            return res.status(404).json({ error: "Cluster not found in the specified job" });
        }

        // Prepare the update operation
        const updateOperation = {
            $push: {
                "clusters.$[cluster].containers": {
                    $each: containers
                }
            }
        };

        // Perform the update
        const result = await database.collection("ICluster").updateOne(
            { id: jobId, "clusters.id": clusterId },
            updateOperation,
            {
                arrayFilters: [{ "cluster.id": clusterId }]
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: "Failed to add containers" });
        }

        // Update containers in workers if necessary
        // This step is optional and depends on your specific requirements
        for (const container of containers) {
            await database.collection("ICluster").updateMany(
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

        res.json({
            message: "Containers added successfully",
            addedCount: containers.length
        });
    } catch (error) {
        console.error("Error adding containers:", error);
        res.status(500).json({ error: "Error adding containers" });
    }
});

app.delete('/api/IClusterPrueba/DestroyJob/:jobId', (req, res) => {
    const jobId = req.params.jobId;

    database.collection("ICluster").deleteOne({ id: jobId })
        .then(result => {
            if (result.deletedCount > 0) {
                res.json({ message: "Job deleted successfully" });
            } else {
                res.status(404).json({ error: "Job not found" });
            }
        })
        .catch(error => {
            console.error("Error deleting job:", error);
            res.status(500).json({ error: "Error deleting job" });
        });
});

// New endpoint: Destroy Cluster
app.delete('/api/IClusterPrueba/DestroyCluster/:jobId/:clusterId', (req, res) => {
    const { jobId, clusterId } = req.params;

    database.collection("ICluster").updateOne(
        { id: jobId },
        { $pull: { clusters: { id: clusterId } } }
    )
        .then(result => {
            if (result.modifiedCount > 0) {
                res.json({ message: "Cluster deleted successfully" });
            } else {
                res.status(404).json({ error: "Job or Cluster not found" });
            }
        })
        .catch(error => {
            console.error("Error deleting cluster:", error);
            res.status(500).json({ error: "Error deleting cluster" });
        });
});

// New endpoint: Destroy Worker
app.delete('/api/IClusterPrueba/DestroyWorker/:jobId/:clusterId/:workerId', (req, res) => {
    const { jobId, clusterId, workerId } = req.params;

    database.collection("ICluster").updateOne(
        { id: jobId, "clusters.id": clusterId },
        { $pull: { "clusters.$.workers": { id: workerId } } }
    )
        .then(result => {
            if (result.modifiedCount > 0) {
                res.json({ message: "Worker deleted successfully" });
            } else {
                res.status(404).json({ error: "Job, Cluster, or Worker not found" });
            }
        })
        .catch(error => {
            console.error("Error deleting worker:", error);
            res.status(500).json({ error: "Error deleting worker" });
        });
});

app.delete('/api/IClusterPrueba/DeleteMultipleContainers', express.json(), async (req, res) => {
    const { jobId, clusterId, containerIds } = req.body;

    if (!jobId || !clusterId || !Array.isArray(containerIds) || containerIds.length === 0) {
        return res.status(400).json({ error: "Invalid data. Job ID, Cluster ID, and an array of container IDs are required." });
    }

    try {
        // Check if the job and cluster exist
        const job = await database.collection("ICluster").findOne({ id: jobId, "clusters.id": clusterId });

        if (!job) {
            return res.status(404).json({ error: "Job or Cluster not found" });
        }

        const cluster = job.clusters.find(c => c.id === clusterId);

        if (!cluster) {
            return res.status(404).json({ error: "Cluster not found in the specified job" });
        }

        // Prepare the update operation
        const updateOperation = {
            $pull: {
                "clusters.$[cluster].containers": {
                    id: { $in: containerIds }
                }
            }
        };

        // Perform the update
        const result = await database.collection("ICluster").updateOne(
            { id: jobId, "clusters.id": clusterId },
            updateOperation,
            {
                arrayFilters: [{ "cluster.id": clusterId }]
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: "No containers were deleted. They may not exist in the specified cluster." });
        }

        // Remove the deleted containers from workers
        await database.collection("ICluster").updateMany(
            { id: jobId, "clusters.id": clusterId },
            {
                $pull: {
                    "clusters.$[cluster].workers.$[].containers": {
                        id: { $in: containerIds }
                    }
                }
            },
            {
                arrayFilters: [{ "cluster.id": clusterId }]
            }
        );

        res.json({
            message: "Containers deleted successfully",
            deletedCount: result.modifiedCount
        });
    } catch (error) {
        console.error("Error deleting containers:", error);
        res.status(500).json({ error: "Error deleting containers" });
    }
});
/*app.post('/api/IClusterPrueba/UpsertJob', express.json(), (req, res) => {
    const {job} = req.body;

    if (!job|| !job.jobId ) {
        return res.status(400).json({ error: "Invalid data. Job with an ID is required." });
    }

    database.collection("ICluster").findOne({ id: job.jobId })
        .then(job => {
            if (!job) {
                return res.status(404).json({ error: "Job not found" });
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

            return database.collection("ICluster").updateOne(
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

    //json template
    ///
            //   {
                  //"jobid": "1",
                  //"cluster": {
                    //"id": "1",
                    //"name": "ICluster1",
                    //... // resto de la información del cluster
                  // }
                //}

});*/
//añadir crear y destruir job y destruir cluster y luego worker.