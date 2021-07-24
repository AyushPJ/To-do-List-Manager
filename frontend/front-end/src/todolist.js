import React, { Component } from 'react';
import './App.css';
import { Collapse, Card, Tabs, Tab, Nav} from 'react-bootstrap';




class ToDoListElement extends Component {
    constructor(props) {
        super(props);
        this.state = {
            descRowVisible: false,
            descVisible: false,
            timeFromDue: "",
        }
    }
    togglePropState(prop) {
        let newState = Object.assign(this.state);
        if (this.state[prop]) {
            newState[prop] = false;
        }
        else {
            newState[prop] = true;
        }
        this.setState(newState);
    }

    remainingTime(taskDue) {
        let now = new Date().getTime();
        let due = new Date(taskDue).getTime();
        let diff = due - now;
        let overdue = false;
        if (diff < 0)
            overdue = true;
        diff = Math.abs(diff);
        const msInDay = 86400000;
        const msInHour = 3600000;
        const msInMin = 60000;
        let timeFromDue = "";
        if (diff > msInDay)
            timeFromDue = Math.round(diff / msInDay) + " day/s";
        else if (diff > msInHour)
            timeFromDue = Math.round(diff / msInHour) + " hour/s";
        else
            timeFromDue = Math.round(diff / msInMin) + " min/s";
        if (overdue) {
            timeFromDue = timeFromDue + " overdue";
        }
        else {
            timeFromDue = "Due in " + timeFromDue;
        }
        let newState = Object.assign({}, this.state);
        newState["timeFromDue"] = timeFromDue;
        this.setState(newState);
    }
    render() {


        const plusSVG = <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-plus-lg" viewBox="0 0 16 16">
            <path d="M8 0a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2H9v6a1 1 0 1 1-2 0V9H1a1 1 0 0 1 0-2h6V1a1 1 0 0 1 1-1z" />
        </svg>;
        const minusSVG = <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-dash-lg" viewBox="0 0 16 16">
            <path d="M0 8a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H1a1 1 0 0 1-1-1z" />
        </svg>;
        let descButton = plusSVG;
        if (this.state.descVisible)
            descButton = minusSVG;

        let task = this.props.task;
        let due = new Date(task.taskDue).toLocaleString('en-ae');
        let tags = task.tags.map((tag, index) => {
            return (
                <a key={"tag_" + index} className="me-2" href='#'>{'#' + tag}</a>
            );
        });
        let desc = <span className="text-muted"><i>(empty description)</i></span>;
        if (task.taskDesc !== "")
            desc = task.taskDesc;
        return (
            <React.Fragment>
                <tr key={"entry_" + this.props.index}>
                    <td><input type="checkbox" checked={this.props.selected} onChange={(e) => this.props.callback(e, task.id)} /></td>
                    <th scope="row">{task.id}</th>
                    <td>{task.taskName}</td>
                    <td title={this.state.timeFromDue} onMouseOver={() => this.remainingTime(task.taskDue)}>{due}</td>
                    <td>{tags}</td>
                    <td><button className="btn btn-outline-secondary btn-sm" onClick={() => this.togglePropState("descVisible")}>{descButton}</button></td>
                </tr>
                <tr hidden={!this.state.descRowVisible}>
                    <td colSpan="6">
                        <Collapse onEnter={() => this.togglePropState("descRowVisible")} onExited={() => this.togglePropState("descRowVisible")} in={this.state.descVisible} id={"desc_" + this.state.index} key={"desc_" + this.props.index}>
                            <Card>
                                <Card.Body>
                                    <h5>Task Description</h5>
                                    {desc}
                                </Card.Body>
                            </Card>
                        </Collapse>
                    </td>
                </tr>
            </React.Fragment>
        );
    }
}

class ToDoList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selected: [],
            key: "incompleteTasks",
        };
        this.worker = null;

    }

    setKey(k) {
        let newState = Object.assign({}, this.state);
        newState.key = k;
        newState.selected = [];
        this.setState(newState);
    }

    selectUnselectAll(e) {
        let newState = Object.assign({}, this.state);
        if (e.target.checked) {
            newState["selected"] = this.props.tasks.map((task) => {
                return task.id;
            });
        }
        else
            newState["selected"] = [];

        this.setState(newState);
    }
    selectUnselectOne(e, id) {
        let newState = Object.assign({}, this.state);
        if (e.target.checked) {
            newState["selected"].push(id);
        }
        else
            newState["selected"] = this.state.selected.filter((val) => val !== id);

        this.setState(newState);
    }
    render() {

        let tableElements = this.props[this.state.key].map((task, index) => {
            let selected = this.state.selected.indexOf(task.id) !== -1;
            return <ToDoListElement task={task} index={index} key={index} selected={selected} callback={(e, id) => this.selectUnselectOne(e, id)} />
        });
        return (
            <React.Fragment>
                <Tabs
                    fill
                    justify
                    id="tasks-controlled-tab"
                    activeKey={this.state.key}
                    onSelect={(k) => this.setKey(k)}

                >
                    
                    <Tab tabClassName="warning" eventKey="incompleteTasks" title="Incomplete">
                        
                        <div className="container">
                            <table className="table table-condensed table-striped">
                                <thead>
                                    <tr>
                                        <th><input type="checkbox" onChange={(e) => this.selectUnselectAll(e)} /></th>
                                        <th>#</th>
                                        <th>Task</th>
                                        <th>Due</th>
                                        <th>Tags</th>
                                        <th>Desc</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {tableElements}

                                </tbody>

                            </table>
                        </div>
                    </Tab>

                    <Tab tabClassName="danger" eventKey="overdueTasks" title="Overdue">
                    <Nav className="justify-content-center sticky-options" activeKey="/home">
                    <Nav.Item>
                        <Nav.Link href="/home">Active</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="link-1">Link</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="link-2">Link</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="disabled" disabled>
                            Disabled
                        </Nav.Link>
                    </Nav.Item>
                </Nav>
                        <div className="container">
                            <table className="table table-condensed table-striped">
                                <thead>
                                    <tr>
                                        <th><input type="checkbox" onChange={(e) => this.selectUnselectAll(e)} /></th>
                                        <th>#</th>
                                        <th>Task</th>
                                        <th>Due</th>
                                        <th>Tags</th>
                                        <th>Desc</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {tableElements}

                                </tbody>

                            </table>
                        </div>
                    </Tab>

                    <Tab tabClassName="success" eventKey="doneTasks" title="Done">
                        <div className="container">
                            <table className="table table-condensed table-striped">
                                <thead>
                                    <tr>
                                        <th><input type="checkbox" onChange={(e) => this.selectUnselectAll(e)} /></th>
                                        <th>#</th>
                                        <th>Task</th>
                                        <th>Due</th>
                                        <th>Tags</th>
                                        <th>Desc</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {tableElements}

                                </tbody>

                            </table>
                        </div>
                    </Tab>
                    <Tab tabClassName="plain" eventKey="allTasks" title="All Tasks">
                        <div className="container">
                            <table className="table table-condensed table-striped">
                                <thead>
                                    <tr>
                                        <th><input type="checkbox" onChange={(e) => this.selectUnselectAll(e)} /></th>
                                        <th>#</th>
                                        <th>Task</th>
                                        <th>Due</th>
                                        <th>Tags</th>
                                        <th>Desc</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {tableElements}

                                </tbody>

                            </table>
                        </div>
                    </Tab>
                </Tabs>

               

            </React.Fragment>
        );
    }

}

export default ToDoList;