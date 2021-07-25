import React, { Component } from 'react';
import './App.css';
import { Overlay, Popover, ListGroup } from 'react-bootstrap';

class Notifications extends Component {
    constructor(props) {
        super(props);
    }

    render() {

        let allCaughtUpMsg =null;
        if(this.props.overdueTasks.length===0 && this.props.remindersBehindSchedule.length===0)
        {
            allCaughtUpMsg = <div className="notificationElement text-muted"><i>You're all caught up!</i></div>
        }
        
        let overdueTasksList=null;
        if(this.props.overdueTasks.length>0){
        let overdueTasks = this.props.overdueTasks.map((task, index) => {
            return (
                <ListGroup.Item variant="danger" key={"overdue_" + (index + 1)}>{task.taskName}</ListGroup.Item>
            );
        });
        overdueTasksList = <ListGroup className="notificationElement">
            <ListGroup.Item key="overdueHeader" className="bg-danger" style={{ color: "white", fontWeight: "bold" }}>Tasks Overdue</ListGroup.Item>
            {overdueTasks}
        </ListGroup>;
        }

        let missedRemindersList = null;
        if (this.props.remindersBehindSchedule>0) {
            let missedReminders = this.props.remindersBehindSchedule.map((reminder, index) => {
                return (

                    <ListGroup.Item variant="warning" key={"missedReminder_" + (index + 1)}>{reminder.task.taskName}</ListGroup.Item>
                );
            });;
            missedRemindersList = <ListGroup className="notificationElement">
                <ListGroup.Item key="missedRemindersHeader" className="bg-warning" style={{ color: "black", fontWeight: "bold" }}>Reminders Missed</ListGroup.Item>
                {missedReminders}
            </ListGroup>;
        }
        return (
            <Overlay
                show={this.props.showNotifications}
                target={this.props.notificationsButtonRef.current}
                placement="bottom"
                rootClose={true}
                onHide={() => this.props.setPropState("showNotifications", false)}
            >
                <Popover id="popover-contained" style={{ width: "400px", maxWidth: "400px" }}>
                    <Popover.Body>
                            {allCaughtUpMsg}
                            {overdueTasksList}
                            {missedRemindersList}
                    </Popover.Body>
                </Popover>
            </Overlay>
        );
    }
}

export default Notifications;