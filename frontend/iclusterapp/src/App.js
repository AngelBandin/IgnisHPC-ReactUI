import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, {useEffect, useState} from 'react';
import logo from './favicon.ico';
import {Link, Route, Routes, useLocation} from 'react-router-dom';
import {Breadcrumb, Button, Container, Navbar, Table} from 'react-bootstrap';

const API_PORT = window._env_?.REACT_APP_HOST_PORT || '5038';
const origin = window.location.origin;
const baseUrl = origin.substring(0, origin.lastIndexOf(':'));
const API_URL = process.env.REACT_APP_API_URL || `${baseUrl}:${API_PORT}/`;
let jobclusters = {}
let jobworkers = {}
let jobdataframes = {}
/*
* jobs{
*   jobname -> job-1{
*       cluster-name -> cluster-route
*    }
*{
*
* */

function App() {

    const [jobs, setJobs] = useState([]);

    useEffect(() => {
        document.title = "IgnisHPC Web UI";
        fetchData();

        const intervalId = setInterval(fetchData, 5000); // Actualiza cada 5 segundos

        return () => clearInterval(intervalId); // Limpia el intervalo cuando el componente se desmonta
    }, []);

    const fetchData = () => {
        fetch(API_URL + "api/v1/GetJobs")
            .then(response=> response.json())
            .then(data =>updateJobs(data))
            .catch(error => console.error("Error fetching jobs:", error));
    };

    const updateJobs = (newData) => {
        setJobs(prevJobs => {
            if (newData.length === 0) {
                // si los datos recuperados estan vacios, se devuelve una lista vacia
                return [];
            }

            return newData.map(newJob => {
                const existingJob = prevJobs.find(c => c.id === newJob.id);
                if (existingJob) {
                    return JSON.stringify(existingJob) !== JSON.stringify(newJob) ? newJob : existingJob;
                }
                return newJob;
            });
        });
    };
    return (
        <div className="App">
            <Navbar bg="dark" variant="dark" expand="lg" className="App-header">
                <Container>
                    <Navbar.Brand as={Link} to="/">
                        <img src={logo} className="App-logo" alt="logo" />
                        IgnisHPC Web UI
                    </Navbar.Brand>
                </Container>
            </Navbar>
            <Breadcrumbs/>
            <GenerateRoutes jobs={jobs}/>
        </div>

    );
}



function Breadcrumbs() {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);
    const noLinkParts = ['dependencies', 'subtasksgroup']; // parts that should not be clickable

    return (
        <Breadcrumb>
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
                Home
            </Breadcrumb.Item>
            {pathnames.map((name, index) => {
                const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
                const isLast = index === pathnames.length - 1;
                const isNoLinkPart = noLinkParts.includes(name);
                return isLast || isNoLinkPart? (
                    <Breadcrumb.Item active key={name}>
                        {name}
                    </Breadcrumb.Item>
                ) : (
                    <Breadcrumb.Item linkAs={Link} linkProps={{ to: routeTo }} key={name}>
                        {name}
                    </Breadcrumb.Item>
                );
            })}
        </Breadcrumb>
    );
}

// Initialize these objects for each job
function initializeJobObjects(jobs) {
    jobs.forEach(job => {
        if (!jobclusters[job.id]) jobclusters[job.id] = {};
        if (!jobworkers[job.id]) jobworkers[job.id] = {};
        if (!jobdataframes[job.id]) jobdataframes[job.id] = {};
    });
}

