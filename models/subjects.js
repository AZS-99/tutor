const Sequelise = require('sequelize');

module.exports = (database) => {
    return database.define('subjects', {
        subject: Sequelise.STRING
    });
}