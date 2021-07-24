

onmessage = (e) => {
    tasks = e.data;
    checkReminders(tasks);
};


function checkReminders(tasks){
    let now = new Date().getTime();
    let alerts = {
        reminders: [],
        overdue: [],
    };
    for(let task of tasks){
        let taskDue = new Date(task.taskDue).getTime();
        if(now>=taskDue){
            alerts.overdue.push(task);
        }
        
        for(let reminder of task.reminders)
        {
            
            let reminderTime = new Date(reminder.remindTime).getTime();
            if(now >= reminderTime)
            {
                alerts.reminders.push({task:task, reminder:reminder});
                break;
            }
        }
    }
    if(alerts.reminders.length || alerts.overdue.length)
        postMessage(alerts);
    else
        setTimeout(()=>checkReminders(tasks),10000);
}



