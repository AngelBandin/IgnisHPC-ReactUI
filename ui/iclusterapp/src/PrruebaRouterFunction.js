import React, { useState, useEffect, useParams } from 'react';
import ReactDOM from "react-dom/client";
import logo from './favicon.ico';
import { BrowserRouter as Router, Route, Routes, Link, useHistory } from 'react-router-dom';
// ... other imports

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Table from 'react-bootstrap/Table';


const API_URL = "http://localhost:5038/";

function App() {
    const [clusters, setClusters] = useState([]);
    const [newClusterName, setNewClusterName] = useState('');
    const [view, setView] = useState('home');
    const [route, setRoute] = useState([]);

    useEffect(() => {
        console.log("hola");
        document.title = "IgnisHPC Web UI";
        fetch(API_URL + "api/IClusterPrueba/GetCluster")
            .then(response => response.json())
            .then(data => setClusters(data))
            .catch(error => console.error("Error fetching clusters:", error));
    }, []);

    const handleNewClusterChange = (event) => {
        setNewClusterName(event.target.value);
    }

    return (
        <Router>
            <div className="App">
                <header className="App-header">
                    <img src={logo} className="App-logo" alt="logo" />
                    IClusterApp
                </header>
                <Routes>
                    <Route path="/" element={<HomeView clusters={clusters} />} />
                </Routes>
            </div>
        </Router>
    );
}

function HomeView({ clusters }) {
    return (
        <div className="body">
            <h2 className="cluster-name">Clusters:</h2>
            <div className="cluster-container">
                <Table striped>
                    <thead>
                    <tr>
                        <th>Cluster Name</th>
                        <th>ID</th>
                        <th>Taskgroup</th>
                        <th>Containers</th>
                        <th>Workers</th>
                    </tr>
                    </thead>
                    <tbody>
                    {clusters.map(cluster => (
                        <tr key={cluster.id}>
                            <td>{cluster.name}</td>
                            <td>{cluster.id}</td>
                            <td className="styled-link">taskgroup</td>
                            <td className="styled-link" onClick={() => {/* Implement navigation to containers */}}>containers</td>
                            <td className="styled-link">worker</td>
                        </tr>
                    ))}
                    </tbody>
                </Table>
            </div>
        </div>
    );
}

function ContainerView({ clusters }) {
    const { clusterId } = useParams();
    const [cluster, setCluster] = useState(null);

    useEffect(() => {
        const foundCluster = clusters.find(cluster => cluster.id === clusterId);
        setCluster(foundCluster);
    }, [clusters, clusterId]);

    if (!cluster) {
        return <div>Loading...</div>;
    }

    return (
        <div className="body">
            <h2 className="cluster-name">Containers: </h2>
            <div key={cluster.id} className="cluster-container">
                <h2 className="cluster-name">Cluster Name: {cluster.name}</h2>
                <Table striped>
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Info ID</th>
                        <th>Host</th>
                        <th>Image</th>
                        <th>Command</th>
                        <th>Resets</th>
                    </tr>
                    </thead>
                    <tbody>
                    {cluster.containers.map(container => (
                        <tr key={container.id}>
                            <td>{container.id}</td>
                            <td>{container.infoid}</td>
                            <td>{container.host}</td>
                            <td>{container.image}</td>
                            <td>{container.command}</td>
                            <td>{container.resets}</td>
                        </tr>
                    ))}
                    </tbody>
                </Table>
            </div>
        </div>
    );
}

function WorkerView() {
    return <div>Worker View</div>;
}

function TaskView() {
    return <div>Task View</div>;
}

export default App;
