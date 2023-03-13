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
        phone_number: {
            type: Sequelise.STRING(15),
            validate: {
                is: {
                    args: ["^\+?[0-9]{9,15}$"],
                    msg:["Database rejected Phone number: Phone number not valid"]
                }
            }
        },
        active: "BOOLEAN NOT NULL SET DEFAULT TRUE"

    }, {
        hooks: {
            afterValidate: async (user, options) => {
                user.password = await bcrypt.hash(user.password, Number(process.env.SALT_ROUNDS))
            }
        },
        freezeTableName: true
    })
}


