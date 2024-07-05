import React, { useState, useEffect, useParams } from 'react';
import {Component} from 'react';
import ReactDOM from "react-dom/client";
import logo from './favicon.ico';
import { BrowserRouter as Router, Route, Routes, Link, useHistory } from 'react-router-dom';
// ... other imports

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Table from 'react-bootstrap/Table';


const API_URL = "http://localhost:5038/";

class App extends Component {

    constructor(props) {
        super(props);

        this.state = {
            clusters: [],
            newClusterName: '',
            view: 'home',
            route: []
        };

        this.API_URL = "http://localhost:5038/";
    }

    componentDidMount() {
        console.log("hola");
        document.title = "IgnisHPC Web UI";
        this.refreshClusters();
    }

    async refreshClusters() {
        fetch(this.API_URL + "api/IClusterPrueba/GetCluster")
            .then(response => response.json())
            .then(data => {
                this.setState({clusters: data});
            })
            .catch(error => {
                console.error("Error fetching clusters:", error);
                // You can display an error message to the user here
            });
    }

    handleNewClusterChange = (event) => {
        this.setState({newClusterName: event.target.value});
    }

    render() {
        const { view } = this.state;
        return (
            <div className="App">
                <header className="App-header">
                    <img src={logo} className="App-logo" alt="logo"/>
                    IClusterApp
                </header>
                {view === 'home' && this.renderHomeView()}
                {view === 'container' && this.renderContainerView()}
                {view === 'worker' && this.renderWorkerView()}
                {view === 'task' && this.renderTaskView()}
            </div>
        );
    }
    taskhandleClick = (id) => {
        this.setState(prevState => ({view: 'task', route: [...prevState.route,id,'task']}));
    };
    containerhandleClick = (id) => {
        this.setState(prevState => ({view: 'container', route: [...prevState.route,id,'container']}));
    };
    taskhandleClick = (id) => {
        this.setState(prevState => ({view: 'worker', route: [...prevState.route,id,'worker']}));
    };
    renderHomeView() {
        const {clusters} = this.state;
        return (
            <div className="body">
                <h2 className="cluster-name">Clusters:</h2>
                <div className="cluster-container">
                    <Table striped >
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
                                <td key={cluster.id} >{cluster.name}</td>
                                <td key={cluster.id}>{cluster.id}</td>
                                <td key={cluster.id} className="styled-link">{"taskgroup"}</td>
                                <td key={cluster.id } className="styled-link" onClick={() => this.containerhandleClick(cluster.id)}>{"containers"}</td>
                                <td key={cluster.id} className="styled-link" >{"WORKERS"}</td>
                            </tr>
                        ))}
                        </tbody>
                    </Table>
                </div>
            </div>
        )
    }

    renderWorkerView() {
        return false;
    }

    renderTaskView() {
        return false;
    }
    renderContainerView() {
        const {clusters} = this.state;
        const {route} = this.state;
        const currentClusterId = route[0]
        const cluster = clusters.find(cluster => cluster.id === currentClusterId);
        return (
            <div className="body">
                <h2 className="cluster-name">Containers: </h2>
                <div key={cluster.id} className="cluster-container">
                    <h2 className="cluster-name">Cluster Name: {cluster.name}</h2>
                    <Table striped className>
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
        )
    }


}

/*
* <!--
                {clusters.map(cluster => (
                    <div key={cluster.id}>
                        <p><b>* {cluster.name}</b></p>
                        <p><b>- {cluster.id}</b></p>
                        <p><b>- Containers:</b></p>
                        {cluster.containers.map(container => (
                            <div>
                                <p><b>. {container.id}</b></p>
                                <p><b>. {container.infoid}</b></p>
                                <p><b>. {container.host}</b></p>
                                <p><b>. {container.image}</b></p>
                                <p><b>. {container.command}</b></p>
                                <p><b>. {container.resets}</b></p>
                            </div>
                        ))}
                    </div>
                ))}-->*/
/*<input
    id="newClusters"
    value={newClusterName}
    onChange={this.handleNewClusterChange}
/>
& nbsp;
<button onClick={() => this.addClick()}>Add Cluster</button>

<button onClick={() => this.deleteClick(cluster.id)}>Delete Cluster</button>*/
export default App;
