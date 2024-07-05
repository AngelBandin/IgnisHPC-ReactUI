import React, { useState, useEffect} from 'react';
import {Component} from 'react';
import ReactDOM from "react-dom/client";
import logo from './favicon.ico';
import { Route, Routes, Link, useParams, useLocation} from 'react-router-dom';
// ... other imports

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Navbar, Nav, Container } from 'react-bootstrap';
import Table from 'react-bootstrap/Table';


const API_URL = "http://localhost:5038/";

function App() {
    const [clusters, setClusters] = useState([]);
    const [newClusterName, setNewClusterName] = useState('');
    //const [view, setView] = useState('home');
    //const [route, setRoute] = useState([]);
    const location = useLocation();

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
        <div className="App">
            <Navbar bg="dark" variant="dark" expand="lg" className="App-header">
                <Container>
                    <Navbar.Brand href="/">
                        <img src={logo} className="App-logo" alt="logo" />
                        IClusterApp
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto">
                            <Nav.Link as={Link} to="/" className={location.pathname === "/" ? "active" : ""}>Jobs</Nav.Link>
                            <Nav.Link as={Link} to="/workers" className={location.pathname === "/workers" ? "active" : ""}>Workers</Nav.Link>
                            <Nav.Link as={Link} to="/taskgroups" className={location.pathname === "/taskgroups" ? "active" : ""}>Taskgroups</Nav.Link>
                            <Nav.Link as={Link} to="/tasks" className={location.pathname === "/tasks" ? "active" : ""}>Tasks</Nav.Link>
                            <Nav.Link as={Link} to="/dataframes" className={location.pathname === "/dataframes" ? "active" : ""}>Dataframes</Nav.Link>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            <GenerateRoutes clusters={clusters}/>
        </div>

    );
}

function GenerateRoutes({clusters}) {
    let group;
    return (
        <Routes>
            <Route key="home" path="/" element={<ClusterView clusters={clusters}/>}/>
            {clusters.map((cluster) => (
                <Route key={`/${cluster.id}`} path={`/${cluster.id}`}>
                    {/* Cluster-level routes */}
                    <Route path="containers" element={<ContainerView clusterid={cluster.id} clustername={cluster.name} containers={cluster.containers}/>} />
                    {TaskGroupRoutes("taskgroup",cluster.taskgroup)}
                    <Route path="workers" element={<WorkersView clusterid={cluster.id} clustername={cluster.name} workers={cluster.workers} />}/>
                        {cluster.workers.map((worker) => (
                            TaskGroupRoutes(`workers/${worker.id}`,worker.taskgroup)
                        ))}
                </Route>
            ))}
        </Routes>
    );
}

function TaskGroupRoutes( basePath,taskgroup) {
    if (!taskgroup) {
        console.log("no hay taskgroup " + basePath)
        return null; // Terminate recursion if no dependencies

    }
    if (!taskgroup.dependencies || taskgroup.dependencies.length === 0) {
        console.log("no hay dependencies " + basePath)
        return (
            <Route path={`${basePath}`} element={<TaskView taskgroup={taskgroup} />}/>
        )
    }
    console.log("todo bien se supone " + basePath)
    return (
        <>
            <Route key = {`${basePath}`} path={`${basePath}`} element={<TaskView taskgroup={taskgroup} />}/>
            {taskgroup.dependencies.map((dependency, index) => (
                TaskGroupRoutes(`${basePath}/${index}`,dependency)
            ))}
        </>
    );
}

