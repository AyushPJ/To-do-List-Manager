import React, { Component, createRef } from 'react';
import { Modal, Dropdown, Form, Col, FloatingLabel, Row, Container } from 'react-bootstrap'
import axios from 'axios';

class AddButtonWithDropdown extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        let dropdownElements = this.props.elements.map((title, index) => {
            return (
                <Dropdown.Item key={index} data={title} onClick={(e) => this.props.remove(e)}>{title}</Dropdown.Item>
            )
        });
        if (this.props.elements.length === 0)
            dropdownElements = <Dropdown.Item disabled><i>Nothing Here</i></Dropdown.Item>;

        return (
            <React.Fragment>

                <button type="button" className="btn btn-outline-secondary" onClick={() => this.props.add()}>+</button>
                <Dropdown>
                    <Dropdown.Toggle variant="btn btn-outline-secondary dropdown-toggle">
                        View {this.props.content}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        {dropdownElements}
                        <Dropdown.Divider />
                        <Dropdown.Item onClick={() => this.props.removeAll()}>
                            Remove all
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </React.Fragment>
        );
    }

}


class TaskForm extends Component {
    constructor(props) {
        super(props);

        const today = new Date();
        this.defaultDate = String(today.getFullYear()).padStart(4, 0) + '-' + String(today.getMonth() + 1).padStart(2, 0) + '-' + String(today.getDate()).padStart(2, 0);
        this.taskName = createRef(null);
        this.taskDate = createRef(null)
        this.taskTime = createRef(null);
        this.tagsInputBoxRef = createRef(null);
        this.remindersInputBoxRef = createRef(null)
        this.taskDesc = createRef(null);
        this.state = {
            unit: "min/s",
            status: "",
            reminders: [],
            tags: [],
            invalidationStatus: {
                name: false,
                date: false,
                time: false,
                tags: false,
                reminders: false,
            },
            taskTimeFeedback: "Please enter a valid time",
            reminderFeedback: "Please enter a valid date and time",
        };
        
        this.statusDismiss = null;
    }

    updateState(prop, val) {
        let newState = Object.assign({}, this.state);
        newState[prop] = val;
        this.setState(newState);
    }

    addTag() {
        let input = this.tagsInputBoxRef.current;
        if (input.value !== "") {
            if (input.value.match(/[^a-zA-Z0-9;]/) !== null) {
                let newState = Object.assign({}, this.state);
                newState.invalidationStatus.tags = true;
                this.setState(newState);
            }
            else {
                let newState = Object.assign({}, this.state);
                newState.invalidationStatus.tags = false;
                this.setState(newState);
                let newTags = input.value.split(";");
                newTags = newTags.filter((val) => val !== "");
                newTags.forEach((tag, index) => {
                    tag = tag.toLowerCase();
                    tag = tag.match(/[a-z0-9]+/)[0];
                    newTags[index] = tag;
                });
                newTags = newTags.filter((val) => this.state.tags.indexOf(val) === -1);
                let tags = this.state.tags.concat(newTags);
                this.updateState("tags", tags);
            }

        }
    }
    addReminder() {
        let input = this.remindersInputBoxRef.current;
        if (input.value !== "") {
            if (this.taskDate.current.value !== '') {
                if (this.taskTime.current.value !== '') {
                    let unit = this.state.unit;
                    let msOffset = 0;
                    if (unit === "min/s")
                        msOffset = 60000;
                    else if (unit === "hr/s")
                        msOffset = 3600000;
                    else if (unit === "day/s")
                        msOffset = 86400000;
                    if ((new Date(this.taskDate.current.value + ' ' + this.taskTime.current.value).getTime() - msOffset * input.value) <= new Date().getTime()) {
                        let newState = Object.assign({}, this.state);
                        newState.invalidationStatus.reminders = true;
                        newState.reminderFeedback = "Reminders must be in the future.";
                        this.setState(newState);
                    }
                    else {
                        let newState = Object.assign({}, this.state);
                        newState.invalidationStatus.reminders = false;
                        this.setState(newState);
                        let reminders = this.state.reminders;
                        if (this.state.reminders.findIndex((reminder) => reminder === (input.value + ' ' + unit)) === -1) {
                            reminders.push(input.value + ' ' + unit);
                        }
                        this.updateState("reminders", reminders);
                    }
                }
                else {
                    let newState = Object.assign({}, this.state);
                    newState.invalidationStatus.reminders = true;
                    newState.reminderFeedback = "Please enter a valid time first.";
                    this.setState(newState);
                }
            }
            else {
                let newState = Object.assign({}, this.state);
                newState.invalidationStatus.reminders = true;
                newState.reminderFeedback = "Please enter a valid date first.";
                this.setState(newState);
            }
        }
    }
    removeTag(e) {
        let newTags = this.state.tags.slice();
        newTags = newTags.filter((tag) => tag !== e.target.getAttribute("data"));
        this.updateState("tags", newTags);
    }

