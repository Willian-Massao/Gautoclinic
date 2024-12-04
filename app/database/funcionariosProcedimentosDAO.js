const pool  = require("./database");

module.exports  = class funcionariosProcedimentos{
    // criar tabela
    async create(){
        const conn = await pool.getConnection();
        try{
            const sql = `CREATE TABLE if not exists funcionariosprocedimentos (
                idFuncionario INT NOT NULL,
                idProcedimento INT NOT NULL,
                INDEX idfuncionarioprocedimento_idx (idFuncionario ASC) VISIBLE,
                INDEX idProcedimentoFuncionario_idx (idProcedimento ASC) VISIBLE,
                CONSTRAINT idfuncionarioprocedimento
                  FOREIGN KEY (idFuncionario)
                  REFERENCES funcionarios (idFuncionario)
                  ON DELETE CASCADE
                  ON UPDATE NO ACTION,
                CONSTRAINT idProcedimentoFuncionario
                  FOREIGN KEY (idProcedimento)
                  REFERENCES procedimentos (idProcedimentos)
                  ON DELETE CASCADE
                  ON UPDATE NO ACTION);`;
            await conn.query(sql);
            console.log("Tabela funcionariosprocedimentos criada com sucesso!");
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    // insert
    async insert(funcionariosprocedimentos){
        const conn = await pool.getConnection();
        try{
            NN(funcionariosprocedimentos);
            const sql = "insert into funcionariosprocedimentos (idFuncionario, idProcedimento)"
            await conn.query(sql, [funcionariosprocedimentos.idFuncionario,funcionariosprocedimentos.idProcedimento])
            console.log("funcionariosprocedimentos inserido com sucesso!");
        }catch(err){
            console.log(err);
            throw err;
        }finally{
            conn.release();
        }
    }

    // Confirma
    async deleteFuncionario(funcionariosprocedimentos){
        const conn = await pool.getConnection();
        try{
            NN(funcionariosprocedimentos);
            const sql = "update funcionariosprocedimentos where idFuncionario = ?)"
            await conn.query(sql, [funcionariosprocedimentos.idFuncionario])
            console.log("funcionariosprocedimentos inserido com sucesso!");
        }catch(err){
            console.log(err);
            throw err;
        }finally{
            conn.release();
        }
    }

    async deleteProcedimento(id){
        const conn = await pool.getConnection();
        try{
            NN(funcionariosprocedimentos);
            const sql = "update funcionariosprocedimentos where idProcedimento = ?)"
            await conn.query(sql, [funcionariosprocedimentos.idProcedimento])
            console.log("funcionariosprocedimentos inserido com sucesso!");
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