function ClusterView({clusters}) {
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
                            <td key={cluster.id} >{cluster.name}</td>
                            <td key={cluster.id}>{cluster.id}</td>

                            <td key={cluster.id} className="styled-link"><Link to={`/${cluster.id}/taskgroup`}>taskgroup</Link></td>
                            <td key={cluster.id } className="styled-link"><Link to={`/${cluster.id}/containers`}>containers</Link></td>
                            <td key={cluster.id} className="styled-link" ><Link to={`/${cluster.id}/workers`}>workers</Link></td>
                        </tr>

                    ))}
                    </tbody>
                </Table>
            </div>
        </div>
    )
}
function JobView({jobs}) {
    return (
        <div className="body">
            <h2 className="cluster-name">Jobs:</h2>
            {jobs.map(job => (
                <div className="cluster-container">
                    <h3 className="cluster-name">{job.name}</h3>
                    <Table striped>
                        <thead>
                        <tr>
                            <th>Cluster Name</th>
                            <th>ID</th>
                            <th>Properties</th>
                            <th>Taskgroup</th>
                            <th>Containers</th>
                            <th>Workers</th>
                        </tr>
                        </thead>
                        <tbody>
                        {job.clusters.map(cluster => (
                            <tr key={cluster.id}>
                                <td key={cluster.id}>{cluster.name}</td>
                                <td key={cluster.id}>{cluster.id}</td>
                                <td key={cluster.id} className="styled-link"><Link
                                    to={`/${cluster.id}/properties`}>{"properties"}</Link></td>
                                <td key={cluster.id} className="styled-link"><Link
                                    to={`/${cluster.id}/taskgroup`}>taskgroup</Link></td>
                                <td key={cluster.id} className="styled-link"><Link
                                    to={`/${cluster.id}/containers`}>containers</Link></td>
                                <td key={cluster.id} className="styled-link"><Link
                                    to={`/${cluster.id}/workers`}>workers</Link></td>
                            </tr>

                        ))}
                        </tbody>
                    </Table>
                </div>
            ))}
        </div>
    )
}


function WorkersView({clusterid, clustername, workers}) {

    return(
        <div className="body">
            <h2 className="cluster-name">Workers: </h2>
            <div key={clusterid} className="cluster-container">
                <h2 className="cluster-name">Cluster Name: {clustername}</h2>
                <Table striped>
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>ID</th>
                        <th>type</th>
                        <th>cores</th>
                        <th>taskgroup</th>
                    </tr>
                    </thead>
                    <tbody>
                    {workers.map(worker => (
                        <tr key={worker.id}>
                            <td>{worker.name}</td>
                            <td>{worker.id}</td>
                            <td>{worker.type}</td>
                            <td>{worker.cores}</td>
                            <td key={worker.id} className="styled-link"><Link
                                to={`/${clusterid}/workers/${worker.id}`}>taskgroup</Link></td>
                        </tr>
                    ))}
                    </tbody>
                </Table>
            </div>
        </div>)
}

function WorkersHomeView({clusterid, clustername, workers}) {

    return(
        <div className="body">
            <h2 className="cluster-name">Workers: </h2>
            <div key={clusterid} className="cluster-container">
                <h2 className="cluster-name">Cluster Name: {clustername}</h2>
                <Table striped>
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>ID</th>
                        <th>Cluster</th>
                        <th>type</th>
                        <th>cores</th>
                        <th>taskgroup</th>
                    </tr>
                    </thead>
                    <tbody>
                    {workers.map(worker => (
                        <tr key={worker.id}>
                            <td>{worker.name}</td>
                            <td>{worker.id}</td>
                            <td>{worker.cluster}</td>
                            <td>{worker.type}</td>
                            <td>{worker.cores}</td>
                            <td key={worker.id} className="styled-link"><Link
                                to={`/${clusterid}/workers/${worker.id}`}>taskgroup</Link></td>
                        </tr>
                    ))}
                    </tbody>
                </Table>
            </div>
        </div>)
}


function TaskGroupView({clusterid, clustername, workers}) {

    return(
        <div className="body">
            <h2 className="cluster-name">Workers: </h2>
            <div key={clusterid} className="cluster-container">
                <h2 className="cluster-name">Cluster Name: {clustername}</h2>
                <Table striped>
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>ID</th>
                        <th>type</th>
                        <th>cores</th>
                        <th>taskgroup</th>
                    </tr>
                    </thead>
                    <tbody>
                    {workers.map(worker => (
                        <tr key={worker.id}>
                            <td>{worker.name}</td>
                            <td>{worker.id}</td>
                            <td>{worker.type}</td>
                            <td>{worker.cores}</td>
                            <td key={worker.id} className="styled-link"><Link
                                to={`/${clusterid}/workers/${worker.id}`}>{"taskgroup"}</Link></td>
                        </tr>
                    ))}
                    </tbody>
                </Table>
            </div>
        </div>)
}


// Function to create the matrix

function createMatrix(tasks, dependencies) {
    const maxLength = Math.max(tasks.length, dependencies.length);
    const matrix = [];

    for (let i = 0; i < maxLength; i++) {
        const row = [];
        row.push(tasks[i] !== undefined ? tasks[i] : null);
        row.push(dependencies[i] !== undefined ? dependencies[i] : null);
        matrix.push(row);
    }

    return matrix;
}

