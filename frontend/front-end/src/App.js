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
    const today = new Date();
    this.taskDate = String(today.getFullYear()).padStart(4, 0) + '-' + String(today.getMonth()+1).padStart(2, 0) + '-' + String(today.getDate()).padStart(2, 0);
    this.taskTime = "";
    this.tags = [];
    this.reminders = [];
    this.state = {
      unit: "min/s",
      status: "",
    };
    this.taskDesc = "";
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
      taskName: this.taskName,
      taskDue: new Date(this.taskDate + ' ' + this.taskTime).toISOString(),
      tags: this.tags,
      reminders: this.reminders,
      taskDesc: this.taskDesc,
    };
    axios.post(process.env.REACT_APP_API_SERVER + "/tasks/addTasks", { formData: data })
      .then(() => {
        clearTimeout(this.statusDismiss);
        let newState = this.state;
        newState["status"] =
          <div className="alert alert-success d-flex align-items-center formElement" role="alert">
            <div>
              Task Added Successfully!
            </div>
          </div>
        this.setState(newState);
        this.statusDismiss = setTimeout(() => {
          let newState = this.state;
          newState["status"] = "";
          this.setState(newState);
        }, 5000);
      })
      .catch((error) => {
        console.error(error);
        clearTimeout(this.statusDismiss);
        let newState = this.state;
        newState["status"] =
          <div className="alert alert-danger d-flex align-items-center formElement" role="alert">
            <div>
              Something went wrong.
            </div>
          </div>
        this.setState(newState);
        this.statusDismiss = setTimeout(() => {
          let newState = this.state;
          newState["status"] = "";
          this.setState(newState);
        }, 5000);

      });
    e.preventDefault();
  }

  render() {
    return (
      <div className="modal fade" id="addTaskModal" tabIndex="-1" aria-labelledby="addTaskModalLabel" aria-hidden="true">
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
                  <input type="date" className="form-control" id="floatingInputTaskDate" onChange={(e) => this.updateValues("taskDate", e.target.value)} defaultValue={this.taskDate} min={this.taskDate} required />
                  <label htmlFor="floatingInputTaskDate">Task Date</label>
                </div>
                <div className="form-floating mb-3 formElement">
                  <input type="time" className="form-control" id="floatingInputTaskTime" onChange={(e) => this.updateValues("taskTime", e.target.value)} required />
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
                <div className="form-floating formElement">
                  <textarea className="form-control" placeholder="Enter a description" id="floatingTextareaTaskDesc" onChange={(e) => this.updateValues("taskDesc", e.target.value)}></textarea>
                  <label htmlFor="floatingTextareaTaskDesc">Description</label>
                </div>
                <span className="formElement" >
                  <button type="submit" className="btn btn-primary">Add Task</button>
                </span>
                {this.state.status}
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}


class NavbarAndUserMenu extends Component {
  render() {
    return (
      <React.Fragment>
        <nav className="navbar navbar-expand-lg sticky-top navbar-dark bg-dark">

          <div className="container-fluid">
            <a className="navbar-brand" href="#">tu-du</a>

            <div className="collapse navbar-collapse" id="navbarNavAltMarkup">
              <div className="navbar-nav">
                <a className="nav-link active" aria-current="page" href="#">Home</a>
              </div>
            </div>

            <div className="d-flex">
              <button className="btn btn-outline-success me-2" id="addTaskButton" data-bs-toggle="modal" data-bs-target="#addTaskModal" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-plus-lg" viewBox="0 0 18 18">
                  <path d="M8 0a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2H9v6a1 1 0 1 1-2 0V9H1a1 1 0 0 1 0-2h6V1a1 1 0 0 1 1-1z" />
                </svg>
              </button>
              <button className="btn btn-outline-secondary" type="button" data-bs-toggle="offcanvas" data-bs-target="#userMenu" aria-controls="userMenu">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-person-circle" viewBox="0 0 16 16">
                  <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                  <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z" />
                </svg>
              </button>
            </div>

          </div>

        </nav>
        <div className="offcanvas offcanvas-end" tabIndex="-1" id="userMenu" aria-labelledby="userMenuLabel">
          <div className="offcanvas-header">
            <h5 id="offcanvasRightLabel">Your Account</h5>
            <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
          </div>
          <div className="offcanvas-body">
            ...
          </div>
        </div>
      </React.Fragment>
    );
  }
}

class ToDoListElement extends Component {
  constructor(props) {
    super(props);
    this.state = {
      buttonState: "plus",
      task: this.props.task,
      index: this.props.index,
    }
    this.button = <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-plus-lg" viewBox="0 0 16 16">
      <path d="M8 0a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2H9v6a1 1 0 1 1-2 0V9H1a1 1 0 0 1 0-2h6V1a1 1 0 0 1 1-1z" />
    </svg>;
  }
  togglePlusMinus() {
    let plus = <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-plus-lg" viewBox="0 0 16 16">
      <path d="M8 0a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2H9v6a1 1 0 1 1-2 0V9H1a1 1 0 0 1 0-2h6V1a1 1 0 0 1 1-1z" />
    </svg>;
    let minus = <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-dash-lg" viewBox="0 0 16 16">
    <path d="M0 8a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H1a1 1 0 0 1-1-1z"/>
  </svg>;
    let newState = this.state;
    if (this.state.buttonState === "plus") {
      newState["buttonState"] = "minus";
      this.button = minus;
    }
    else {
      newState["buttonState"] = "plus";
      this.button = plus;
    }
    this.setState(newState);
  }
  render() {
    let task = this.state.task;
    let due = new Date(task.taskDue).toLocaleString('en-ae');
    let tags = task.tags.map((tag, index) => {
      return (
        <a key={"tag_" + index} className="me-2" href='#'>{'#' + tag}</a>
      )
    });
    let desc = <span className="text-muted"><i>(empty description)</i></span>
    if(task.taskDesc!=="")
      desc=task.taskDesc;
    return (
      <React.Fragment>
        <tr key={"entry_" + this.state.index}>
          <th scope="row">{task.id}</th>
          <td>{task.taskName}</td>
          <td>{due}</td>
          <td>{tags}</td>
          <td><button className="btn btn-outline-secondary btn-sm" data-bs-toggle="collapse" data-bs-target={"#desc_"+this.state.index} aria-expanded="false" aria-controls={"desc_"+this.state.index} onClick={() => this.togglePlusMinus()}>{this.button}</button></td>
        </tr>
        <tr className="collapse" id={"desc_"+this.state.index} key={"desc_" + this.state.index}>
          <td colSpan="5">
            <div className="collapse" id={"desc_"+this.state.index}>
              <div className="card card-body">
              <h5>Task Description</h5>
                {desc}
              </div>

            </div>
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
      tasks: [],
    };
    axios.get(process.env.REACT_APP_API_SERVER + "/tasks/getAllTasks", { headers: { 'Accepts': 'application/json' } })
      .then((resp) => {
        this.setState({
          tasks: resp.data.tasks,
        });
      })
      .catch(function (error) {
        console.log(error);
      })

  }

  render() {

    let tableElements = this.state.tasks.map((task, index) => {
      return <ToDoListElement task={task} index={index} key={index} />
    });
    return (
      <React.Fragment>
        <div className="container">
          <table className="table table-condensed table-striped">
            <thead>
              <tr>
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


      </React.Fragment>
    );
  }

}

class App extends Component {
  render() {
    return (
      <React.Fragment>
        <NavbarAndUserMenu />
        <Form />
        <ToDoList />
      </React.Fragment>
    );
  }
}

export default App;
