import React, { Component } from 'react';
import './App.css';
import { Overlay, Popover, ListGroup} from 'react-bootstrap';

class Notifications extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        let overdueTasks = this.props.overdueTasks.map((task, index) => {
            return (
                <ListGroup.Item variant="danger" key={"overdue_" + (index + 1)}>{task.taskName}</ListGroup.Item>
            );
        });
        let overdueTasksList = <ListGroup className="notificationElement">
            <ListGroup.Item key="overdueHeader" className="bg-danger" style={{color: "white", fontWeight: "bold"}}>Tasks Overdue</ListGroup.Item>
            {overdueTasks}
        </ListGroup>;
        let missedReminders = this.props.remindersBehindSchedule.map((reminder, index) => {
            return (
                
                <ListGroup.Item variant="warning" key={"missedReminder_" + (index + 1)}>{reminder.task.taskName}</ListGroup.Item>
            );
        });;

        let missedRemindersList = <ListGroup className="notificationElement lastElement">
            <ListGroup.Item key="missedRemindersHeader" className="bg-warning" style={{color: "black", fontWeight: "bold"}}>Reminders Missed</ListGroup.Item>
            {missedReminders}
        </ListGroup>;
        return (
            <Overlay
                show={this.props.showNotifications}
                target={this.props.notificationsButtonRef.current}
                placement="bottom"
                rootClose={true}
                onHide={()=>this.props.setPropState("showNotifications",false)}
            >
                <Popover id="popover-contained" style={{ width: "400px", maxWidth: "400px" }}>
                    <Popover.Body>
                     
                        {overdueTasksList}
                        {missedRemindersList}
                </Popover.Body>
                </Popover>
            </Overlay>
        );
    }
}

export default Notifications;