const bcrypt = require('bcrypt')
const Sequelise = require('sequelize')
const { QueryTypes } = require ('sequelize')
const pg = require('pg')
pg.defaults.ssl = process.env.NODE_ENV === 'production'? { rejectUnauthorized: false } : false;
//create extension btree_gist, intarray, pg_trgm

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
        db_transaction = await database.transaction()
        user.forename = user.forename.toLowerCase();
        user.surname = user.surname.toLowerCase();
        const created_user = await users.create(user, {transaction: db_transaction});
        await students.create({
            id: created_user.id,
            grade: user.grade
        }, {
            transaction: db_transaction
        })
        await db_transaction.commit();
        return created_user.get({raw: true})
    } catch (e) {
        throw e;
    }
}


module.exports.get_user = async (field, value) => {
    try {
        return await database.query(`
                    SELECT *
                    FROM users     
                    WHERE users.${field} = :value`
            ,{
                replacements: {
                    value: value
                },
                type: QueryTypes.SELECT,
                plain: true
            })
    } catch (error) { throw error }
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


module.exports.get_student_info = async (id) => {
    return await database.query(`
        SELECT * FROM students WHERE id = ${id}
    `, {
        raw: true,
        plain: true
    })
}



module.exports.get_student_appointments = async (id, future=true) => {
    const today = new Date();
    const today_str = today.toISOString();
    const year = today_str.slice(0, 4);
    const month = today_str.slice(5, 7);
    const day = today_str.slice(8, 10);
    //The following code assumes every student will have one solid slot per day. Use LAG/LEAD in psql for general case
    const appointments = await database.query(`
        WITH cte as (
            SELECT student_id, instructor_id, year, month, day, half_hr, 
                half_hr - ROW_NUMBER() OVER (PARTITION BY student_id, instructor_id, year, month, day ORDER BY half_hr) as grp
            FROM appointments
        )
        
        SELECT instructor_id, year, month, day, MIN(half_hr) as start_time, COUNT(half_hr) AS count_halves
        FROM cte
        WHERE student_id = ${id} AND year >= ${year} AND month >= ${month} AND day >= ${day}
        GROUP BY instructor_id, year, month, day, grp
        ORDER BY year, month, day
    `, {
        raw: true,
        type: Sequelise.QueryTypes.SELECT
    })
    console.log(appointments);
    return appointments;
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

