import React, { Component } from 'react';
import './App.css';
import {Toast, ToastContainer} from 'react-bootstrap';

class Reminders extends Component {


    render() {
        let tasks = this.props.tasksReminders;

        let toasts = tasks.map((taskReminder, index) => {
            return (<Toast key={index+1} show={this.props.showToasts[index]} onClose={()=>this.props.dismissToast(index)} delay={10000} autohide>
                <Toast.Header>
                    <strong className="me-auto">tu-du</strong>
                    <small className="text-muted">{"Due in "+taskReminder.reminder.reminder}</small>
                </Toast.Header>
                <Toast.Body>{taskReminder.task.taskName}</Toast.Body>
            </Toast>);
        });
        return (
            <React.Fragment>
                <ToastContainer position="bottom-end">
                    {toasts}
                </ToastContainer>
            </React.Fragment>
        );
    }
}

export default Reminders;