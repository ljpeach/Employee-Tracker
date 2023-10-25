const inquirer = require('inquirer');
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'job_db'
});

// Main menu for application.
// Inquirer prompts that handle different user choices, asks followup questions, etc.
function menu(opt) {
    return inquirer.prompt(opt, { clearPromptOnDone: false }).then(async (answer) => {
        switch (answer.command) {
            case "View All Departments":
                return getAllDepts((res) => { res.length < 1 ? console.log('No departments!') : console.log(formatTable(res)); return menu(opt); });
            case "View All Roles":
                return getAllRoles((res) => { res.length < 1 ? console.log('No roles!') : console.log(formatTable(res)); return menu(opt); })
            case "View All Employees":
                return getAllEmployees((res) => { res.length < 1 ? console.log('No employees!') : console.log(formatTable(res)); return menu(opt); });
            case "Add a Department":
                return inquirer.prompt([{ message: "What is the name of the department?", name: "dept", type: "input" }]).then((answer) => {
                    findDept(answer.dept, (res) => {
                        if (res.length > 0) {
                            console.log("Department already exists.");
                            return menu(opt);
                        }
                        else {
                            addDept(answer.dept, (res) => { console.log("Added successfully!"); return menu(opt); })
                        }
                    })
                });
            case "Add a Role":
                const askRole = (depts) => {
                    return inquirer.prompt([
                        {
                            message: "What is the name of the role?",
                            name: "title",
                            type: "input",
                            filter: (input) => new Promise((resolve, reject) => {
                                findRole(input, (res) => {
                                    if (res.length > 0) {
                                        reject("Role already exists.");
                                    }
                                    else {
                                        resolve(input);
                                    }
                                })
                            })
                        },
                        {
                            message: "What is the salary of the role?",
                            name: 'salary',
                            type: 'input',
                        },
                        {
                            message: "Which department does the role belong to?",
                            name: 'dept',
                            type: 'list',
                            // This works bc the obj has a name and id value.
                            // Inquirer knows to display name and choose id.
                            choices: depts
                        }
                    ]).then((answers) => {
                        addRole(
                            {
                                title: answers.title,
                                salary: parseFloat(answers.salary),
                                dept: answers.dept
                            }
                            , () => { console.log('Successfully added!'); return menu(opt); })
                    });
                }
                return getAllDepts((res) => {
                    if (res.length < 1) {
                        console.log("There are no departments for this role to belong to!");
                        return menu(opt);
                    }
                    return askRole(res);
                });
            case "Add an Employee":
                const askEmployee = (roles, managers) => {
                    return inquirer.prompt([
                        {
                            message: "What is the employee's first name?",
                            name: "firstName",
                            type: "input"
                        },
                        {
                            message: "What is the employee's last name?",
                            name: "lastName",
                            type: "input"
                        },
                        {
                            message: "What is the employee's role?",
                            name: "role",
                            type: "list",
                            choices: roles.map(roleRow => roleRow.title)
                        },
                        {
                            message: "Who is the employee's manager?",
                            name: "manager",
                            type: "list",
                            choices: managers.map(manageRow => manageRow.first_name + " " + manageRow.last_name).concat(['none'])
                        }
                    ]).then((answers) => {
                        addEmployee({
                            firstName: answers.firstName,
                            lastName: answers.lastName,
                            role: answers.role,
                            manager: answers.manager
                        }, () => { console.log('Successfully added!'); return menu(opt); })
                    })
                };
                return getAllRoles((roles) => {
                    if (roles.length < 1) {
                        console.log("No roles to assign! You can't have an employee if they don't have a job!");
                        return menu(opt);
                    }
                    getAllEmployees((managers) =>
                        askEmployee(roles, managers)
                    )
                }
                )
            case "Update an Employee Role":
                const askUpdate = (employee, roles) => {
                    return inquirer.prompt([
                        {
                            message: "What employee's role do you want to update?",
                            name: "employee",
                            type: "list",
                            choices: employee.map(employeeRow => ({ name: employeeRow.first_name + " " + employeeRow.last_name, value: employeeRow.id }))
                        },
                        {
                            message: "Which role do you want to assign the selected employee?",
                            name: "role",
                            type: "list",
                            choices: roles.map(roleRow => ({ name: roleRow.title, value: roleRow.id }))
                        }
                    ]).then((answers) => {
                        updateEmployee({
                            role: answers.role,
                            id: answers.employee
                        }, () => { console.log('Successfully updated!'); return menu(opt); })
                    })
                };
                return getAllEmployees(employees => {
                    if (employees.length < 1) {
                        console.log("There are no employees to update!");
                        return menu(opt);
                    }
                    getAllRoles(roles => {
                        if (roles.length < 1) {
                            console.log("There are no roles to update change to!");
                            return menu(opt);
                        }
                        askUpdate(employees, roles)
                    })
                });
                break;
            default:
                db.end();
        }
    });
}

