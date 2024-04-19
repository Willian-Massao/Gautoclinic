const pool  = require("./database");

module.exports  = class ownershop{
    // criar tabela
    async create(){
        const conn = await pool.getConnection();
        try{
            const sql = `CREATE TABLE if not exists ownershop (
                Id int NOT NULL AUTO_INCREMENT,
                stateRegister varchar(45) NOT NULL,
                district varchar(45) NOT NULL,
                city varchar(100) NOT NULL,
                countryId varchar(5) NOT NULL,
                postalCode varchar(10) NOT NULL,
                stateAbbr varchar(100) NOT NULL,
                name varchar(45) NOT NULL,
                lastname varchar(100) NOT NULL,
                phone varchar(15) NOT NULL,
                email varchar(255) NOT NULL,
                companydocument varchar(20) NOT NULL,
                adress varchar(255) NOT NULL,
                complement varchar(20) NOT NULL,
                number int NOT NULL,
                PRIMARY KEY (Id)
            )`;
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
    async buscaOwner(){
        const conn = await pool.getConnection();
        try {
                const sql = `SELECT stateRegister, district, city, countryId, postalCode, stateAbbr, name+' '+lastname as 'nome_completo',
                phone, email, companydocument, adress, complement, number FROM ownershop;`;
            const [rows] = await conn.query(sql);
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