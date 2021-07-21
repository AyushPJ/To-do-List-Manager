import React, { Component, createRef } from 'react';
import { Modal, Dropdown } from 'react-bootstrap'
import axios from 'axios';

class AddButtonWithDropdown extends Component {
    constructor(props) {
        super(props);
        this.inputBoxID = this.props.inputBoxID;
        this.content = this.props.content;
        if (this.props.content === "reminders")
            this.unitsDropdownID = this.props.unitsDropdownID;
        this.state = { elementsList: [] };
        this.callback = this.props.callback;

    }

    addElement() {
        let input = document.querySelector(this.inputBoxID);
        if (input.value !== "") {
            let elements = this.state.elementsList.slice();
            if (this.content === "reminders") {
                let unit = document.querySelector(this.unitsDropdownID);
                if (elements.findIndex((element) => element === (input.value + ' ' + unit.textContent)) === -1) {
                    elements.push(input.value + ' ' + unit.textContent);
                }
            }
            else if (this.content === "tags") {
                let newTags = document.querySelector(this.inputBoxID);
                newTags = newTags.value.split(";");
                newTags = newTags.filter((val) => val !== "");
                newTags.forEach((tag, index) => {
                    tag = tag.toLowerCase();
                    tag = tag.match(/[a-z]+/)[0];
                    newTags[index] = tag;
                });
                newTags = newTags.filter((val) => this.state.elementsList.indexOf(val) === -1);
                elements = this.state.elementsList.concat(newTags);
            }
            this.setState({
                elementsList: elements
            });
            this.callback(this.content, elements);
        }
    }
    removeElement(e) {
        let newElements = this.state.elementsList;
        newElements = newElements.filter((element) => element !== e.target.getAttribute("data"));
        this.setState({
            elementsList: newElements,
        });
        this.callback(this.content, newElements);
    }
    render() {
        let dropdownElements = this.state.elementsList.map((title, index) => {
            return (
                <Dropdown.Item key={index} data={title} onClick={(e) => this.removeElement(e)}>{title}</Dropdown.Item>
            )
        });
        if (this.state.elementsList.length === 0)
            dropdownElements = <Dropdown.Item disabled><i>Nothing Here</i></Dropdown.Item>;

        return (
            <React.Fragment>

                <button type="button" className="btn btn-outline-secondary" onClick={(e) => this.addElement(e)}>+</button>
                <Dropdown>
                    <Dropdown.Toggle variant="btn btn-outline-secondary dropdown-toggle">
                        View {this.content}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        {dropdownElements}
                        <Dropdown.Divider />
                        <Dropdown.Item onClick={() => {
                            this.setState({ elementsList: [] });
                            this.callback(this.content, []);
                        }}>
                            Remove all
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </React.Fragment>
        );
    }

}


class Form extends Component {
    constructor(props) {
        super(props);
        this.taskName = createRef(null);
        const today = new Date();
        this.defaultDate = String(today.getFullYear()).padStart(4, 0) + '-' + String(today.getMonth() + 1).padStart(2, 0) + '-' + String(today.getDate()).padStart(2, 0);
        this.taskDate = createRef(null)
        this.taskTime = createRef(null);
        this.tags = [];
        this.reminders = [];
        this.state = {
            unit: "min/s",
            status: "",
        };
        this.taskDesc = createRef(null);
        this.statusDismiss = null;
    }

    updateValues(prop, val) {
        this[prop] = val;
    }
    updateUnit(e) {
        this.setState({
            unit: e.target.textContent,
        });
    }

