import React, { Component } from 'react';
import './App.css';
import { Toast, ToastContainer } from 'react-bootstrap';

class Reminders extends Component {


    render() {
        let reminders = this.props.reminders;
        let overdueToast = null;
        let reminderToasts = null;
        if(this.props.showOverdueToast===true)
            overdueToast = <Toast key={0} show={this.props.showOverdueToast} onClose={() => this.props.nextOverdue()} delay={10000} autohide>
                <Toast.Header style={{backgroundColor: "#dc3545", color: "white"}}>
                    <strong className="me-auto">tu-du</strong>
                    <small>{"Due Now"}</small>
                </Toast.Header>
                <Toast.Body>{this.props.overdue.taskName}</Toast.Body>
            </Toast>;

        
            reminderToasts = reminders.map((reminder, index) => {
                if(this.props.showReminderToasts[index])
                    return (<Toast key={index + 1} show={this.props.showReminderToasts[index]} onClose={() => this.props.nextReminder(index)} delay={10000} autohide>
                        <Toast.Header style={{backgroundColor: "#ffc107", color: "black"}}>
                            <strong className="me-auto">tu-du</strong>
                            <small className="text-muted">{"Due in " + reminder.reminder.reminder}</small>
                        </Toast.Header>
                        <Toast.Body>{reminder.task.taskName}</Toast.Body>
                    </Toast>);
                else
                   return null;
            });
        return (
            <React.Fragment>
                <ToastContainer position="bottom-end">
                    {reminderToasts}
                    {overdueToast}
                </ToastContainer>
            </React.Fragment>
        );
    }
}

export default Reminders;