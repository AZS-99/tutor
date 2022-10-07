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
const sessions = require('./sessions')(Sequelise, database);


module.exports.initialise = async () => {
    try {await database.sync()}
    catch(e) {throw e}
}


module.exports.add_user = async (user) => {
    try {
        user.forename = user.forename.toLowerCase();
        user.surname = user.surname.toLowerCase();
        const created_user = await users.create(user);
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