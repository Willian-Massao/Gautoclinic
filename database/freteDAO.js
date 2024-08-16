const { json } = require("body-parser");
const pool  = require("./database");

module.exports  = class itens{
    // criar tabela
    async create(){
        const conn = await pool.getConnection();
        try{
            const sql = `CREATE TABLE IF NOT exists fretes(
                idFrete int NOT NULL AUTO_INCREMENT,
                userId int NOT NULL,
                agencias json NOT NULL,
                \`to\` json NOT NULL,
                \`from\` json NOT NULL,
                check_ref varchar(32) NOT NULL,
                PRIMARY KEY (idFrete),
                KEY userIdFretes (userId),
                KEY checkrefuiid (check_ref),
                CONSTRAINT checkrefuiid FOREIGN KEY (check_ref) REFERENCES transaction (check_ref),
                CONSTRAINT userIdFretes FOREIGN KEY (userId) REFERENCES users (id)
            );`;
            await conn.query(sql);
            console.log("Tabela frete criada com sucesso!");
        }catch(err){
            console.log(err);
            throw err;
        }finally{
            conn.release();
        }
    }

    // crud

    // create
    async insert(fretes){
        const conn = await pool.getConnection();
        try{
            NN(fretes);
            const sql = "insert into fretes (userId, agencias, \`to\`, \`from\`, check_ref) values (?,?,?,?,?);"
            await conn.query(sql, [fretes.userId, JSON.stringify(fretes.agencias), JSON.stringify(fretes.to), JSON.stringify(fretes.from), fretes.check_ref]);
            console.log("fretes inserido com sucesso!");
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    async update(fretes){
        const conn = await pool.getConnection();
        try{
            NN(fretes);
            const sql = "update fretes set fretes = ?, info = ?, check_ref = ? where idUser = ?;"
            await conn.query(sql, [JSON.stringify(fretes.fretes), JSON.stringify(fretes.info), fretes.check_ref, fretes.idUser]);
            console.log("fretes atualizados com sucesso!");
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    // read
    async findCheckRef(check_ref){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT * FROM fretes WHERE check_ref = ?`;
            const [rows] = await conn.query(sql, [check_ref]);
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