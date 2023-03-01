const bcrypt = require('bcrypt')
const Sequelise = require("sequelize");

module.exports = (database) => {
    return database.define('users', {
        forename: {
            type: Sequelise.STRING,
            allowNull: false,
            validate: {
                is: {
                    args: ['^[a-z0-9]{2,20}$', 'i'],
                    msg: ['Server rejected forename']
                }
            }

        },
        surname: {
            type: Sequelise.STRING,
            allowNull: false,
            validate: {
                is: {
                    args: ['^[a-z0-9]{2,20}$', 'i'],
                    msg: ['Server rejected surname']
                }
            }
        },
        email: {
            type: Sequelise.STRING,
            unique: true,
            allowNull: false,
            validate: {
                isEmail: true
            }
        },
        password: {
            type: Sequelise.STRING,
            allowNull: false,
            validate: {
                is: {
                    args: ['^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[A-Za-z0-9_@./#&+-]{8,30}$'],
                    msg: ['Server rejected password']
                }
            }
        },
        position: {
            type: Sequelise.ENUM,
            values: ["STUDENT", "INSTRUCTOR"],
            allowNull: false
        }

    }, {
        hooks: {
            afterValidate: async (user, options) => {
                user.password = await bcrypt.hash(user.password, Number(process.env.SALT_ROUNDS))
            }
        },
        freezeTableName: true
    })
}


