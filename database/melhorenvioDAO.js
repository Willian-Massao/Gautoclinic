const pool  = require("./database");

module.exports  = class melhorEnvioTokens{
    // criar tabela
    async create(){
        const conn = await pool.getConnection();
        try{
            const sql = `CREATE TABLE if not exists melhorEnvioTokens (
                id INT NOT NULL AUTO_INCREMENT,
                client_id INT NOT NULL,
                client_secret varchar(40) NOT NULL,
                code TEXT(1700) NOT NULL,
                token TEXT(1700) NOT NULL,
                `;
            await conn.query(sql);
            console.log("Tabela melhorEnvioTokens criada com sucesso!");
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    // insertUpdate
    async insertOrUpdate(melhorEnvioTokens){
        const conn = await pool.getConnection();
        try{
            NN(melhorEnvioTokens);
            const sql = "insert into melhorEnvioTokens (id, email, authVerificationCod, dateTimeVerificationCod, dateTimeExpirationCod) values (?,?,?,?,DATE_ADD(?, INTERVAL 30 MINUTE)) ON DUPLICATE KEY UPDATE authVerificationCod= ?, dateTimeVerificationCod = ?, dateTimeExpirationCod = DATE_ADD(now(), INTERVAL 30 MINUTE)"
            await conn.query(sql, [melhorEnvioTokens.id, melhorEnvioTokens.userEmail, melhorEnvioTokens.randomNumber, melhorEnvioTokens.datetime, melhorEnvioTokens.datetime, melhorEnvioTokens.randomNumber, melhorEnvioTokens.datetime])
            console.log("melhorEnvioTokens inserido/updatado com sucesso!");
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
            const sql = `SELECT authVerificationCod, dateTimeExpirationCod FROM melhorEnvioTokens WHERE id = ?;`;
            const [rows] = await conn.query(sql, [id]);
            return rows[0];
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