function GenerateRoutes({jobs}) {
    initializeJobObjects(jobs);
    return (
        <Routes>
            {jobs.length > 0 && <Route key="home" path="/" element={<JobView jobs={jobs}/>}/>}
            {jobs && jobs.map((job) => (
                <React.Fragment key={`job-${job.id}`}>
                    {job && <Route path={`/job-${job.id}`} element={<JobDetailView job={job}/>}/>}
                    {job && <Route path={`/job-${job.id}/driver`} element={<JobDriverView job={job}/>}/>}
                    {job.clusters && job.clusters.map((cluster) => (
                        <React.Fragment key={`Cluster(${cluster.id})`}>
                            {cluster && <Route path={`/job-${job.id}/Cluster(${cluster.id})`} element={<ClusterDetailView cluster={cluster}/>}/>}
                            {(() => {
                                const clusterpath = `/job-${job.id}/Cluster(${cluster.id})`;
                                const clusterTaskname = cluster.taskgroup.tasks[0].name.replace(/.*<--\s*/, "");
                                jobclusters[job.id][clusterTaskname] = `${clusterpath}/taskgroup`
                                return (
                                    <>
                                        {cluster.containers && <Route path={`${clusterpath}/containers`} element={<ContainerClusterView cluster={cluster}/>} />}
                                        {cluster.properties && <Route path={`${clusterpath}/properties`} element={<PropertiesClusterView cluster={cluster}/>} />}
                                        {cluster.containers && cluster.containers.map((container) => (
                                            <React.Fragment key={`container-${container.id}`}>
                                                {container && <Route path={`${clusterpath}/containers/container-(${container.id})`} element={<ContainerDetailView container={container}/>}/>}
                                                {container && <Route path={`${clusterpath}/containers/container-${container.id})/properties`} element={<PropertiesContainerView container={container}/>}/>}
                                            </React.Fragment>
                                        ))}
                                        {cluster.taskgroup && TaskGroupRoutes(`${clusterpath}/taskgroup`, cluster.taskgroup, clusterpath)}
                                        {cluster.workers && <Route path={`${clusterpath}/workers`} element={<WorkersView cluster={cluster} />}/>}
                                        {cluster.workers && cluster.workers.map((worker) => {
                                            const workerpath = `${clusterpath}/workers/Worker(${worker.id})`;
                                            const workerTaskname = worker.taskgroup.tasks[0].name.replace(/.*<--\s*/, "");
                                            jobworkers[job.id][workerTaskname] = `${workerpath}/taskgroup`
                                            return (
                                                <React.Fragment key={`Worker(${worker.id})`}>
                                                    {worker && <Route path={`${workerpath}`} element={<WorkerDetailView worker={worker}/>}/>}
                                                    {worker.containers && <Route path={`${workerpath}/containers`} element={<ContainerWorkerView worker={worker}/>}/>}
                                                    {worker.dataframes && <Route path={`${workerpath}/dataframes`} element={<DataframeWorkerView worker={worker}/>}/>}

                                                    {worker.dataframes && worker.dataframes.map((dataframe) => {
                                                        const dataframepath = `${workerpath}/dataframes/Dataframe(${dataframe.id})`;
                                                        const dataframeTaskname = dataframe.taskgroup.tasks[0].name.replace(/.*<--\s*/, "");
                                                        jobdataframes[job.id][dataframeTaskname] = `${dataframepath}/taskgroup`
                                                        return(<React.Fragment key={`Dataframe(${dataframe.id})`}>
                                                            {dataframe && <Route
                                                                path={`${dataframepath}`}
                                                                element={<DataFrameDetailView
                                                                    dataframe={dataframe}/>}/>}
                                                            {dataframe && dataframe.taskgroup && TaskGroupRoutes(`${dataframepath}/taskgroup`, dataframe.taskgroup, job.id)}
                                                        </React.Fragment>
                                                        );
                                                    })}
                                                    {worker && worker.taskgroup && TaskGroupRoutes(`${workerpath}/taskgroup`, worker.taskgroup, job.id)}
                                                </React.Fragment>
                                            );
                                        })}
                                    </>
                                );
                            })()}
                        </React.Fragment>
                    ))}
                </React.Fragment>
            ))}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

function TaskGroupRoutes( basePath,taskgroup,jobid) {
    if (!taskgroup) {
        return null; // Terminate recursion if no dependencies

    }
    return (
        <>
            <Route key = {`${basePath}`} path={`${basePath}`} element={<TaskView taskgroup={taskgroup} jobid={jobid} />}/>
            {taskgroup.dependencies &&  taskgroup.dependencies.length > 0 && taskgroup.dependencies.map((dependency, index) => (
                TaskGroupRoutes(`${basePath}/dependencies/taskgroup-${index}`,dependency, jobid)
            ))}
            {taskgroup.subTasksGroup &&  taskgroup.subTasksGroup.length > 0 && taskgroup.subTasksGroup.map((dependency, index) => (
                TaskGroupRoutes(`${basePath}/subtasksgroup/taskgroup-${index}`,dependency, jobid)
            ))}
        </>
    );
}

function NotFound() {
    return (
        <div className="body">
            <h2 className="cluster-name">No hay información disponible</h2>
            <p>La página que estás buscando no existe o ha sido eliminada.</p>
            <Link to="/">Volver a la página principal</Link>
        </div>
    );
}

function JobView({jobs}) {

    return (
        <div className="body">
            <h2 className="cluster-name">Jobs:</h2>

                <div className="cluster-container">
                    <Table striped>
                        <thead>
                        <tr>
                            <th>Job Name</th>
                            <th>ID</th>
                            <th>Driver</th>
                            <th>Directory</th>
                            <th>Worker</th>
                            <th>Status</th>
                        </tr>
                        </thead>
                        <tbody>
                        {jobs.map(job => (

                            <tr key={job.id}>
                                <td className="styled-link"><Link
                                    to={`/job-${job.id}`}>{job.name}</Link></td>
                                <td>{job.id}</td>
                                <td className="styled-link"><Link
                                    to={`/job-${job.id}/driver`}>driver</Link></td>
                                <td>{job.directory || "N/A"}</td>
                                <td>{job.worker || "N/A"}</td>
                                <td>{job.status|| "Finished"}</td>
                            </tr>
                        ))}
                        </tbody>
                    </Table>
                </div>
        </div>
    )
}

function JobDetailView({job}) {
    if (!job) {
        return <div>Este trabajo ya no existe. <Link to="/">Volver a la página principal</Link></div>;
    }
    return (
        <div className="body">
            <h2 className="cluster-name">{job.name}</h2>
            <h4 className="cluster-name">Details:</h4>
            <Table striped>
                <thead>
                <tr>
                    <th>Job Name</th>
                    <th>ID</th>
                    <th>Driver</th>
                    <th>Directory</th>
                    <th>Worker</th>
                    <th>Status</th>
                </tr>
                </thead>
                <tbody>
                <tr key={job.id}>
                    <td className="styled-link"><Link
                        to={`/job-${job.id}`}>{job.name}</Link></td>
                    <td>{job.id}</td>
                    <td className="styled-link"><Link
                        to={`/job-${job.id}/driver`}>driver</Link></td>
                    <td>{job.directory || "N/A"}</td>
                    <td>{job.worker || "N/A"}</td>
                    <td>{job.status || "Finished"}</td>
                </tr>
                </tbody>
            </Table>
            <h4 className="cluster-name">Clusters:</h4>
            <div className="cluster-container">
                <Table striped>
                    <thead>
                    <tr>
                        <th>Cluster Name</th>
                        <th>ID</th>
                        <th>Taskgroup</th>
                        <th>Containers</th>
                        <th>Workers</th>
                        <th>Properties</th>
                    </tr>
                    </thead>
                    <tbody>
                    {job.clusters.map(cluster => (
                        <tr key={cluster.id}>
                            <td key={cluster.id}>{cluster.name}</td>
                            <td key={cluster.id}>{cluster.id}</td>

                            {cluster.taskgroup ? (<td key={cluster.id} className="styled-link">
                                <Link to={`/job-${job.id}/Cluster(${cluster.id})/taskgroup`}>taskgroup</Link>
                            </td>) : <td key={cluster.id}>N/A</td>}
                            <td key={cluster.id} className="styled-link">{<Link
                                to={`/job-${job.id}/Cluster(${cluster.id})/containers`}>containers</Link>||"N/A"}</td>
                            <td key={cluster.id} className="styled-link">{<Link
                                to={`/job-${job.id}/Cluster(${cluster.id})/workers`}>workers</Link> || "N/A"}</td>
                            <td key={cluster.id} className="styled-link">{<Link
                                to={`/job-${job.id}/Cluster(${cluster.id})/properties`}>properties</Link>|| "N/A"}</td>
                        </tr>

                    ))}
                    </tbody>
                </Table>
            </div>
        </div>
    )
}

function JobDriverView({job}) {
    if (!job) {
        return <div>El Driver del trabajo ya no existe. <Link to="/">Volver a la página principal</Link></div>;
    }
    return (
        <div className="body">
            <h2 className="cluster-name">{job.name}</h2>
            <h4 className="cluster-name">Details:</h4>
            <Table striped>
                <thead>
                <tr>
                    <th>Job Name</th>
                    <th>ID</th>
                    <th>Driver</th>
                    <th>Directory</th>
                    <th>Worker</th>
                </tr>
                </thead>
                <tbody>
                <tr key={job.id}>
                    <td className="styled-link"><Link
                        to={`/job-${job.id}`}>{job.name}</Link></td>
                    <td>{job.id}</td>
                    <td className="styled-link"><Link
                        to={`/job-${job.id}/driver`}>driver</Link></td>
                    <td>{job.directory || "N/A"}</td>
                    <td>{job.worker || "N/A"}</td>
                </tr>
                </tbody>
            </Table>
            <h4 className="cluster-name">Driver:</h4>
            <ContainerView containers={[job.driver]}/>
        </div>
    )
}

function ClusterDetailView({cluster}) {
    const location = useLocation();
    const currentPath = location.pathname;
    if (!cluster) {
        return <div>Este Cluster ya no existe. <Link to="/">Volver a la página principal</Link></div>;
    }
    return(
        <div className="body">
            <h2 className="cluster-name">{cluster.name} </h2>
            <h3 className="cluster-name">Details: </h3>
            <Table striped>
                <thead>
                <tr>
                    <th>Cluster Name</th>
                    <th>ID</th>
                    <th>Taskgroup</th>
                    <th>Containers</th>
                    <th>Workers</th>
                    <th>Properties</th>
                </tr>
                </thead>
                <tbody>
                <tr key={cluster.id}>
                    <td key={cluster.id}>{cluster.name}</td>
                    <td key={cluster.id}>{cluster.id}</td>

                    <td key={cluster.id} className="styled-link"><Link
                        to={`${currentPath}/taskgroup`}>taskgroup</Link></td>
                    <td key={cluster.id} className="styled-link"><Link
                        to={`${currentPath}/containers`}>containers</Link></td>
                    <td key={cluster.id} className="styled-link"><Link
                        to={`${currentPath}/workers`}>workers</Link></td>
                    <td key={cluster.id} className="styled-link"><Link
                        to={`${currentPath}/properties`}>properties</Link></td>
                </tr>


                </tbody>
            </Table>
        </div>)
}

function WorkersView({cluster}) {
    const location = useLocation();
    const currentPath = location.pathname;
    const lastSlashIndex = currentPath.lastIndexOf('/');
    const pathtocluster = currentPath.substring(0, lastSlashIndex);
    const workers = cluster.workers

    if (!cluster) {
        return <div>Este Cluster ya no existe. <Link to="/">Volver a la página principal</Link></div>;
    }
    return(
        <div className="body">
            <h2 className="cluster-name">{cluster.name} </h2>
            <h3 className="cluster-name">Details: </h3>
            <Table striped>
                <thead>
                <tr>
                    <th>Cluster Name</th>
                    <th>ID</th>
                    <th>Taskgroup</th>
                    <th>Containers</th>
                    <th>Workers</th>
                    <th>Properties</th>
                </tr>
                </thead>
                <tbody>
                <tr key={cluster.id}>
                    <td key={cluster.id}>{cluster.name}</td>
                    <td key={cluster.id}>{cluster.id}</td>

                    <td key={cluster.id} className="styled-link"><Link
                        to={`${pathtocluster}/taskgroup`}>taskgroup</Link></td>
                    <td key={cluster.id} className="styled-link"><Link
                        to={`${pathtocluster}/containers`}>containers</Link></td>
                    <td key={cluster.id} className="styled-link"><Link
                        to={`${pathtocluster}/workers`}>workers</Link></td>
                    <td key={cluster.id} className="styled-link"><Link
                        to={`${pathtocluster}/properties`}>properties</Link></td>
                </tr>


                </tbody>
            </Table>
            <h3 className="cluster-name">Workers: </h3>

            <div key={cluster.id} className="cluster-container">
                <Table striped>
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>ID</th>
                        <th>type</th>
                        <th>cores</th>
                        <th>taskgroup</th>
                        <th>containers</th>
                        <th>dataframes</th>
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
                                to={`${currentPath}/Worker(${worker.id})/taskgroup`}>taskgroup</Link></td>
                            <td key={worker.id} className="styled-link"><Link
                                to={`${currentPath}/Worker(${worker.id})/containers`}>containers</Link></td>
                            <td key={worker.id} className="styled-link"><Link
                                to={`${currentPath}/Worker(${worker.id})/dataframes`}>dataframes</Link></td>
                        </tr>
                    ))}
                    </tbody>
                </Table>
            </div>
        </div>)
}