    removeReminder(e) {
        let newReminders = this.state.reminders.slice();
        newReminders = newReminders.filter((reminder) => reminder !== e.target.getAttribute("data"));
        this.updateState("reminders", newReminders);
    }

    resetState() {
        this.setState({
            unit: "min/s",
            status: "",
            reminders: [],
            tags: [],
            invalidationStatus: {
                name: false,
                date: false,
                time: false,
                tags: false,
                reminders: false,
            }
        });
    }

    dataValidator() {
        let newState = Object.assign({}, this.state);
        let valid = true;
        let newInvalidationStatus = {
            name: false,
            date: false,
            time: false,
            tags: false,
            reminders: false,
        };
        if (this.taskName.current.value === '')
            newInvalidationStatus.name = true;
        else
            newInvalidationStatus.name = false;

        valid = valid && !newInvalidationStatus.name;

        if (this.taskDate.current.value.match(/\d+-\d+-\d+/) === null) {
            newInvalidationStatus.date = true;

        }
        else {
            newInvalidationStatus.date = false;
            if (this.taskTime.current.value === '') {
                newInvalidationStatus.time = true;
                newState.taskTimeFeedback = "Please enter a valid time.";
            }
            else if (new Date(this.taskDate.current.value + ' ' + this.taskTime.current.value).getTime() <= new Date().getTime()) {
                newInvalidationStatus.time = true;
                newState.taskTimeFeedback = "This is a to-do list, not a to-done list. Enter a time in the future.";
            }
            else
                newInvalidationStatus.time = false;

            valid = valid && !newInvalidationStatus.time;

        }

        valid = valid && !newInvalidationStatus.date;

        newState.invalidationStatus = newInvalidationStatus;

        this.setState(newState);

        return valid;
    }

    submitForm(e) {
        e.preventDefault();
        if (!this.dataValidator()) {
            e.stopPropagation();
        }
        else {
            let data = {
                taskName: this.taskName.current.value,
                taskDue: new Date(this.taskDate.current.value + ' ' + this.taskTime.current.value).toISOString(),
                tags: this.state.tags,
                reminders: this.state.reminders,
                taskDesc: this.taskDesc.current.value,
            };
            axios.post(process.env.REACT_APP_API_SERVER + "/tasks/addTasks", { formData: data })
                .then(() => {
                    clearTimeout(this.statusDismiss);
                    let newState = Object.assign({}, this.state);
                    newState["status"] = "success";

                    this.setState(newState);
                    this.statusDismiss = setTimeout(() => {
                        let newState = Object.assign({}, this.state);
                        newState["status"] = "";
                        this.setState(newState);
                    }, 5000);
                    this.props.refetchTasks();
                })
                .catch((error) => {
                    console.error(error);
                    clearTimeout(this.statusDismiss);
                    let newState = Object.assign({}, this.state);
                    newState["status"] = "fail";

                    this.setState(newState);
                    this.statusDismiss = setTimeout(() => {
                        let newState = Object.assign({}, this.state);
                        newState["status"] = "";
                        this.setState(newState);
                    }, 5000);

                });
        }
    }




