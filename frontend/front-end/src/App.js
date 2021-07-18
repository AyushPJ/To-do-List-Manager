import React, { Component } from 'react';
import './App.css';
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
        newTags = newTags.filter((val) => val !== "" && this.state.elementsList.indexOf(val) === -1);
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
        <li key={index}><button type="button" className="dropdown-item" data={title} onClick={(e) => this.removeElement(e)}>{title}</button></li>
      )
    });
    if (this.state.elementsList.length === 0)
      dropdownElements = <li className="dropdown-item disabled"><i>Nothing Here</i></li>;

    return (
      <React.Fragment>
        <button type="button" className="btn btn-outline-secondary" onClick={(e) => this.addElement(e)}>+</button>
        <button type="button" className="btn btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
          View {this.content}
        </button>
        <ul className="dropdown-menu dropdown-menu-end">
          {dropdownElements}
          <li><hr className="dropdown-divider" /></li>
          <li><button type="button" className="dropdown-item" onClick={() => {
            this.setState({ elementsList: [] });
            this.callback(this.content, []);
          }}>
            Remove all
          </button></li>
        </ul>
      </React.Fragment>
    );
  }

}


class Form extends Component {
  constructor(props) {
    super(props);
    this.taskName = "";
    this.taskDate = new Date().toISOString().substring(0, 10);
    this.startTime = "";
    this.tags = [];
    this.reminders = [];
    this.state = {
      unit: "min/s",
      status: "",
    };
    this.taskDesc = "";
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
      taskName: this.taskName,
      taskDate: this.taskDate,
      startTime: this.startTime,
      tags: this.tags,
      reminders: this.reminders,
      taskDesc: this.taskDesc,
    };
    axios.post(process.env.REACT_APP_API_SERVER + "/addTasks/", { formData: data })
      .then((resp) => {
        let newState = this.state;
        newState["status"] =
          <div className="alert alert-success d-flex align-items-center formElement" role="alert">
            <div>
              Task Added Successfully!
            </div>
          </div>
        this.setState(newState);

      })
      .catch((error) => {
        console.error(error);
        let newState = this.state;
        newState["status"] =
          <div className="alert alert-danger d-flex align-items-center formElement" role="alert">
            <div>
              Something went wrong.
            </div>
          </div>
        this.setState(newState);

      });
    e.preventDefault();
  }

  render() {
    return (
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Add to your to-do list</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <form action="" onSubmit={(e) => this.submitForm(e)} className="addTask">
              <div className="form-floating mb-3 formElement">
                <input type="text" className="form-control" id="floatingInputTaskName" onChange={(e) => this.updateValues("taskName", e.target.value)} required />
                <label htmlFor="floatingInputTaskName">Task Name</label>
              </div>
              <div className="form-floating mb-3 formElement">
                <input type="date" className="form-control" id="floatingInputTaskDate" onChange={(e) => this.updateValues("taskDate", e.target.value)} defaultValue={this.taskDate} required />
                <label htmlFor="floatingInputTaskDate">Task Date</label>
              </div>
              <div className="form-floating mb-3 formElement">
                <input type="time" className="form-control" id="floatingInputStartTime" onChange={(e) => this.updateValues("startTime", e.target.value)} required />
                <label htmlFor="floatingInputStartTime">Start Time</label>
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
                  <button type="button" className="btn btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" id="remindersUnit">
                    {this.state.unit}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li><button type="button" className="dropdown-item" onClick={(e) => this.updateUnit(e)}>min/s</button></li>
                    <li><button type="button" className="dropdown-item" onClick={(e) => this.updateUnit(e)}>hr/s</button></li>
                    <li><button type="button" className="dropdown-item" onClick={(e) => this.updateUnit(e)}>day/s</button></li>
                  </ul>
                  <AddButtonWithDropdown content="reminders" inputBoxID="#reminders" unitsDropdownID="#remindersUnit" callback={(prop, val) => this.updateValues(prop, val)} />
                </div>
              </div>
              <div class="form-floating formElement">
                <textarea class="form-control" placeholder="Enter a description" id="floatingTextarea" onChange={(e) => this.updateValues("taskDesc", e.target.value)}></textarea>
                <label for="floatingTextarea">Description</label>
              </div>
              <span className="formElement" >
                <button type="submit" className="btn btn-primary">Add Task</button>
              </span>
              {this.state.status}
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export default Form;