function WorkerDetailView({worker}) {
    const location = useLocation();
    const currentPath = location.pathname;
    if (!worker) {
        return <div>Este Worker ya no existe. <Link to="/">Volver a la página principal</Link></div>;
    }
    return(
        <div className="body">
            <h2 className="cluster-name">{worker.name}:</h2>
            <div className="cluster-container">
                <Table striped>
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>ID</th>
                        <th>type</th>
                        <th>cores</th>
                        <th>taskgroup</th>
                        <th>containers</th>
                        <th>dataframes</th>
                    </tr>
                    </thead>
                    <tbody>
                        <tr key={worker.id}>
                            <td>{worker.name}</td>
                            <td>{worker.id}</td>
                            <td>{worker.type}</td>
                            <td>{worker.cores}</td>
                            <td key={worker.id} className="styled-link"><Link
                                to={`${currentPath}/taskgroup`}>taskgroup</Link></td>
                            <td key={worker.id} className="styled-link"><Link
                                to={`${currentPath}/containers`}>containers</Link></td>
                            <td key={worker.id} className="styled-link"><Link
                                to={`${currentPath}/dataframes`}>dataframes</Link></td>

                        </tr>
                    </tbody>
                </Table>
            </div>
        </div>)
}

function TaskView({taskgroup, jobid}) {
    const location = useLocation();
    const currentPath = location.pathname;
    if (!taskgroup) {
        return <div>Este Taskgroup ya no existe. <Link to="/">Volver a la página principal</Link></div>;
    }
    return (
        <div className="body">
            <h3 className="cluster-name">Taskgroup:</h3>
            <div className="cluster-container">
                <Table striped>
                    <thead>
                    <tr>
                        <th>Tasks</th>
                    </tr>
                    </thead>
                    <tbody>
                    {taskgroup.tasks.map((task) => (
                        <tr>
                            <td>{task.name}</td>
                        </tr>
                    ))}
                    </tbody>
                </Table>
                <Table striped>
                    <thead>
                    <tr>
                        <th>Dependencies</th>
                    </tr>
                    </thead>
                    <tbody>
                    {taskgroup.dependencies &&
                        taskgroup.dependencies.map((dependency, index) => {
                            let linkPath;
                            let dependencyName;
                            switch (dependency.class) {
                                case "Cluster":
                                    linkPath = jobclusters[jobid][dependency.parent];
                                    dependencyName = dependency.parent;
                                    break;
                                case "Worker":
                                    linkPath = jobworkers[jobid][dependency.parent];
                                    dependencyName = dependency.parent;
                                    break;
                                case "Dataframe":
                                    linkPath = jobdataframes[jobid][dependency.parent];
                                    dependencyName = dependency.parent;
                                    break;
                                default:
                                    linkPath = `${currentPath}/dependencies/taskgroup-${index}`;
                                    dependencyName = dependency.tasks[0].name.replace(/.*<--\s*/, "");

                            }
                            return (
                                <tr key={index}>
                                    <td>
                                        <Link to={linkPath}>{dependencyName}</Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
                <Table striped>
                    <thead>
                    <tr>
                        <th>subTasksGroup</th>
                    </tr>
                    </thead>
                    <tbody>
                    {taskgroup.subTasksGroup && taskgroup.subTasksGroup.map((subtaskgroup, index) => (
                        <tr key={index}>
                            <td>
                                <Link to={`${currentPath}/subtasksgroup/taskgroup-${index}`}>{subtaskgroup.tasks[0].name.replace(/.*<--\s*/, "")}</Link>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </Table>
            </div>
        </div>
    );
}

function ContainerClusterView({cluster}) {
    const location = useLocation();
    const currentPath = location.pathname;
    const lastSlashIndex = currentPath.lastIndexOf('/');
    const pathtocluster = currentPath.substring(0, lastSlashIndex);

    if (!cluster) {
        return <div>Este Cluster ya no existe. <Link to="/">Volver a la página principal</Link></div>;
    }
    return(
        <div className="body">
            <h2 className="cluster-name">{cluster.name} </h2>
            <h3 className="cluster-name">Details: </h3>
            <Table striped>
                <thead>
                <tr>
                    <th>Cluster Name</th>
                    <th>ID</th>
                    <th>Taskgroup</th>
                    <th>Containers</th>
                    <th>Workers</th>
                    <th>Properties</th>
                </tr>
                </thead>
                <tbody>
                <tr key={cluster.id}>
                    <td key={cluster.id}>{cluster.name}</td>
                    <td key={cluster.id}>{cluster.id}</td>

                    <td key={cluster.id} className="styled-link"><Link
                        to={`${pathtocluster}/taskgroup`}>taskgroup</Link></td>
                    <td key={cluster.id} className="styled-link"><Link
                        to={`${pathtocluster}/containers`}>containers</Link></td>
                    <td key={cluster.id} className="styled-link"><Link
                        to={`${pathtocluster}/workers`}>workers</Link></td>
                    <td key={cluster.id} className="styled-link"><Link
                        to={`${pathtocluster}/properties`}>properties</Link></td>

                </tr>


                </tbody>
            </Table>
            <h2 className="cluster-name">Containers: </h2>
            <ContainerView containers={cluster.containers}/>
        </div>)
}

function ContainerWorkerView({worker}) {
    const location = useLocation();
    const currentPath = location.pathname;
    const lastSlashIndex = currentPath.lastIndexOf('/');
    const pathtoworker = currentPath.substring(0, lastSlashIndex);
    if (!worker) {
        return <div>Este Worker ya no existe. <Link to="/">Volver a la página principal</Link></div>;
    }
    return(
        <div className="body">
            <h2 className="cluster-name">{worker.name} </h2>
            <h3 className="cluster-name">Details: </h3>
            <Table striped>
                <thead>
                <tr>
                    <th>Name</th>
                    <th>ID</th>
                    <th>type</th>
                    <th>cores</th>
                    <th>taskgroup</th>
                    <th>containers</th>
                    <th>dataframes</th>
                </tr>
                </thead>
                <tbody>
                <tr key={worker.id}>
                    <td>{worker.name}</td>
                    <td>{worker.id}</td>
                    <td>{worker.type}</td>
                    <td>{worker.cores}</td>
                    <td key={worker.id} className="styled-link"><Link
                        to={`${pathtoworker}/taskgroup`}>taskgroup</Link></td>
                    <td key={worker.id} className="styled-link"><Link
                        to={`${pathtoworker}/containers`}>containers</Link></td>
                    <td key={worker.id} className="styled-link"><Link
                        to={`${pathtoworker}/dataframes`}>dataframes</Link></td>
                </tr>
                </tbody>
            </Table>
            <h2 className="cluster-name">Containers: </h2>
            <ContainerView containers={worker.containers}/>
        </div>)
}

function ContainerView({containers}) {
    const location = useLocation();
    const currentPath = location.pathname;
    const segments = currentPath.split('/').filter(segment => segment !== '');

    // Get the first two segments and join them
    const pathtocluster = '/' + segments.slice(0, 2).join('/');
    const [showAllColumns, setShowAllColumns] = useState(false);

    const mainColumns = ['ID', 'Cluster','Info ID', 'Properties', 'Host', 'Cpus', 'Memory', 'Ports'];
    const allColumns = [
        'ID', 'Cluster','Info ID', 'Properties', 'Host', 'Cpus', 'Memory', 'Ports', 'Image', 'Command', 'Arguments',
        'Swappiness', 'NetworkMode', 'Binds', 'Volumes',
        'Prefered Hosts', 'Hostnames', 'Environment Variables', 'Scheduler Params',
        'Resets'
    ];

    const columnsToShow = showAllColumns ? allColumns : mainColumns;

    const toggleColumns = () => setShowAllColumns(!showAllColumns);

    return (
        <div className="body">
                <div className="table-container">
                    <Table striped>
                        <thead>
                        <tr>
                            {columnsToShow.map(column => (
                                <th key={column}>{column}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {containers.map(container => (
                            <tr key={container.id}>
                                <td>{container.id}</td>
                                {(container.clusterId || container.clusterId === 0) && container.clusterId !== -1 ? (<td key={container.clusterId} className="styled-link">
                                    <Link
                                        to={`${pathtocluster}`}>Cluster</Link>
                                </td>) : <td>N/A</td>}
                                <td>{container.infoid || 'N/A'}</td>
                                <td className="styled-link">
                                    <Link
                                        to={`${pathtocluster}/containers/container-${container.id}/properties`}>properties</Link>
                                </td>
                                <td>{container.host || 'N/A'}</td>
                                <td>{container.cpus || 'N/A'}</td>
                                <td>{container.memory || 'N/A'}</td>
                                <td><PortList ports={container.ports}/></td>

                                {showAllColumns && (
                                    <>
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
                                        <td>{container.swappiness}</td>
                                        <td>{container.networkMode || 'N/A'}</td>
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
                                        <td><StringMapView variables={container.environmentVariables}
                                                           string="Environment Variables"/></td>
                                        <td><StringMapView variables={container.schedulerParams}
                                                           string="Scheduler Params"/></td>
                                        <td>{container.resets}</td>
                                    </>
                                )}
                            </tr>
                        ))}
                        </tbody>
                    </Table>
                </div>
            <Button
                className="toggle-columns-btn"
                onClick={toggleColumns}
                    variant="light"
                >
                    {showAllColumns ? 'Show Less' : 'Show More'}
                </Button>
        </div>
    );
}

function ContainerDetailView({container}) {
    if (!container) {
        return <div>Este Container ya no existe. <Link to="/">Volver a la página principal</Link></div>;
    }
    return(
        <div className="body">
            <h2 className="cluster-name">Container {container.id}</h2>
            <ContainerView containers={[container]}/>
        </div>
    )
}

function StringMapView({variables, string}) {
    if (!variables || Object.keys(variables).length === 0) {
        return <td>No {string}</td>;
    }

    return (
        <td className="env-vars">
            {Object.entries(variables).map(([key, value], index) => (
                <div key={index} className="env-var-item" title={`${key}=${value}`}>
                    <span className="env-var-key">{key}</span>:
                    <span className="env-var-value">{value.length > 20 ? value.substring(0, 20) + '...' : value}</span>
                </div>
            ))}
        </td>
    );
}

/*function safeToString(value) {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
}*/
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
                    <td>{bind.readOnly }</td>
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
        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
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
        </div>
    );

}

function PropertiesClusterView({cluster}) {
    const location = useLocation();
    const currentPath = location.pathname;
    const lastSlashIndex = currentPath.lastIndexOf('/');
    const pathtocluster = currentPath.substring(0, lastSlashIndex);

    if (!cluster) {
        return <div>Este Cluster ya no existe. <Link to="/">Volver a la página principal</Link></div>;
    }
    return(
        <div className="body">
            <h2 className="cluster-name">{cluster.name} </h2>
            <h3 className="cluster-name">Details: </h3>
            <Table striped>
                <thead>
                <tr>
                    <th>Cluster Name</th>
                    <th>ID</th>
                    <th>Taskgroup</th>
                    <th>Containers</th>
                    <th>Workers</th>
                    <th>Properties</th>
                </tr>
                </thead>
                <tbody>
                <tr key={cluster.id}>
                    <td key={cluster.id}>{cluster.name}</td>
                    <td key={cluster.id}>{cluster.id}</td>

                    <td key={cluster.id} className="styled-link"><Link
                        to={`${pathtocluster}/taskgroup`}>taskgroup</Link></td>
                    <td key={cluster.id} className="styled-link"><Link
                        to={`${pathtocluster}/containers`}>containers</Link></td>
                    <td key={cluster.id} className="styled-link"><Link
                        to={`${pathtocluster}/workers`}>workers</Link></td>
                    <td key={cluster.id} className="styled-link"><Link
                        to={`${pathtocluster}/properties`}>properties</Link></td>
                </tr>


                </tbody>
            </Table>
            <PropertiesView properties={cluster.properties}/>
        </div>)
}

function PropertiesContainerView({container}) {
    if (!container) {
        return <div>Este Container ya no existe. <Link to="/">Volver a la página principal</Link></div>;
    }
    return(
        <div className="body">
            <h2 className="cluster-name">Container {container.id}</h2>
            <h3 className="cluster-name">Details: </h3>
            <ContainerView containers={[container]}/>
            <PropertiesView properties={container.properties}/>
        </div>)
}

function PropertiesView({properties}) {

    /*
    *
    * Ver como sacar de lo que sale en las propiedades es que ni p puta idea*/
    return (
        <div className="body">
            <h2 className="cluster-name">Properties: </h2>
            <div className="cluster-container">
                <HashTableYAMLStyle hashtable={properties} />
            </div>
        </div>
    );
}

function HashTableYAMLStyle({ hashtable }) {
    if (!hashtable || Object.keys(hashtable).length === 0) {
        return <p>No entries</p>;
    }

    const renderValue = (value, indent = 0) => {
        if (typeof value === 'object' && value !== null) {
            return (
                <div style={{ marginLeft: `${indent * 20}px` }}>
                    {Object.entries(value).map(([k, v]) => (
                        <div key={k}>
                            {k}:
                            {renderValue(v, indent + 1)}
                        </div>
                    ))}
                </div>
            );
        }
        return <span style={{ marginLeft: '10px' }}>{String(value)}</span>;
    };

    return (
        <pre style={{ textAlign: 'left', fontFamily: 'monospace' }}>
      {Object.entries(hashtable).map(([key, value]) => (
          <div key={key}>
              {key}:{renderValue(value)}
          </div>
      ))}
    </pre>
    );
}

function DataframeWorkerView({worker}) {
    const location = useLocation();
    const currentPath = location.pathname;
    const lastSlashIndex = currentPath.lastIndexOf('/');
    const pathtoworker = currentPath.substring(0, lastSlashIndex);
    if (!worker) {
        return <div>Este Worker ya no existe. <Link to="/">Volver a la página principal</Link></div>;
    }
    return(
        <div className="body">
            <h2 className="cluster-name">{worker.name} </h2>
            <h3 className="cluster-name">Details: </h3>
            <Table striped>
                <thead>
                <tr>
                    <th>Name</th>
                    <th>ID</th>
                    <th>type</th>
                    <th>cores</th>
                    <th>taskgroup</th>
                    <th>containers</th>
                    <th>dataframes</th>
                </tr>
                </thead>
                <tbody>
                <tr key={worker.id}>
                    <td>{worker.name}</td>
                    <td>{worker.id}</td>
                    <td>{worker.type}</td>
                    <td>{worker.cores}</td>
                    <td key={worker.id} className="styled-link"><Link
                        to={`${pathtoworker}/taskgroup`}>taskgroup</Link></td>
                    <td key={worker.id} className="styled-link"><Link
                        to={`${pathtoworker}/containers`}>containers</Link></td>
                    <td key={worker.id} className="styled-link"><Link
                        to={`${pathtoworker}/dataframes`}>dataframes</Link></td>
                </tr>
                </tbody>
            </Table>
            <h3 className="cluster-name">Dataframes: </h3>
            <DataFramesView dataframes={worker.dataframes}/>
        </div>)
}

function DataFrameDetailView({dataframe}) {
    if (!dataframe) {
        return <div>Este Dataframe ya no existe. <Link to="/">Volver a la página principal</Link></div>;
    }
    return(
        <div className="body">
            <h2 className="cluster-name">{dataframe.name}:</h2>
            <DataFramesView dataframes = {[dataframe]} detail = {true} />
        </div>)
}

function DataFramesView({dataframes, detail = false}) {
    const location = useLocation();
    let currentPath = location.pathname;
    let lastSlashIndex = currentPath.lastIndexOf('/');
    if(detail){
        currentPath = currentPath.substring(0, lastSlashIndex);
        lastSlashIndex = currentPath.lastIndexOf('/');
    }
    const pathtoworker = currentPath.substring(0, lastSlashIndex);

    return(
        <div className="body">
            <div className="cluster-container">
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
                    {dataframes && dataframes.map(dataframe => (
                        <tr key={dataframe.id}>
                            <td>{dataframe.name}</td>
                            <td>{dataframe.id}</td>
                            <td key={dataframe.id} className="styled-link"><Link
                                to={`${pathtoworker}`}>{dataframe.worker}</Link></td>
                            <td key={dataframe.id} className="styled-link"><Link
                                to={`${pathtoworker}/containers`}>containers</Link></td>
                            <td key={dataframe.id} className="styled-link"><Link
                                to={`${currentPath}/Dataframe(${dataframe.id})/taskgroup`}>taskgroup</Link></td>
                        </tr>
                    ))}
                    </tbody>
                </Table>
            </div>
        </div>)
}

export default App;
