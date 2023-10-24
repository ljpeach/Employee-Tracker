SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name, role.salary, CONCAT(manage.first_name, ' ', manage.last_name) AS manager
FROM employee LEFT JOIN employee AS manage ON employee.manager_id = manage.id
JOIN role ON employee.role_id = role.id
JOIN department ON role.department_id = department.id