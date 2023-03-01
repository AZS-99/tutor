const bcrypt = require('bcrypt')
const Sequelise = require('sequelize')
const { QueryTypes } = require ('sequelize')
const pg = require('pg')
pg.defaults.ssl = process.env.NODE_ENV === 'production'? { rejectUnauthorized: false } : false;

const database = new Sequelise(process.env.DATABASE_URL)

const users = require('./users')(database);
const students = require('./students')(database);
const instructors = require('./instructors')(database);
const instructor_subjects = require('./instructorSubjects')(database);
const appointments = require('./appointments')(database);
const classes = require('./classes')(database);
const sessions = require('./sessions')(database);
const packages = require('./packages')(database);
const admins = require('./admins')(database);
const subjects = require('./subjects')(database);


let db_transaction;


module.exports.initialise = async () => {
    try {await database.sync()}
    catch(e) {throw e}
}


module.exports.is_admin = async (id) => {
    try {
        return await database.query(`
            SELECT EXISTS(SELECT 1 FROM admins WHERE id = :id)
        `, {
            replacements: {id: id},
            raw: true,
            plain: true
        });
    } catch (e) {
        throw e;
    }
}

module.exports.add_user = async (user) => {
    try {
        db_transaction = await database.transaction()
        user.forename = user.forename.toLowerCase();
        user.surname = user.surname.toLowerCase();
        const created_user = await users.create(user, {transaction: db_transaction});

        if (user.position === 'STUDENT') {
            await students.create({
                id: created_user.id,
                grade: user.grade
            }, {
                transaction: db_transaction
            })
        } else if (user.position === 'INSTRUCTOR') {
            await instructors.create({
                id: created_user.id,
                hourly_rate: 20
            }, {
                transaction: db_transaction
            });

            for (const subject_id of user.subjects) {
                await instructor_subjects.create({
                    instructor_id: created_user.id,
                    subject_id: subject_id
                }, {
                    transaction: db_transaction
                })
            }
        }

        await db_transaction.commit();
        return created_user.get({raw: true})

    } catch (e) {
        throw e;
    }
}

module.exports.get_subjects = async () => {
    return await subjects.findAll({raw: true});
}

module.exports.get_user = async (field, value) => {
    try {
        return await database.query(`
                    SELECT id, INITCAP(forename) AS forename, INITCAP(surname) AS surname, email, password, position  
                    FROM users
                    WHERE ${field} = :value`
            ,{
                replacements: {
                    value: value
                },
                type: QueryTypes.SELECT,
                plain: true
            });
    } catch (error) { throw error }
}


module.exports.get_instructors = async () => {
    try {
        return await database.query(`
            SELECT instructors.id AS instructor_id, INITCAP(users.forename) AS forename, 
                INITCAP(users.surname) AS surname, instructors.hourly_rate
            FROM instructors LEFT JOIN users ON users.id = instructors.id
        `, {
            type: QueryTypes.SELECT,
            raw: true
        });
    } catch (e) {
        throw e
    }
}




module.exports.set_appointment = async (info) => {
    try {
        db_transaction = await database.transaction();
        let user;
        for (let i = 0; i < info.duration; ++i) {
            user = await appointments.create({
                year: info.year,
                month: info.month,
                day: info.day,
                half_hr: info.half_hr + i,
                student_id: info.student_id,
                instructor_id: info.instructor_id
            }, {
                transaction: db_transaction
            });
            await classes.create({
                id: user.id,
                subject: info.subject
            }, {
                transaction: db_transaction
            })
        }
        await db_transaction.commit();
    } catch (e) {throw e;}
}


module.exports.get_packages = async () => {
    return await packages.findAll({
        raw: true
    });
}


module.exports.get_unavailable_slots = async (year, month, day, instructor_id) => {
    try {
        const slots = await appointments.findAll({
            attributes: ['half_hr'],
            where: {
                year: year,
                month: month,
                day: day,
                instructor_id: instructor_id
            },
            raw: true
        })
        return slots.map(slot => slot.half_hr);
    } catch (e) {
        throw e;
    }
}


