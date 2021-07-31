
import React, { Component } from 'react';
import './App.css';
import axios from 'axios';
import ToDoList from './Todolist'
import TaskForm from './Form'
import Notifications from './Notifications';
import { Offcanvas, Toast, ToastContainer } from 'react-bootstrap';
import getCookie from './tools';

import { Redirect } from 'react-router-dom'

class Navbar extends Component {
  render() {
    return (
      <nav className="navbar navbar-expand-lg sticky-top navbar-dark bg-dark">

        <div className="container-fluid">
          <span className="navbar-brand logo">
            tu-du
          </span>

          <div className="collapse navbar-collapse" id="navbarNavAltMarkup">
            <div className="navbar-nav">
            </div>
          </div>

          <div className="d-flex">
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
  constructor(props) {
    super(props);
    this.state = {
      enableTest: false,
    }
  }


  getUsername() {

  }

  logout() {
    axios.post("/logout", { headers: { 'X-CSRF-TOKEN': getCookie('csrf_access_token'), 'Accepts': 'application/json' } })
      .then((resp) => {
        this.props.setPropState('authorized', false);
      })
      .catch((error) => {
        console.log(error);
        this.setPropState('authorized', false);


      })
  }

  render() {
    return (
      <Offcanvas placement="end" id="userTab" show={this.props.showUserTab} onHide={() => this.props.setShowUserTab(false)}>
        <Offcanvas.Header>
          <Offcanvas.Title>User Settings</Offcanvas.Title>
          <button type="button" className="btn-close text-reset" onClick={() => this.props.setShowUserTab(false)}></button>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <div className="user-settings">
          <h1>Username: {this.props.username}</h1>
          
          <Notifications notificationSubscriptionStatus={this.props.notificationSubscriptionStatus} setPropState={(prop, val) => this.props.setPropState(prop, val)} />
          <button className="btn btn-link" onClick={() => this.logout()}>Log Out</button>
          </div>
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
      formShow: false,
      showUserTab: false,
      showToastAlert: false,
      authorized: null,
      username: null,
      notificationSubscriptionStatus: false,
    };
    this.toastAlertMessage = "";
  }

  componentDidMount() {
    this.checkUserAuthorized();
  }

  setPropState(prop, val) {
    let newState = Object.assign({}, this.state);
    if (val === "toggle")
      newState[prop] = !this.state[prop];
    else
      newState[prop] = val;
    this.setState(newState);
  }



  fetchFilteredOrderedTasks(stateName, filter = "all", orderBy = "id", order = "asc", markOverDueTasks=false) {
    axios.get("/tasks/getAllTasks/" + filter + "/" + orderBy + "/" + order, { headers: { 'mark-overdue-tasks': markOverDueTasks, 'Accepts': 'application/json' } })
      .then((resp) => {
        let newState = Object.assign({}, this.state);
        newState[stateName] = resp.data.tasks;
        this.setState(newState);


      })
      .catch(function (error) {
        console.log(error);
        if (error.response.status === 401) {
          alert("Session expired. Please log in again.");
          this.setPropState('authorized', false);
        }
      })
  }

  refreshTasks() {
    this.fetchFilteredOrderedTasks("incompleteTasks", "incomplete", "id", "asc");
    this.fetchFilteredOrderedTasks("allTasks", "allTasks", "id", "asc");

  }

  markSelectedasDone(selected) {
    axios.post("/tasks/markDone", { taskIDs: selected }, { headers: { 'X-CSRF-TOKEN': getCookie('csrf_access_token'), 'Accepts': 'application/json' } })
      .then(() => {
        this.toastAlertMessage = "Tasks successfully marked as done";
        this.setPropState("showToastAlert", true);
        this.fetchFilteredOrderedTasks("overdueTasks", "overdue", "id", "asc");
        this.fetchFilteredOrderedTasks("allTasks", "allTasks", "id", "asc");
        this.fetchFilteredOrderedTasks("doneTasks", "done", "id", "asc");
        this.fetchFilteredOrderedTasks("incompleteTasks", "incomplete", "id", "asc");

      })
      .catch(function (error) {
        console.log(error);
        if (error.response.status === 401) {
          alert("Session expired. Please log in again.");
          this.setPropState('authorized', false);
        }
      })
  }

  markSelectedasIncomplete(selected) {
    axios.post("/tasks/markIncomplete", { taskIDs: selected }, { headers: { 'X-CSRF-TOKEN': getCookie('csrf_access_token'), 'Accepts': 'application/json' } })
      .then(() => {
        this.toastAlertMessage = "Tasks successfully marked as incomplete";
        this.setPropState("showToastAlert", true);
        this.fetchFilteredOrderedTasks("incompleteTasks", "incomplete", "id", "asc");
        this.fetchFilteredOrderedTasks("doneTasks", "done", "id", "asc");
        this.fetchFilteredOrderedTasks("allTasks", "allTasks", "id", "asc");
        this.fetchFilteredOrderedTasks("overdueTasks", "overdue", "id", "asc");
      })
      .catch(function (error) {
        console.log(error);
        if (error.response.status === 401) {
          alert("Session expired. Please log in again.");
          this.setPropState('authorized', false);
        }
      })
  }

  deleteSelected(selected) {
    axios.post("/tasks/deleteTasks", { taskIDs: selected }, { headers: { 'X-CSRF-TOKEN': getCookie('csrf_access_token'), 'Accepts': 'application/json' } })
      .then(() => {
        this.toastAlertMessage = "Tasks successfully deleted";
        this.setPropState("showToastAlert", true);
        this.fetchFilteredOrderedTasks("overdueTasks", "overdue", "id", "asc");
        this.fetchFilteredOrderedTasks("allTasks", "allTasks", "id", "asc");
        this.fetchFilteredOrderedTasks("doneTasks", "done", "id", "asc");
        this.fetchFilteredOrderedTasks("incompleteTasks", "incomplete", "id", "asc");

      })
      .catch(function (error) {
        console.log(error);
        if (error.response.status === 401) {
          alert("Session expired. Please log in again.");
          this.setPropState('authorized', false);
        }
      })
  }

  checkUserAuthorized() {
    axios.get("/isAuthorized", { headers: { 'Accepts': 'application/json' } })
      .then((resp) => {
        this.setPropState('username', resp.data.username);
        this.setPropState('authorized', true);
        this.checkSubscriptionStatus();
        this.fetchFilteredOrderedTasks("overdueTasks", "overdue", "id", "asc", true);
        this.fetchFilteredOrderedTasks("allTasks", "allTasks", "id", "asc");
        this.fetchFilteredOrderedTasks("doneTasks", "done", "id", "asc");
        this.fetchFilteredOrderedTasks("incompleteTasks", "incomplete", "id", "asc");
      })
      .catch((error) => {
        console.log(error);
        if (error.response.status === 401) {
          alert("Session expired. Please log in again.");
          this.setPropState('authorized', false);
        }
      })
  }

  checkSubscriptionStatus() {
    fetch('/pushNotifications/get-subscription-status', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          console.error('Bad status code from server.');
        }

        return response.json();

      })
      .then((responseData) => {
        if (responseData.data && responseData.data.status !== undefined) {
          this.setState({ notificationSubscriptionStatus: responseData.data.status })
        }
        else {
          console.error('Bad response from server');
        }
      });
  }

