
import React, { Component } from 'react';
import './App.css';
import axios from 'axios';
import ToDoList from './todolist'
import Form from './form'
import Reminders from './reminders';
import { Offcanvas } from 'react-bootstrap';


class Navbar extends Component {
  render() {
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

              <button className="btn btn-outline-success me-2" id="addTaskButton" type="button" onClick={() => this.props.setPropState("formShow", true)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-plus-lg" viewBox="0 0 18 18">
                  <path d="M8 0a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2H9v6a1 1 0 1 1-2 0V9H1a1 1 0 0 1 0-2h6V1a1 1 0 0 1 1-1z" />
                </svg>
              </button>
              <button className="btn btn-outline-secondary" type="button" id="userTab" onClick={() => this.props.setPropState("showUserTab", true)}>
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

class UserTab extends Component{
  render(){
    return(
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
      tasks: [],
      currentReminders: [],
      showToasts: [false, false, false],
      formShow: false,
      showUserTab: false,
    };
    this.worker = null;
  }

  componentDidMount() {
    this.fetchTasks();
    this.worker = new window.Worker("./remindMeWorker.js");
    this.worker.addEventListener("message", event => {
      let newState = Object.assign({}, this.state);
      newState["currentReminders"] = event.data.slice(0, 3);
      newState.showToasts = newState["currentReminders"].map(() => true);
      this.setState(newState);
    });
  }
  setPropState(prop, val) {
    let newState = Object.assign({},this.state);
    newState[prop] = val;
    this.setState(newState);
  }

  fetchTasks() {
    axios.get(process.env.REACT_APP_API_SERVER + "/tasks/getAllTasks", { headers: { 'Accepts': 'application/json' } })
      .then((resp) => {
        let newState = Object.assign({},this.state);
        newState["tasks"] = resp.data.tasks;
        this.worker.postMessage(resp.data.tasks);
        this.setState(newState);
      })
      .catch(function (error) {
        console.log(error);
      })
  }

  clearReminder(index) {

    let newState = Object.assign({}, this.state);
    newState.showToasts[index] = !this.state.showToasts[index];
    this.setState(newState);
    if (newState.showToasts.every((state) => state === false)) {
      axios.post(process.env.REACT_APP_API_SERVER + "/reminders/deleteReminders", { tasksReminders: this.state.currentReminders })
        .then(() => {
          console.log("reminders removed");
        })
        .catch((error) => {
          console.error(error);

        });
        this.fetchTasks();
      setTimeout(() => {
        this.worker.postMessage(this.state.tasks);
      }, 5000)
    }
  }

  render() {
    return (
      <React.Fragment>
        <Navbar setPropState={(prop,val)=>this.setPropState(prop,val)}/>
        <ToDoList tasks={this.state.tasks} />
        <UserTab showUserTab={this.state.showUserTab} setShowUserTab={(val) => this.setPropState("showUserTab",val)}/>
        <Reminders tasksReminders={this.state.currentReminders} showToasts={this.state.showToasts} dismissToast={(index) => this.clearReminder(index)} />
        <Form modalShow={this.state.formShow} setModalShow={(val) => this.setPropState("formShow", val)} refetchTasks={()=>this.fetchTasks()}/>
      </React.Fragment>
    );
  }
}



export default App;