    render() {
        const failAlert = <div className="alert alert-danger d-flex align-items-center formElement" role="alert">
            <div>
                Something went wrong.
            </div>
        </div>;

        const successAlert = <div className="alert alert-success d-flex align-items-center formElement" role="alert">
            <div>
                Task Added Successfully!
            </div>
        </div>

        let status = "";
        if (this.state.status === "success")
            status = successAlert;
        else if (this.state.status === "fail")
            status = failAlert;
        return (
            <Modal show={this.props.modalShow} onHide={() => this.props.setModalShow(false)} onExit={() => this.resetState()} id="addTaskModal" size="lg" centered>
                <Modal.Header >
                    <h5 className="modal-title">Add to your to-do list</h5>
                    <button type="button" className="btn-close" onClick={() => this.props.setModalShow(false)}></button>
                </Modal.Header>
                <Modal.Body>
                    <Form noValidate onSubmit={(e) => this.submitForm(e)}>

                        <FloatingLabel className="mb-3 formElement validationElement" label="Task Name">

                            <Form.Control isInvalid={this.state.invalidationStatus.name} ref={this.taskName} type="text" id="floatingInputTaskName" required />

                            <Form.Control.Feedback type="invalid" >
                                Please enter the task name.
                            </Form.Control.Feedback>

                        </FloatingLabel>

                        <FloatingLabel className="mb-3 formElement validationElement" label="Due Date">

                            <Form.Control isInvalid={this.state.invalidationStatus.date} ref={this.taskDate} type="date" id="floatingInputTaskDate" defaultValue={this.defaultDate} min={this.defaultDate} required />
                            <Form.Control.Feedback type="invalid" >
                                Please enter a valid date.
                            </Form.Control.Feedback>

                        </FloatingLabel>
                        <FloatingLabel className="mb-3 formElement validationElement" label="Due Time">

                            <Form.Control isInvalid={this.state.invalidationStatus.time} ref={this.taskTime} type="time" id="floatingInputTaskTime" required />
                            <Form.Control.Feedback type="invalid" >
                                {this.state.taskTimeFeedback}
                            </Form.Control.Feedback>

                        </FloatingLabel>



                        <div id="tagsDiv" className="formElement">
                            <div className="input-group">
                                <Form.Control isInvalid={this.state.invalidationStatus.tags} ref={this.tagsInputBoxRef} type="text" placeholder="Enter tags to filter by 'Tags' in your list" id="tags" />
                                <AddButtonWithDropdown content="tags" elements={this.state.tags} add={() => this.addTag()} remove={(e) => this.removeTag(e)} removeAll={() => this.updateState("tags", [])} />
                                <Form.Control.Feedback type="invalid" >
                                    Tags may only contain alphanumeric characters. You can use ';' as delimiter.
                                </Form.Control.Feedback>
                            </div>
                        </div>
                        <div id="remindersDiv" className="formElement">
                            <div className="input-group">
                                <Form.Control isInvalid={this.state.invalidationStatus.reminders} type="number" ref={this.remindersInputBoxRef} placeholder="Remind me (when?) from Start Time" id="reminders" min="1" />
                                <Dropdown>
                                    <Dropdown.Toggle ref={this.unitsDropdownRef} variant="btn btn-outline-secondary" id="remindersUnit">
                                        {this.state.unit}
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                        <Dropdown.Item onClick={() => this.updateState("unit", "min/s")}>min/s</Dropdown.Item>
                                        <Dropdown.Item onClick={() => this.updateState("unit", "hr/s")}>hr/s</Dropdown.Item>
                                        <Dropdown.Item onClick={() => this.updateState("unit", "day/s")}>day/s</Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                                <AddButtonWithDropdown content="reminders" elements={this.state.reminders} add={() => this.addReminder()} remove={(e) => this.removeReminder(e)} removeAll={() => this.updateState("reminders", [])} />
                                <Form.Control.Feedback type="invalid" >
                                    {this.state.reminderFeedback}
                                </Form.Control.Feedback>
                            </div>

                        </div>
                        <Form.Floating className="mb-3 formElement">
                            <Form.Control as="textarea" ref={this.taskDesc} id="floatingTextareaTaskDesc" />
                            <label htmlFor="floatingTextareaTaskDesc">Description</label>
                        </Form.Floating>
                        <span className="formElement">
                            <button type="submit" className="btn btn-primary">Add Task</button>
                        </span>
                        {status}
                    </Form>
                </Modal.Body>
            </Modal >
        );
    }
}

export default TaskForm;