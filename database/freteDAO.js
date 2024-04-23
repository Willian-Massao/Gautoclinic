const { json } = require("body-parser");
const pool  = require("./database");

module.exports  = class itens{
    // criar tabela
    async create(){
        const conn = await pool.getConnection();
        try{
            const sql = `CREATE TABLE if not exists fretes (
                idUser INT NOT NULL AUTO_INCREMENT,
                check_ref varchar(36),
                fretes JSON NOT NULL,
                info JSON NOT NULL,
                PRIMARY KEY (idUser),
                UNIQUE (check_ref),
                CONSTRAINT CHECK_REF_IDX
                  FOREIGN KEY (check_ref)
                  REFERENCES transaction (check_ref)
                  ON UPDATE NO ACTION,
                CONSTRAINT IDUSERFRETES
                  FOREIGN KEY (idUser)
                  REFERENCES users (id)
                  ON UPDATE NO ACTION);`;
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
    async InsertorUpdate(fretes){
        const conn = await pool.getConnection();
        try{
            NN(fretes);
            const sql = "insert into fretes (idUser, fretes, info) values (?,?,?) ON DUPLICATE KEY UPDATE fretes = ?, info = ?;"
            await conn.query(sql, [fretes.idUser, JSON.stringify(fretes.fretes), JSON.stringify(fretes.info), JSON.stringify(fretes.fretes), JSON.stringify(fretes.info)]);
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
            console.log(fretes);
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
    async findId(id){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT * FROM fretes WHERE idUser = ?`;
            const [rows] = await conn.query(sql, [id]);
            return rows[0];
        }catch(err){
            console.log(err);
            throw err;
        }finally{
            conn.release();
        }
    }


    // update
    async delete(id){
        const conn = await pool.getConnection();
        try {
            NN(id);
            const sql = `DELETE fretes WHERE idUser = ?`;
            await conn.query(sql, [id]);
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