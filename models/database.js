const bcrypt = require('bcrypt')
const Sequelise = require('sequelize')
const { QueryTypes } = require ('sequelize')
const pg = require('pg')
pg.defaults.ssl = process.env.NODE_ENV === 'production'? { rejectUnauthorized: false } : false;

const database = new Sequelise(process.env.DATABASE_URL)

const users = require('./users')(Sequelise, database);
const students = require('./students')(Sequelise, database);
const instructors = require('./instructors')(Sequelise, database);
const appointments = require('./appointments')(Sequelise, database);
const sessions = require('./sessions')(Sequelise, database);
const packages = require('./packages')(Sequelise, database);


let db_transaction;


module.exports.initialise = async () => {
    try {await database.sync()}
    catch(e) {throw e}
}



module.exports.add_user = async (user) => {
    try {
        console.log(user);
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
            })
        }

        await db_transaction.commit();
        return created_user.get({raw: true})
    } catch (e) {
        throw e;
    }
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




module.exports.set_appointment = async (year, month, day, half_hr, half_hrs_count, student_id, instructor_id) => {
    try {
        db_transaction = await database.transaction();
        for (let i = 0; i < half_hrs_count; ++i) {
            await appointments.create({
                year: year,
                month: month,
                day: day,
                half_hr: half_hr + i,
                student_id: student_id,
                instructor_id: instructor_id,
                status: "PENDING"
            }, {
                transaction: db_transaction
            });
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

    const is_student = user.position === "STUDENT"
    let all_appointments;

    if (is_student) {
        all_appointments = await database.query(`
                WITH cte AS (
                    SELECT student_id, instructor_id, year, month, day, half_hr, 
                        half_hr - ROW_NUMBER() OVER (PARTITION BY student_id, instructor_id, year, month, day ORDER BY half_hr) as grp
                    FROM appointments
                )
                
               
                SELECT instructor_id, INITCAP(users.forename) AS forename, INITCAP(users.surname) AS surname, year, 
                    month, day, MIN(half_hr) AS start_time, COUNT(half_hr) AS count_halves
                FROM cte LEFT JOIN users ON instructor_id = users.id
                WHERE student_id = :user_id AND year >= ${year} AND month >= ${month} AND day >= ${day}
                GROUP BY instructor_id, users.forename, users.surname, year, month, day, grp
                ORDER BY year, month, day
        `, {
            replacements: {user_id: user.id},
            type: QueryTypes.SELECT,
            raw: true
        })
    } else {
        all_appointments = await database.query(`
                WITH cte as (
                    SELECT student_id, instructor_id, year, month, day, half_hr, 
                        half_hr - ROW_NUMBER() OVER (PARTITION BY student_id, instructor_id, year, month, day ORDER BY half_hr) as grp
                    FROM appointments
                )
                
                
                SELECT student_id, INITCAP(users.forename) AS forename, INITCAP(users.surname) AS surname, year, month, 
                    day, MIN(half_hr) AS start_time, COUNT(half_hr) AS count_halves
                FROM cte LEFT JOIN users on student_id = users.id
                WHERE instructor_id = :user_id AND year >= ${year} AND month >= ${month} AND day >= ${day}
                GROUP BY student_id, users.forename, users.surname, year, month, day, grp
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

