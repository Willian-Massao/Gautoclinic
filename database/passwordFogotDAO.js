const pool  = require("./database");

module.exports  = class passwordForgot{
    // criar tabela
    async create(){
        const conn = await pool.getConnection();
        try{
            const sql = `CREATE TABLE if not exists passwordforgot (
                id INT NOT NULL AUTO_INCREMENT,
                email VARCHAR(45) NOT NULL,
                authVerificationCod INT NOT NULL,
                dateTimeVerificationCod DATETIME NOT NULL,
                dateTimeExpirationCod datetime DEFAULT NULL,
                PRIMARY KEY (id, email),
                INDEX email_idx (email ASC) VISIBLE,
                CONSTRAINT id
                  FOREIGN KEY (id)
                  REFERENCES gauto.users (id)
                  ON DELETE NO ACTION
                  ON UPDATE NO ACTION,
                CONSTRAINT email
                  FOREIGN KEY (email)
                  REFERENCES gauto.users (email)
                  ON DELETE NO ACTION
                  ON UPDATE NO ACTION);`;
            await conn.query(sql);
            console.log("Tabela passwordforgot criada com sucesso!");
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    // insertUpdate
    async insertOrUpdate(passwordForgot){
        const conn = await pool.getConnection();
        try{
            NN(passwordForgot);
            const sql = "insert into passwordforgot (id, email, authVerificationCod, dateTimeVerificationCod, dateTimeExpirationCod) values (?,?,?,?,DATE_ADD(?, INTERVAL 30 MINUTE)) ON DUPLICATE KEY UPDATE authVerificationCod= ?, dateTimeVerificationCod = ?, dateTimeExpirationCod = DATE_ADD(now(), INTERVAL 30 MINUTE)"
            await conn.query(sql, [passwordForgot.id, passwordForgot.userEmail, passwordForgot.randomNumber, passwordForgot.datetime, passwordForgot.datetime, passwordForgot.randomNumber, passwordForgot.datetime])
            console.log("passwordForgot inserido/updatado com sucesso!");
        }catch(err){
            console.log(err);
            throw err;
        }finally{
            conn.release();
        }
    }

    async findUser(id){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT authVerificationCod, dateTimeExpirationCod FROM passwordforgot WHERE id = ?;`;
            const [rows] = await conn.query(sql, [id]);
            return rows[0];
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }
    async describe(){
        const conn = await pool.getConnection();
        try {
            const sql = `DESCRIBE passwordforgot;`;
            const [row] = await conn.query(sql);
            return row;
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }
}

function NN(thing){
    let objKeys = Object.keys(thing);
    objKeys.forEach((key) => {
        if(thing[key] == "" || thing[key] == null){
            throw new Error("O Campo não pode ser nulo!");
        };
    });
}