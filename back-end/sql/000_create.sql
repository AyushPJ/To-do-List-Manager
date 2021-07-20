drop table if exists tasks_reminders;
drop table if exists tasks_tags;
drop table if exists tasks;
drop table if exists tags;
drop table if exists reminders;

create table tasks(
       id serial primary key,
       task_name text not null,
       task_due timestamp not null,
       task_desc text
);
create table tags (
       id serial primary key,
       name text unique not null
);

create table reminders (
       id serial primary key,
       reminder text not null,
       remind_time timestamp not null
);
create table tasks_reminders(
     task_id integer not null references tasks(id) on delete cascade,
     reminder_id integer not null references reminders(id) on delete cascade
);   

create table tasks_tags(
     task_id integer not null references tasks(id) on delete cascade,
     tag_id integer not null references tags(id) on delete cascade
); 