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




module.exports.set_appointment = async (year, month, day, half_hr, count_halves, student_id) => {
    try {
        for (let i = 0; i < count_halves; ++i) {
            await appointments.create({
                year: year,
                month: month,
                day: day,
                half_hr: half_hr + i,
                student_id: student_id,
                instructor_id: 2,
                status: "PENDING"
            });
        }
    } catch (e) {throw e;}
}


module.exports.get_packages = async () => {
    return await packages.findAll({
        raw: true
    });

}


module.exports.get_unavailable_slots = async (year, month, day, instructor_id) => {
    try {
        return await database.query(`
            SELECT half_hr
            FROM appointments
            WHERE appointments.year = :year AND appointments.month = :month AND appointments.day = :day 
              AND appointments.instructor_id = :instructor_id`
        ,{
            replacements: {
                year: year,
                month: month,
                day: day,
                instructor_id: instructor_id
            },
                type: QueryTypes.SELECT,
                raw: true
        })
    } catch (e) {
        throw e;
    }
}