

onmessage = (e) => {
    tasks = e.data;
    checkReminders(tasks);
};


function checkReminders(tasks){
    let now = new Date().getTime();
    let currentReminders = [];
    for(let task of tasks){
        for(let reminder of task.reminders)
        {
            
            let reminderTime = new Date(reminder.remind_time).getTime();
            if(now >= reminderTime)
            {
                currentReminders.push({task:task, reminder:reminder});
                break;
            }
        }
    }
    if(currentReminders.length>0)
        postMessage(currentReminders);
    else
        setTimeout(()=>checkReminders(tasks),10000);
}