module.exports.add_student_hrs = async (id, hrs) => {
    try {
        await database.query(`
        UPDATE students
        SET half_hrs_credit = half_hrs_credit + ${hrs}
        WHERE id = ${id}
    `)
    } catch (e) {
        throw e;
    }
}

module.exports.edit_user = async (id, field, value) => {
    try {
        await database.query(`
            UPDATE users
            SET ${field} = :value
            WHERE id = ${id}
        `, {
            replacements: {value: value}
        })
    } catch (e) {
        throw e
    }
}


module.exports.get_user_info = async (user) => {
    try {
        const table = user.position.toLowerCase() + 's';
        return await database.query(`
        SELECT * FROM ${table} WHERE id = :id
    `, {
            replacements: {id: user.id},
            type: QueryTypes.SELECT,
            raw: true,
            plain: true
        })
    } catch (e) {
        throw e;
    }
}



module.exports.get_appointments = async (user, future=true) => {
    const today = new Date();
    const today_str = today.toISOString();
    const year = today_str.slice(0, 4);
    const month = today_str.slice(5, 7);
    const day = today_str.slice(8, 10);

    let all_appointments;

    if (user.position === "STUDENT") {
        all_appointments = await database.query(`
                WITH cte AS (
                    SELECT student_id, instructor_id, year, month, day, half_hr, 
                        half_hr - ROW_NUMBER() OVER (PARTITION BY student_id, instructor_id, year, month, day ORDER BY half_hr) AS grp,
                        subject, topic, details
                    FROM appointments LEFT JOIN classes ON appointments.id = classes.id
                )
                
               
                SELECT instructor_id, INITCAP(users.forename) AS forename, INITCAP(users.surname) AS surname, year, 
                    month, day, MIN(half_hr) AS start_time, COUNT(half_hr) AS count_halves, subject, topic, details
                FROM cte LEFT JOIN users ON instructor_id = users.id
                WHERE student_id = :user_id AND year >= ${year} AND month >= ${month} AND day >= ${day}
                GROUP BY instructor_id, users.forename, users.surname, year, month, day, subject, topic, details, grp
                ORDER BY year, month, day
        `, {
            replacements: {user_id: user.id},
            type: QueryTypes.SELECT,
            raw: true
        })
    } else if (user.position === "INSTRUCTOR") {
        all_appointments = await database.query(`
                WITH cte AS (
                    SELECT student_id, instructor_id, year, month, day, half_hr, 
                        half_hr - ROW_NUMBER() OVER (PARTITION BY student_id, instructor_id, year, month, day ORDER BY half_hr) AS grp,
                        subject, topic, details
                    FROM appointments LEFT JOIN classes ON appointments.id = classes.id
                )
                
                
                SELECT student_id, INITCAP(users.forename) AS forename, INITCAP(users.surname) AS surname, year, month, 
                    day, MIN(half_hr) AS start_time, COUNT(half_hr) AS count_halves, subject, topic, details
                FROM cte LEFT JOIN users on student_id = users.id
                WHERE instructor_id = :user_id AND year >= ${year} AND month >= ${month} AND day >= ${day}
                GROUP BY student_id, users.forename, users.surname, year, month, day, subject, topic, details, grp
                ORDER BY year, month, day
        `, {
            replacements: {user_id: user.id},
            type: QueryTypes.SELECT,
            raw: true
        })
    }


    return all_appointments;
}


module.exports.cancel_slot = async (id, year, month, day, start_half_hr, count_halves) => {
    db_transaction = await database.transaction();
    for (let i = 0; i < count_halves; ++i) {
        await database.query(`
            DELETE FROM appointments
            WHERE student_id = ${id} AND year = ${year} AND month = ${month} AND half_hr = ${start_half_hr} + ${i}
        `, {
            transaction: db_transaction
        });
    }

    await database.query(`
        UPDATE students
        SET half_hrs_credit = half_hrs_credit + ${count_halves}
        WHERE id = ${id}
    `, {
        transaction: db_transaction
    });

    await db_transaction.commit();
}