function TaskView({ taskgroup }) {
    const location = useLocation();
    const currentPath = location.pathname;
    const matrix = createMatrix(taskgroup.tasks, taskgroup.dependencies);

    return (
        <div className="body">
            <h2 className="cluster-name">Taskgroup: </h2>
            <div className="cluster-container">
                <Table striped>
                    <thead>
                    <tr>
                        <th>Tasks</th>
                        <th>Dependencies</th>
                    </tr>
                    </thead>
                    <tbody>
                    {matrix.map((element, index) => (
                        <tr key={index}>
                            <td>{element[0] == null ? "" : element[0].name}</td>
                            <td>
                                {element[1] == null ? "" : (
                                    <Link to={`${currentPath}/${index}`}>taskgroup</Link>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </Table>
            </div>
        </div>
    );
}



function ContainerView({clusterid, clustername, containers}) {
    const location = useLocation();
    const currentPath = location.pathname;
    return (
        <div className="body">
            <h2 className="cluster-name">Containers: </h2>
            <div key={clusterid} className="cluster-container">
                <h2 className="cluster-name">Cluster Name: {clustername}</h2>
                <div className="table-container"><Table striped>
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Info ID</th>
                        <th>Properties</th>
                        <th>Host</th>
                        <th>Image</th>
                        <th>Command</th>
                        <th>Arguments</th>
                        <th>Cpus</th>
                        <th>Memory</th>
                        <th>Swappiness</th>
                        <th>Ports</th>
                        <th>NetworkMode</th>
                        <th>Binds</th>
                        <th>Volumes</th>
                        <th>Prefered Hosts</th>
                        <th>Hostnames</th>
                        <th>Environment Variables</th>
                        <th>Scheduler Params</th>
                        <th>Resets</th>

                    </tr>
                    </thead>
                    <tbody>
                    {containers.map(container => (
                        <tr key={container.id}>
                            <td>{container.id}</td>
                            <td key={clusterid} className="styled-link"><Link
                                to={`/${currentPath}/${container.id}/properties`}>{"properties"}</Link></td>
                            <td>{container.infoid || 'N/A'}</td>
                            <td>{container.host || 'N/A'}</td>
                            <td>{container.image || 'N/A'}</td>
                            <td>{container.command || 'N/A'}</td>
                            <td>{container.arguments && container.arguments.length > 0 ? (
                                <ul>
                                    {container.arguments.map((argument, index) => (
                                        <li key={index}>{argument}</li>
                                    ))}
                                </ul>
                            ) : (
                                "No arguments"
                            )}</td>
                            <td>{container.cpus || 'N/A'}</td>
                            <td>{container.memory || 'N/A'}</td>
                            <td>{container.swappiness || 'N/A'}</td>
                            <td><PortList ports={container.ports}/></td>
                            <td>{container.networkmode || 'N/A'}</td>
                            <td><BindList binds={container.binds}/></td>
                            <td><VolumeList volumes={container.volumes}/></td>
                            <td>{container.preferedhosts && container.preferedhosts.length > 0 ? (
                                <ul>
                                    {container.preferedhosts.map((preferedhost, index) => (
                                        <li key={index}>{preferedhost}</li>
                                    ))}
                                </ul>
                            ) : (
                                "No prefered Hosts"
                            )}</td>
                            <td>{container.hostnames && container.hostnames.length > 0 ? (
                                <ul>
                                    {container.hostnames.map((hostname, index) => (
                                        <li key={index}>{hostname}</li>
                                    ))}
                                </ul>
                            ) : (
                                "No hostnames"
                            )}</td>
                            <StringMapView variables={container.environmentVariables} string="Environment Variables"/>
                            <StringMapView variables={container.schedulerParams} string="Scheduler Params"/>
                            <td>{container.resets}</td>

                        </tr>
                    ))}
                    </tbody>
                </Table></div>
            </div>
        </div>
    );
}
function StringMapView({variables, string}) {
    if (!variables || Object.keys(variables).length === 0) {
        return <td>No {string}</td>;
    }

    return (
        <div className="env-vars">
            {Object.entries(variables).map(([key, value], index) => (
                <div key={index} className="env-var-item" title={`${key}=${value}`}>
                    <span className="env-var-key">{key}</span>:
                    <span className="env-var-value">{value.length > 20 ? value.substring(0, 20) + '...' : value}</span>
                </div>
            ))}
        </div>
    );
}
function VolumeList({volumes}) {
    if (!volumes || volumes.length === 0) {
        return <span>No volumes</span>;
    }

    return (
        <Table striped>
            <thead>
            <tr>
                <th>Container Path</th>
                <th>size</th>
            </tr>
            </thead>
            <tbody>
            {volumes.map((volume, index) => (
                <tr key={index}>
                    <td>{volume.containerPath || 'N/A'}</td>
                    <td>{volume.size || 'N/A'}</td>
                </tr>
            ))}
            </tbody>
        </Table>
    );
}
function BindList({ binds }) {
    if (!binds || binds.length === 0) {
        return <span>No binds</span>;
    }

    return (
        <Table striped>
            <thead>
            <tr>
                <th>Host Path</th>
                <th>Container Path</th>
                <th>Read Only</th>
            </tr>
            </thead>
            <tbody>
            {binds.map((bind, index) => (
                <tr key={index}>
                    <td>{bind.hostpath || 'N/A'}</td>
                    <td>{bind.containerpath || 'N/A'}</td>
                    <td>{bind.readOnly || 'N/A'}</td>
                </tr>
            ))}
            </tbody>
        </Table>
    );
}
function PortList({ ports }) {
    if (!ports || ports.length === 0) {
        return <span>No ports</span>;
    }

    return (
        <Table striped>
            <thead>
            <tr>
                <th>Container Port</th>
                <th>Host Port</th>
                <th>Protocol</th>
            </tr>
            </thead>
            <tbody>
            {ports.map((port, index) => (
                <tr key={index}>
                    <td>{port.containerPort || 'N/A'}</td>
                    <td>{port.hostPort || 'N/A'}</td>
                    <td>{port.protocol || 'N/A'}</td>
                </tr>
            ))}
            </tbody>
        </Table>
    );
}

function PropertiesView({clusterid, clustername, containers}) {

    /*
    *
    * Ver como sacar de lo que sale en las propiedades es que ni p puta idea*/
    return (
        <div className="body">
            <h2 className="cluster-name">Properties: </h2>
            <div key={clusterid} className="cluster-container">
                <h2 className="cluster-name">Cluster Name: {clustername}</h2>
                <Table striped>
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Info ID</th>
                        <th>Host</th>
                        <th>Image</th>
                        <th>Command</th>
                        {/*<th>Arguments</th>
                        <th>cpus</th>
                        <th>Memory</th>
                        <th>Swappiness</th>
                        <th>NetworkMode</th>
                        <th>Resets</th>
                        <th>Properties</th>*/}
                    </tr>
                    </thead>
                    <tbody>
                    {containers.map(container => (
                        <tr key={container.id}>
                            <td>{container.id}</td>
                            <td>{container.infoid}</td>
                            <td>{container.host}</td>
                            <td>{container.image}</td>
                            <td>{container.command}</td>
                            <td>{container.resets}</td>
                            {/*<td key={cluster.id} className="styled-link"><Link
                                to={`/${cluster.id}/properties`}>{"properties"}</Link></td>*/}
                        </tr>
                    ))}
                    </tbody>
                </Table>
            </div>
        </div>
    );
}


function DataFrameView({clusterid, clustername, dataframes}) {
    const location = useLocation();
    const currentPath = location.pathname;
    return(
        <div className="body">
            <h2 className="cluster-name">dataframes: </h2>
            <div key={clusterid} className="cluster-container">
                <h2 className="cluster-name">Cluster Name: {clustername}</h2>
                <Table striped>
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>ID</th>
                        <th>Worker</th>
                        <th>Containers</th>
                        <th>Taskgroup</th>
                    </tr>
                    </thead>
                    <tbody>
                    {dataframes.map(dataframe => (
                        <tr key={dataframe.id}>
                            <td>{dataframe.name}</td>
                            <td>{dataframe.id}</td>
                            <td key={dataframe.id} className="styled-link"><Link
                                to={`${currentPath}/${dataframe.id}/worker`}>{dataframe.worker.name}</Link></td>

                            <td key={dataframe.id} className="styled-link"><Link
                                to={`${currentPath}/${dataframe.id}/containers`}>containers</Link></td>
                        </tr>
                    ))}
                    </tbody>
                </Table>
            </div>
        </div>)
}
export default App;
