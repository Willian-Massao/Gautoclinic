const pool  = require("./database");

module.exports  = class ownershop{
    // criar tabela
    async create(){
        const conn = await pool.getConnection();
        try{
            const sql = `CREATE TABLE if not exists ownershop (
                IdUser INT NOT NULL,
                stateRegister VARCHAR(45) NOT NULL,
                district VARCHAR(45) NOT NULL,
                city VARCHAR(45) NOT NULL,
                countryId VARCHAR(45) NOT NULL,
                postalCode VARCHAR(45) NOT NULL,
                stateAbbr VARCHAR(45) NOT NULL,
                PRIMARY KEY (IdUser),
                CONSTRAINT idDeUsuario
                  FOREIGN KEY (IdUser)
                  REFERENCES gauto.users (id)
                  ON DELETE NO ACTION
                  ON UPDATE NO ACTION);`;
            await conn.query(sql);
            console.log("Tabela ownershop criada com sucesso!");
        }catch(err){
            console.log(err);
            throw err;
        }finally{
            conn.release();
        }
    }

    // crud

    // create
    async InsertorUpdate(owner){
        const conn = await pool.getConnection();
        try{
            NN(owner);
            const sql = "insert into ownershop (IdUser, stateRegister, district, city, countryId, postalCode, stateAbbr) values (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE stateRegister = ?, district =?, city = ?, countryId =?, postalCode = ?, stateAbbr = ? "
            await conn.query(sql, [owner.id, owner.stateRegister, owner.district, owner.city, owner.countryId, owner.postalCode, owner.stateAbbr, owner.stateRegister, owner.district, owner.city, owner.countryId, owner.postalCode, owner.stateAbbr])
            console.log("ownershop inserido/updatado com sucesso!");
        }catch(err){
            console.log(err);
            throw err;
        }finally{
            conn.release();
        }
    }

    // read
    async findId(id){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT * FROM ownershop WHERE IdUser = ?`;
            const [rows] = await conn.query(sql, [id]);
            return rows[0];
        }catch(err){
            console.log(err);
            throw err;
        }finally{
            conn.release();
        }
    }


    async describe(){
        const conn = await pool.getConnection();
        try {
            const sql = `DESCRIBE fretes`;
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