  render() {
    if (this.state.authorized === false) {
      return (<Redirect to="/login" />);
    }
    else if (this.state.authorized === true) {
      return (
        <React.Fragment>
          <ToastContainer className="p-3 toastAlerts">
            <Toast show={this.state.showToastAlert} onClose={() => this.setPropState("showToastAlert", false)} delay={5000} autohide>
              <Toast.Header >
                <strong className="me-auto">{this.toastAlertMessage}</strong>
              </Toast.Header>
            </Toast>
          </ToastContainer>
          <Navbar setPropState={(prop, val) => this.setPropState(prop, val)} />
          <ToDoList incompleteTasks={this.state.incompleteTasks} doneTasks={this.state.doneTasks} overdueTasks={this.state.overdueTasks} allTasks={this.state.allTasks} markSelectedasDone={(selected) => this.markSelectedasDone(selected)} markSelectedasIncomplete={(selected) => this.markSelectedasIncomplete(selected)} deleteSelected={(selected) => this.deleteSelected(selected)} />
          <UserTab notificationSubscriptionStatus= {this.state.notificationSubscriptionStatus} username={this.state.username} showUserTab={this.state.showUserTab} setShowUserTab={(val) => this.setPropState("showUserTab", val)} setPropState={(prop, val) => this.setPropState(prop, val)} />
          <TaskForm notificationSubscriptionStatus={this.state.notificationSubscriptionStatus} modalShow={this.state.formShow} setModalShow={(val) => this.setPropState("formShow", val)} refetchTasks={() => this.refreshTasks()} />

        </React.Fragment>
      );
    }
    else
      return null;
  }
}



export default App;
