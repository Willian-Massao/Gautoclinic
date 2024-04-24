const pool  = require("./database");

module.exports  = class procedimentos{
    // criar tabela
    async create(){
        const conn = await pool.getConnection();
        try{
            const sql = `CREATE TABLE if not exists procedimentos (
                idProcedimentos INT NOT NULL AUTO_INCREMENT,
                nome VARCHAR(200) NOT NULL,
                preco FLOAT NOT NULL,
                tempoAproximado int NOT NULL,
                PRIMARY KEY (idProcedimentos));`;
            await conn.query(sql);
            console.log("Tabela procedimentos criada com sucesso!");
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    // insertUpdate
    async insertOrUpdate(procedimentos){
        const conn = await pool.getConnection();
        try{
            NN(procedimentos);
            const sql = "insert into procedimentos (idProcedimentos, nome, preco, tempoAproximado ON DUPLICATE KEY UPDATE nome= ?, preco = ?, tempoAproximado=?"
            await conn.query(sql, [procedimentos.id, procedimentos.nome, procedimentos.preco, procedimentos.tempoAproximado, procedimentos.nome, procedimentos.preco, procedimentos.tempoAproximado])
            console.log("procedimentos inserido/updatado com sucesso!");
        }catch(err){
            console.log(err);
            throw err;
        }finally{
            conn.release();
        }
    }

    async delete(procedimentos){
        const conn = await pool.getConnection();
        try{
            NN(procedimentos);
            const sql = "delete procedimentos where idProcedimentos = ?"
            await conn.query(sql, [procedimentos.id])
            console.log("procedimentos inserido/updatado com sucesso!");
        }catch(err){
            console.log(err);
            throw err;
        }finally{
            conn.release();
        }
    }

    async selecionaProcedimentos(procedimentos){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT * FROM procedimentos WHERE idProcedimentos = ?;`;
            const [rows] = await conn.query(sql, [procedimentos.id]);
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