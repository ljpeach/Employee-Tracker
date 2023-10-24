const inquirer = require('inquirer');
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'job_db'
});

function menu(opt) {
    inquirer.prompt(opt, { clearPromptOnDone: false }).then(async (answer) => {
        switch (answer.command) {
            case "View All Departments":
                getAllDepts((res) => { console.log(res); menu(opt); });
                break;
            case "View All Roles":
                getAllRoles((res) => { console.log(res); menu(opt); })
                break;
            case "View All Employees":
                getAllEmployees((res) => { console.log(res); menu(opt); });
                break;
            case "Add a Department":
                inquirer.prompt([{ message: "What is the name of the department?", name: "dept", type: "input" }]).then((answer) => {
                    findDept(answer.dept, (res) => {
                        if (res.length > 0) {
                            console.log("Department already exists.");
                            menu(opt);
                        }
                        else {
                            addDept(answer.dept, (res) => { console.log("Added successfully!"); menu(opt); })
                        }
                    })
                });
                break;
            case "Add a Role":
                inquirer.prompt([
                    {
                        message: "What is the name of the role?",
                        name: "title"
                        type: "input"
                    }
                    {
                        message: "What is the salary of the role?"
                    }
                    {
                        message: "Which department does the role belong to?"
                    }
                ]).then((answers) => { });
                break;
            case "Add an Employee":
                console.log("TBD");
                break;
            case "Update an Employee Role":
                console.log("TBD");
                break;
            default:
                process.exit(0);
        }
    });
}

async function init() {
    const opt = [{
        message: "What would you like to do?",
        name: "command",
        type: "list",
        choices: [
            "View All Departments",
            "View All Roles",
            "View All Employees",
            "Add a Department",
            "Add a Role",
            "Add an Employee",
            "Update an Employee Role",
            "Exit"
        ],

    }]
    menu(opt);
}

function getAllDepts(callback) {
    db.query("\
    SELECT name, id \
    FROM department"
        , async (err, result) => { err ? console.error(err) : callback(result); }
    );
}

function getAllRoles(callback) {
    db.query("\
    SELECT title, role.id, name AS deparment, salary\
    FROM role\
    JOIN department ON department_id = department.id\
    ORDER BY role.id"
        , (err, result) => { err ? console.error(err) : callback(result); });
}

function getAllEmployees(callback) {
    db.query("\
    SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name, role.salary, CONCAT(manage.first_name, ' ', manage.last_name) AS manager\
    FROM employee LEFT JOIN employee AS manage ON employee.manager_id = manage.id\
    JOIN role ON employee.role_id = role.id\
    JOIN department ON role.department_id = department.id\
    ORDER BY employee.id"
        , (err, result) => { err ? console.error(err) : callback(result); });
}

function addDept(dept, callback) {
    db.query("\
    INSERT INTO department (name) VALUE (?)", dept,
        (err, result) => { err ? console.error(err) : callback(result); });
}

function addRole(role, callback) {
    findDept(role.dept, (deptID) => {
        console.log(deptID);
        if (deptID.length < 1) {
            throw new Error("Department does not exist.");
        }
        db.query("\
        INSERT INTO role (title, salary, department_id) VALUE (?, ?, ?)", [role.title, role.salary, deptID[0].id],
            (err, result) => { err ? console.error(err) : console.log("Successfully Added!"); });
    });
}

function addEmployee(employee, callback) {
    findRole(employee.role, (roleID) => {
        if (roleID.length < 1) {
            throw new Error("Role does not exist.");
        }
        findEmployee(...employee.manager.split(" "), (managerID, roleID) => {
            if (employee.manager != null && managerID.length < 1) {
                throw new Error("Manager does not exist.");
            }
            db.query("\
                INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUE (?, ?, ?, ?)", [employee.firstName, employee.lastName, roleID, managerID],
                (err, result) => { err ? console.error(err) : console.log("Successfully Added!"); });
        });
    });



}

function findDept(deptName, callback) {
    db.query('SELECT id FROM department WHERE name=?', deptName, (err, result) => { err ? console.error(err) : callback(result); });
}

function findRole(roleName, callback) {
    db.query('SELECT id FROM role WHERE title=?', roleName, (err, result) => { err ? console.error(err) : callback(result) });

}

function findEmployee(first, last, callback) {
    db.query('SELECT id FROM employee WHERE first_name=? AND last_name=?', [first, last], (err, result) => { err ? console.error(err) : callback(result); });
}

function updateEmployee(body) {
    db.query('UDPATE employee SET role=? WHERE id=?', [body.role, body.id], (err, result) => {
        err ? console.error(err) : console.log(result);
    })
}

// addRole({ dept: "Front End", title: "Graphic Designer", salary: 60.9 });
// inquirer.prompt(menu).then();

init();