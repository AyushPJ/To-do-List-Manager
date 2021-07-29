import React, { Component, createRef } from 'react';
import './App.css';
import { Collapse, Card, Tabs, Tab } from 'react-bootstrap';




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
                <span key={"tag_" + index} className="me-2">{'#' + tag}</span>
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
        this.checkBoxRefs = {
            incompleteTasks: createRef(null),
            overdueTasks: createRef(null),
            doneTasks: createRef(null),
            allTasks: createRef(null),
        };
    }

    setKey(k) {
        let newState = Object.assign({}, this.state);
        this.checkBoxRefs[this.state.key].current.checked = false;
        newState.key = k;
        newState.selected = [];
        this.setState(newState);
    }

    clearSelected() {
        let newState = Object.assign({}, this.state);
        newState.selected = [];
        this.checkBoxRefs[this.state.key].current.checked = false;
        this.setState(newState);
    }

    selectUnselectAll(e) {
        let newState = Object.assign({}, this.state);
        if (e.target.checked) {
            newState["selected"] = this.props[this.state.key].map((task) => {
                return task.id;
            });
        }
        else {
            newState["selected"] = [];
        }


        this.setState(newState);
    }
    selectUnselectOne(e, id) {
        let newState = Object.assign({}, this.state);
        if (e.target.checked) {
            newState["selected"].push(id);
        }
        else {
            newState["selected"] = this.state.selected.filter((val) => val !== id);
            this.checkBoxRefs[this.state.key].current.checked = false;
        }

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
                        <Collapse in={this.state.selected.length > 0} id="markDel1">
                            <div className="container markDel">
                                <button className="btn btn-success" title="Mark as Done" onClick={() => {
                                    this.props.markSelectedasDone(this.state.selected);
                                    this.clearSelected();
                                }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-check2-square" viewBox="0 0 16 16">
                                        <path d="M3 14.5A1.5 1.5 0 0 1 1.5 13V3A1.5 1.5 0 0 1 3 1.5h8a.5.5 0 0 1 0 1H3a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5V8a.5.5 0 0 1 1 0v5a1.5 1.5 0 0 1-1.5 1.5H3z" />
                                        <path d="m8.354 10.354 7-7a.5.5 0 0 0-.708-.708L8 9.293 5.354 6.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0z" />
                                    </svg>
                                </button>
                                <button className="btn btn-danger" title="Delete" onClick={() => {
                                    this.props.deleteSelected(this.state.selected);
                                    this.clearSelected();
                                }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash-fill" viewBox="0 0 16 16">
                                        <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0z" />
                                    </svg>
                                </button>
                            </div>
                        </Collapse>

                        <div className="container">
                            <table className="table table-condensed table-striped">
                                <thead>
                                    <tr>
                                        <th><input ref={this.checkBoxRefs.incompleteTasks} type="checkbox" onChange={(e) => this.selectUnselectAll(e)} /></th>
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
                        <Collapse in={this.state.selected.length > 0} id="markDel2">
                            <div className="container markDel">
                                <button className="btn btn-success" title="Mark as Done" onClick={() => {
                                    this.props.markSelectedasDone(this.state.selected);
                                    this.clearSelected();
                                }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-check2-square" viewBox="0 0 16 16">
                                        <path d="M3 14.5A1.5 1.5 0 0 1 1.5 13V3A1.5 1.5 0 0 1 3 1.5h8a.5.5 0 0 1 0 1H3a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5V8a.5.5 0 0 1 1 0v5a1.5 1.5 0 0 1-1.5 1.5H3z" />
                                        <path d="m8.354 10.354 7-7a.5.5 0 0 0-.708-.708L8 9.293 5.354 6.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0z" />
                                    </svg>
                                </button>
                                <button className="btn btn-danger" title="Delete" onClick={() => {
                                    this.props.deleteSelected(this.state.selected);
                                    this.clearSelected();
                                }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash-fill" viewBox="0 0 16 16">
                                        <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0z" />
                                    </svg>
                                </button>
                            </div>
                        </Collapse>
                        <div className="container">
                            <table className="table table-condensed table-striped">
                                <thead>

                                    <tr>
                                        <th><input ref={this.checkBoxRefs.overdueTasks} type="checkbox" onChange={(e) => this.selectUnselectAll(e)} /></th>
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
                        <Collapse in={this.state.selected.length > 0} id="markDel3">
                            <div className="container markDel">
                                <button className="btn btn-warning" title="Mark as Incomplete" onClick={() => {
                                    this.props.markSelectedasIncomplete(this.state.selected);
                                    this.clearSelected();
                                }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-x-circle" viewBox="0 0 16 16">
                                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                                    </svg>
                                </button>
                                <button className="btn btn-danger" title="Delete" onClick={() => {
                                    this.props.deleteSelected(this.state.selected);
                                    this.clearSelected();
                                }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash-fill" viewBox="0 0 16 16">
                                        <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0z" />
                                    </svg>
                                </button>
                            </div>
                        </Collapse>
                        <div className="container">
                            <table className="table table-condensed table-striped">
                                <thead>
                                    <tr>
                                        <th><input ref={this.checkBoxRefs.doneTasks} type="checkbox" onChange={(e) => this.selectUnselectAll(e)} /></th>
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
                        <Collapse in={this.state.selected.length > 0} id="markDel4">
                            <div className="container markDel">
                                <div className="markInc">
                                    <button className="btn btn-success" title="Mark as Done" onClick={() => {
                                        this.props.markSelectedasDone(this.state.selected);
                                        this.clearSelected();
                                    }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-check2-square" viewBox="0 0 16 16">
                                            <path d="M3 14.5A1.5 1.5 0 0 1 1.5 13V3A1.5 1.5 0 0 1 3 1.5h8a.5.5 0 0 1 0 1H3a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5V8a.5.5 0 0 1 1 0v5a1.5 1.5 0 0 1-1.5 1.5H3z" />
                                            <path d="m8.354 10.354 7-7a.5.5 0 0 0-.708-.708L8 9.293 5.354 6.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0z" />
                                        </svg>
                                    </button>

                                    <button className="btn btn-warning" title="Mark as Incomplete" onClick={() => {
                                        this.props.markSelectedasIncomplete(this.state.selected);
                                        this.clearSelected();
                                    }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-x-circle" viewBox="0 0 16 16">
                                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                                        </svg>
                                    </button>
                                </div>
                                <button className="btn btn-danger" title="Delete" onClick={() => {
                                    this.props.deleteSelected(this.state.selected);
                                    this.clearSelected();
                                }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash-fill" viewBox="0 0 16 16">
                                        <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0z" />
                                    </svg>
                                </button>
                            </div>
                        </Collapse>
                        <div className="container">
                            <table className="table table-condensed table-striped">
                                <thead>
                                    <tr>
                                        <th><input ref={this.checkBoxRefs.allTasks} type="checkbox" onChange={(e) => this.selectUnselectAll(e)} /></th>
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