    submitForm(e) {
        let data = {
            taskName: this.taskName.current.value,
            taskDue: new Date(this.taskDate.current.value + ' ' + this.taskTime.current.value).toISOString(),
            tags: this.tags,
            reminders: this.reminders,
            taskDesc: this.taskDesc.current.value,
        };
        axios.post(process.env.REACT_APP_API_SERVER + "/tasks/addTasks", { formData: data })
            .then(() => {
                clearTimeout(this.statusDismiss);
                let newState = Object.assign({},this.state);
                newState["status"] =
                    <div className="alert alert-success d-flex align-items-center formElement" role="alert">
                        <div>
                            Task Added Successfully!
                        </div>
                    </div>
                this.setState(newState);
                this.props.refetchTasks();
                this.statusDismiss = setTimeout(() => {
                    let newState = Object.assign({},this.state);
                    newState["status"] = "";
                    this.setState(newState);
                }, 5000);
            })
            .catch((error) => {
                console.error(error);
                clearTimeout(this.statusDismiss);
                let newState = Object.assign({},this.state);
                newState["status"] =
                    <div className="alert alert-danger d-flex align-items-center formElement" role="alert">
                        <div>
                            Something went wrong.
                        </div>
                    </div>
                this.setState(newState);
                this.statusDismiss = setTimeout(() => {
                    let newState = Object.assign({},this.state);
                    newState["status"] = "";
                    this.setState(newState);
                }, 5000);

            });
        e.preventDefault();
    }




    render() {
        return (
                <Modal show={this.props.modalShow} onHide={() => this.props.setModalShow(false)} id="addTaskModal" size="lg" centered>
                    <Modal.Header >
                        <h5 className="modal-title">Add to your to-do list</h5>
                        <button type="button" className="btn-close" onClick={() => this.props.setModalShow(false)}></button>
                    </Modal.Header>
                    <Modal.Body>
                        <form action="" onSubmit={(e) => this.submitForm(e)} className="addTask">
                            <div className="form-floating mb-3 formElement">
                                <input ref={this.taskName} type="text" className="form-control" id="floatingInputTaskName" required />
                                <label htmlFor="floatingInputTaskName">Task Name</label>
                            </div>
                            <div className="form-floating mb-3 formElement">
                                <input ref={this.taskDate} type="date" className="form-control" id="floatingInputTaskDate" defaultValue={this.defaultDate} min={this.defaultDate} required />
                                <label htmlFor="floatingInputTaskDate">Task Date</label>
                            </div>
                            <div className="form-floating mb-3 formElement">
                                <input ref={this.taskTime} type="time" className="form-control" id="floatingInputTaskTime" required />
                                <label htmlFor="floatingInputStartTime">Time Due</label>
                            </div>
                            <div id="tagsDiv" className="formElement">
                                <div className="input-group">
                                    <input type="text" className="form-control" placeholder="Enter tags to filter by 'Tags' in your list" id="tags" />
                                    <AddButtonWithDropdown content="tags" inputBoxID="#tags" callback={(prop, val) => this.updateValues(prop, val)} />
                                </div>
                            </div>
                            <div id="remindersDiv" className="formElement">
                                <div className="input-group">
                                    <input type="number" className="form-control" placeholder="Remind me (when?) from Start Time" id="reminders" min="1" />
                                    <Dropdown>
                                        <Dropdown.Toggle variant="btn btn-outline-secondary" id="remindersUnit">
                                            {this.state.unit}
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu>
                                            <Dropdown.Item onClick={(e) => this.updateUnit(e)}>min/s</Dropdown.Item>
                                            <Dropdown.Item onClick={(e) => this.updateUnit(e)}>hr/s</Dropdown.Item>
                                            <Dropdown.Item onClick={(e) => this.updateUnit(e)}>day/s</Dropdown.Item>
                                        </Dropdown.Menu>
                                    </Dropdown>
                                    <AddButtonWithDropdown content="reminders" inputBoxID="#reminders" unitsDropdownID="#remindersUnit" callback={(prop, val) => this.updateValues(prop, val)} />
                                </div>
                            </div>
                            <div className="form-floating formElement">
                                <textarea ref={this.taskDesc} className="form-control" placeholder="Enter a description" id="floatingTextareaTaskDesc" ></textarea>
                                <label htmlFor="floatingTextareaTaskDesc">Description</label>
                            </div>
                            <span className="formElement" >
                                <button type="submit" className="btn btn-primary">Add Task</button>
                            </span>
                            {this.state.status}
                        </form>
                    </Modal.Body>
                </Modal>
        );
    }
}

export default Form;