// Begins application.
function init() {
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

// Gets all depts. Callback determines what is to be done with results of query.
function getAllDepts(callback) {
    db.query("\
    SELECT name, id \
    FROM department"
        , async (err, result) => { err ? console.error(err) : callback(result); }
    );
}

// Gets all roles. Callback determines what is to be done with results of query.
function getAllRoles(callback) {
    db.query("\
    SELECT title, role.id, name AS deparment, salary\
    FROM role\
    JOIN department ON department_id = department.id\
    ORDER BY role.id"
        , (err, result) => { err ? console.error(err) : callback(result); });
}

// Gets all employees. Callback determines what is to be done with results of query.
function getAllEmployees(callback) {
    db.query("\
    SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name, role.salary, CONCAT(manage.first_name, ' ', manage.last_name) AS manager\
    FROM employee LEFT JOIN employee AS manage ON employee.manager_id = manage.id\
    JOIN role ON employee.role_id = role.id\
    JOIN department ON role.department_id = department.id\
    ORDER BY employee.id"
        , (err, result) => { err ? console.error(err) : callback(result); });
}

// Used to add a new department to the DB.
// dept is the name of the dept as a string.
function addDept(dept, callback) {
    db.query("\
    INSERT INTO department (name) VALUE (?)", dept,
        (err, result) => { err ? console.error(err) : callback(result); });
}

// Used to add a new role to the DB.
// role parameter is obj with title, salary, and dept fields.
function addRole(role, callback) {
    // Ensure specified department exists
    findDept(role.dept, (deptID) => {
        if (deptID.length < 1) {
            throw new Error("Department does not exist.");
        }
        // Create role as specified
        db.query("\
        INSERT INTO role (title, salary, department_id) VALUE (?, ?, ?)", [role.title, role.salary, deptID[0].id],
            (err, result) => { err ? console.error(err) : callback(result); });
    });
}

// Used to add a new employee to the DB.
// employee parameter is obj with role, manager, firstName, and lastName fields.
// Manager can be set to null by defining manager as the string "none"
// Callback determines how results are handled. 
function addEmployee(employee, callback) {
    // Ensure the role exists
    findRole(employee.role, (roleID) => {
        if (roleID.length < 1) {
            throw new Error("Role does not exist.");
        }
        // Ensure the specified manager exists if the employee has a manager.
        if (employee.manager != 'none') {
            findEmployee(...employee.manager.split(" "), (managerID) => {
                if (employee.manager != null && managerID.length < 1) {
                    throw new Error("Manager does not exist.");
                }
                // If manager and role found, create new employee.
                db.query("\
                    INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUE (?, ?, ?, ?)", [employee.firstName, employee.lastName, roleID[0].id, managerID[0].id],
                    (err, result) => { err ? console.error(err) : callback(result); });
            });
        }
        else {
            // Create new employee with no manager. 
            db.query("\
                    INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUE (?, ?, ?, ?)", [employee.firstName, employee.lastName, roleID[0].id, null],
                (err, result) => { err ? console.error(err) : callback(result); });
        }

    });
}

// Finds a dept from dept name. Callback determines what is done with result.
function findDept(deptName, callback) {
    db.query('SELECT id FROM department WHERE name=?', deptName, (err, result) => { err ? console.error(err) : callback(result); });
}

// Finds a role from a role name. Callback determines what is done with result.
function findRole(roleName, callback) {
    db.query('SELECT id FROM role WHERE title=?', roleName, (err, result) => { err ? console.error(err) : callback(result) });

}

// Finds an employee based on their first and last name. Callback determines what is to be done with matches
function findEmployee(first, last, callback) {
    db.query('SELECT id FROM employee WHERE first_name=? AND last_name=?', [first, last], (err, result) => { err ? console.error(err) : callback(result); });
}

// Body has role, id fields. 
// Updates employee with id to have role
function updateEmployee(body, callback) {
    db.query('UPDATE employee SET role_id=? WHERE id=?', [body.role, body.id], (err, result) => {
        err ? console.error(err) : callback(result);
    })
}

// Function for displaying table outputs in a pretty way.
function formatTable(table) {
    let ans = '' // Accumulator for our table string
    let keys = Object.keys(table[0]); //All keys
    let colWid = []; //Record for how wide each column is
    // Determine each column's width, create and add bottom border for header.
    for (let i = 0; i < keys.length; i++) {
        let maxLength = String(keys[i]).length;
        for (let j = 0; j < table.length; j++) {
            let currentLen = String(table[j][keys[i]]).length;
            if (maxLength < currentLen) { maxLength = currentLen; }
        }
        colWid.push(Math.ceil(maxLength / 8));
        ans += "-".repeat(maxLength) + '\t';
    }
    ans += '\n';
    // Create header row. Number of tabs determined by width of row compared to length of key.
    let keyRow = ''
    for (let i = 0; i < keys.length; i++) {
        keyRow += keys[i] + '\t'.repeat(colWid[i] - Math.ceil((String(keys[i]).length + 1) / 8) + 1);
    }
    // Add header row before border
    ans = keyRow + '\n' + ans;
    // add rest of rows to table str, tabs determined by width of row compared to length of word.
    for (let i = 0; i < table.length; i++) {
        for (let j = 0; j < keys.length; j++) {
            let word = table[i][keys[j]]
            ans += word + '\t'.repeat(colWid[j] - Math.ceil((String(word).length + 1) / 8) + 1);
        }
        ans += '\n';
    }
    // Return full string.
    return ans;
}

init();