module.exports = (Sequelise, database) => {
    return database.define('packages', {
        hours: {
            type: Sequelise.INTEGER,
            primaryKey: true
        },
        description: {
            type: Sequelise.TEXT
        },
        price: {
            type: Sequelise.INTEGER,
            allowNull: false
        }
    }, {
        freezeTableName: true,
        timestamps: false
    })
}