INSERT INTO department (name)
VALUES ('Front End'),
       ('Back End'),
       ('Testing');

INSERT INTO role (title, salary, department_id)
VALUES 
    ('HTML Dev',20.5,1),
    ('CSS Styler',25.5,1),
    ('JS Scripter',35.758,1),
    ('Express Writer',40.43532,2),
    ('Database Architect',28.3421,2),
    ('API Author',45.54324,2),
    ('Unit Writer',35.412390,3),
    ('Everything Breaker',19.43123,3),
    ('User Outreach',17.665463464,3);



INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES 
    ('Bill','Smith',1,NULL),
    ('Jim','Smucker',1,1),
    ('Jane','Elsher',1,1),
    ('Sarah','Solace',2,NULL),
    ('Joe','Levine',2,4),
    ('Joey','Thatcher',2,4),
    ('Nicole','Raven',3,NULL),
    ('Grace','Bardot',3,7),
    ('Tim','James',3,7),
    ('Juanita','Hansley',4,NULL),
    ('Davit','Cromwell',4,10),
    ('Dipesh','Ashley',4,10),
    ('Mathew','Monroe',5,NULL),
    ('Madeline','West',5,13),
    ('Monica','Langley',5,13),
    ('John','Daughtler',6,NULL),
    ('Nelson','Madison',6,16),
    ('Jan','Marley',6,16),
    ('Ramon','Ellis',7,NULL),
    ('Gloria','Lyle',7,19),
    ('Jess','Cassidy',7,19),
    ('Judy','Warkentin',8,NULL),
    ('Vern','Warkentin',8,22),
    ('Gwen','Peachey',8,22),
    ('Urbane','Peachey',9,NULL),
    ('James','Gingrich',9,25),
    ('Joan','Gingrich',9,25);