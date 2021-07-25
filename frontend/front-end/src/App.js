
import React, { Component, createRef } from 'react';
import './App.css';
import axios from 'axios';
import ToDoList from './todolist'
import Form from './form'
import Reminders from './reminders';
import Notifications from './notifications';
import { Offcanvas, Nav } from 'react-bootstrap';


class Navbar extends Component {
  render() {
    let notificationBadgeHidden = true;
    if (this.props.numberofNotifications > 0)
      notificationBadgeHidden = false;
    return (
      <nav className="navbar navbar-expand-lg sticky-top navbar-dark bg-dark">

        <div className="container-fluid">
          <a className="navbar-brand" href="#">tu-du</a>

          <div className="collapse navbar-collapse" id="navbarNavAltMarkup">
            <div className="navbar-nav">
              <a className="nav-link active" aria-current="page" href="#">Home</a>
            </div>
          </div>

          <div className="d-flex">
            <button className="btn btn-outline-warning me-2 position-relative" type="button" ref={this.props.notificationsButtonRef} onClick={() => this.props.setPropState("showNotifications", "toggle")}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-bell-fill" viewBox="0 0 16 16">
                <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zm.995-14.901a1 1 0 1 0-1.99 0A5.002 5.002 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901z" />
              </svg>
              <span hidden={notificationBadgeHidden} class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {this.props.numberofNotifications}
              </span>
            </button>

            <button className="btn btn-outline-success me-2" id="addTaskButton" type="button" onClick={() => this.props.setPropState("formShow", true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-plus-lg" viewBox="0 0 18 18">
                <path d="M8 0a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2H9v6a1 1 0 1 1-2 0V9H1a1 1 0 0 1 0-2h6V1a1 1 0 0 1 1-1z" />
              </svg>
            </button>
            <button className="btn btn-outline-light" type="button" id="userTab" onClick={() => this.props.setPropState("showUserTab", true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-person-circle" viewBox="0 0 16 16">
                <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z" />
              </svg>
            </button>
          </div>


        </div>

      </nav>

    );
  }
}

class UserTab extends Component {
  render() {
    return (
      <Offcanvas placement="end" id="userTab" show={this.props.showUserTab} onHide={() => this.props.setShowUserTab(false)}>
        <Offcanvas.Header>
          <Offcanvas.Title>Your Account</Offcanvas.Title>
          <button type="button" className="btn-close text-reset" onClick={() => this.props.setShowUserTab(false)}></button>
        </Offcanvas.Header>
        <Offcanvas.Body>
          ...
        </Offcanvas.Body>

      </Offcanvas>
    );
  }
}


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      incompleteTasks: [],
      doneTasks: [],
      overdueTasks: [],
      allTasks: [],
      currentAlerts: {
        reminders: [],
        overdue: '',
      },
      showReminderToasts: [false, false, false],
      showOverdueToast: false,
      remindersBehindSchedule: [],
      formShow: false,
      showUserTab: false,
      showNotifications: false,
    };
    this.pendingAlerts = {
      reminders: [],
      overdue: '',
    };
    this.worker = null;
    this.notificationsButtonRef = createRef(null);
  }

  componentDidMount() {
    this.fetchRemindersBehindSchedule();
    this.fetchFilteredOrderedTasks("overdueTasks", "overdue", "id", "asc");
    this.fetchFilteredOrderedTasks("allTasks", "allTasks", "id", "asc");
    this.fetchFilteredOrderedTasks("doneTasks", "done", "id", "asc");
    this.fetchFilteredOrderedTasks("incompleteTasks", "incomplete", "id", "asc", true, true, true);
  }
  setPropState(prop, val) {
    let newState = Object.assign({}, this.state);
    if (val === "toggle")
      newState[prop] = !this.state[prop];
    else
      newState[prop] = val;
    this.setState(newState);
  }

  restartWorker(tasksToMonitor) {

    if (this.worker !== null)
      this.worker.terminate();
    this.worker = new window.Worker("./remindMeWorker.js");
    this.worker.addEventListener("message", event => {
      console.log("worker responded ", event.data);
      this.pendingAlerts = event.data;
      this.clearReminders(this.pendingAlerts.reminders);
      this.markOverdue(this.pendingAlerts.overdue)
      this.getNextOverdue();
      this.pendingAlerts.reminders.slice(0, 3).map((_, index) => this.getNextReminder(index));
    });
    console.log("worker started");
    this.worker.postMessage(tasksToMonitor);

  }

  fetchFilteredOrderedTasks(stateName, filter = "all", orderBy = "id", order = "asc", restartWorker = false, markOverdue = false, markRemindersBehindSchedule = false) {
    axios.get(process.env.REACT_APP_API_SERVER + "/tasks/getAllTasks/" + filter + "/" + orderBy + "/" + order, { headers: {'Mark-Overdue': markOverdue, 'Mark-Reminders': markRemindersBehindSchedule,  'Accepts': 'application/json'}  })
      .then((resp) => {
        let newState = Object.assign({}, this.state);
        newState[stateName] = resp.data.tasks;
        if (restartWorker)
          this.restartWorker(resp.data.tasks);
        this.setState(newState);


      })
      .catch(function (error) {
        console.log(error);
      })
  }

  fetchRemindersBehindSchedule() {
    axios.get(process.env.REACT_APP_API_SERVER + "/reminders/getRemindersBehindSchedule", { headers: { 'Accepts': 'application/json' } })
      .then((resp) => {
        let newState = Object.assign({}, this.state);
        newState["remindersBehindSchedule"] = resp.data.reminders;
        this.setState(newState);

      })
      .catch(function (error) {
        console.log(error);
      })
  }

  refreshTasks() {
    this.fetchFilteredOrderedTasks("incompleteTasks", "incomplete", "id", "asc", true);
  }

  getNextReminder(index) {
    let newState = Object.assign({}, this.state);
    newState["showReminderToasts"][index] = false;
    this.setState(newState);
    setTimeout(() => {
      let newState = Object.assign({}, this.state);
      let slice = this.pendingAlerts.reminders.slice(0, 1);
      if (slice.length === 1) {
        newState.currentAlerts["reminders"][index] = slice[0];
        newState["showReminderToasts"][index] = true;
      }
      else
        newState.currentAlerts["reminders"][index] = '';
      this.pendingAlerts.reminders = this.pendingAlerts.reminders.slice(1);
      this.setState(newState);
      if (this.pendingAlerts.reminders.length + this.pendingAlerts.overdue.length === 0) {
        this.fetchFilteredOrderedTasks("incompleteTasks", "incomplete", "id", "asc", true);
      }
    }, 1000);
  }

  getNextOverdue() {
    let newState = Object.assign({}, this.state);
    newState["showOverdueToast"] = false;
    this.setState(newState);
    setTimeout(() => {
      let newState = Object.assign({}, this.state);
      let slice = this.pendingAlerts.overdue.slice(0, 1);
      if (slice.length === 1) {
        newState.currentAlerts["overdue"] = slice[0];
        newState["showOverdueToast"] = true;
      }
      else
        newState.currentAlerts["overdue"] = '';


      this.setState(newState);
      if (this.pendingAlerts.reminders.length + this.pendingAlerts.overdue.length === 0) {
        this.fetchFilteredOrderedTasks("overdueTasks", "overdue", "id", "asc");
        this.fetchFilteredOrderedTasks("incompleteTasks", "incomplete", "id", "asc", true);
      }
      this.pendingAlerts.overdue = this.pendingAlerts.overdue.slice(1);
    }, 1000);
  }

  markOverdue(overdue) {
    if (overdue.length > 0)
      axios.post(process.env.REACT_APP_API_SERVER + "/tasks/markOverdue", { overdueTasks: overdue })
        .then(() => {
          console.log("marked overdue");
          this.fetchFilteredOrderedTasks("incompleteTasks", "incomplete", "id", "asc");
          this.fetchFilteredOrderedTasks("overdueTasks", "overdue", "id", "asc");

        })
        .catch((error) => {
          console.error(error);
        });
  }

  clearReminders(reminders) {
    if (reminders.length > 0)
      axios.post(process.env.REACT_APP_API_SERVER + "/reminders/deleteReminders", { tasksReminders: reminders })
        .then(() => {
          console.log("reminders removed");
          this.fetchFilteredOrderedTasks("incompleteTasks", "incomplete", "id", "asc");
        })
        .catch((error) => {
          console.error(error);
        });


  }

  markSelectedasDone(selected) {
    axios.post(process.env.REACT_APP_API_SERVER + "/tasks/markDone", { taskIDs: selected })
      .then(() => {
        this.fetchFilteredOrderedTasks("overdueTasks", "overdue", "id", "asc");
        this.fetchFilteredOrderedTasks("allTasks", "allTasks", "id", "asc");
        this.fetchFilteredOrderedTasks("doneTasks", "done", "id", "asc");
        this.fetchFilteredOrderedTasks("incompleteTasks", "incomplete", "id", "asc", true);

      })
      .catch(function (error) {
        console.log(error);
      })
  }

  markSelectedasIncomplete(selected) {
    axios.post(process.env.REACT_APP_API_SERVER + "/tasks/markIncomplete", { taskIDs: selected })
      .then(() => {
        this.fetchFilteredOrderedTasks("incompleteTasks", "incomplete", "id", "asc", true, true);
        this.fetchFilteredOrderedTasks("doneTasks", "done", "id", "asc");
        this.fetchFilteredOrderedTasks("allTasks", "allTasks", "id", "asc");
        this.fetchFilteredOrderedTasks("overdueTasks", "overdue", "id", "asc");
      })
      .catch(function (error) {
        console.log(error);
      })
  }

  deleteSelected(selected) {
    axios.post(process.env.REACT_APP_API_SERVER + "/tasks/deleteTasks", { taskIDs: selected })
      .then(() => {
        this.fetchFilteredOrderedTasks("overdueTasks", "overdue", "id", "asc");
        this.fetchFilteredOrderedTasks("allTasks", "allTasks", "id", "asc");
        this.fetchFilteredOrderedTasks("doneTasks", "done", "id", "asc");
        this.fetchFilteredOrderedTasks("incompleteTasks", "incomplete", "id", "asc", true);

      })
      .catch(function (error) {
        console.log(error);
      })
  }


  render() {
    return (
      <React.Fragment>
        <Navbar numberofNotifications={this.state.overdueTasks.length + this.state.remindersBehindSchedule.length} setPropState={(prop, val) => this.setPropState(prop, val)} notificationsButtonRef={this.notificationsButtonRef} />
        <ToDoList incompleteTasks={this.state.incompleteTasks} doneTasks={this.state.doneTasks} overdueTasks={this.state.overdueTasks} allTasks={this.state.allTasks} markSelectedasDone={(selected) => this.markSelectedasDone(selected)} markSelectedasIncomplete={(selected) => this.markSelectedasIncomplete(selected)} deleteSelected={(selected) => this.deleteSelected(selected)} />
        <UserTab showUserTab={this.state.showUserTab} setShowUserTab={(val) => this.setPropState("showUserTab", val)} />
        <Reminders overdue={this.state.currentAlerts.overdue} reminders={this.state.currentAlerts.reminders} showOverdueToast={this.state.showOverdueToast} showReminderToasts={this.state.showReminderToasts} nextOverdue={() => this.getNextOverdue()} nextReminder={(index) => this.getNextReminder(index)} />
        <Form modalShow={this.state.formShow} setModalShow={(val) => this.setPropState("formShow", val)} refetchTasks={() => this.refreshTasks()} />
        <Notifications setPropState={(prop, val) => this.setPropState(prop, val)} notificationsButtonRef={this.notificationsButtonRef} showNotifications={this.state.showNotifications} overdueTasks={this.state.overdueTasks} remindersBehindSchedule={this.state.remindersBehindSchedule} />

      </React.Fragment>
    );
  }
}



export default App;
