const pool  = require("./database");

module.exports  = class agendamentos{
    // criar tabela
    async create(){
        const conn = await pool.getConnection();
        try{
            const sql = `CREATE TABLE if not exists agendamentos (
                idUser int NOT NULL,
                dataHoraAgendamento datetime NOT NULL,
                idFuncionario int NOT NULL,
                confirmado tinyint NOT NULL DEFAULT 0,
                idProcedimento int NOT NULL,
                KEY IdFuncionarioagendamento_idx (idFuncionario),
                KEY idUserAgendamentos (idUser),
                KEY idProcedimentoAgendamentos_idx (idProcedimento),
                CONSTRAINT IdFuncionarioagendamento FOREIGN KEY (idFuncionario) REFERENCES funcionarios (idFuncionario),
                CONSTRAINT idProcedimentoAgendamentos FOREIGN KEY (idProcedimento) REFERENCES procedimentos (idProcedimentos),
                CONSTRAINT idUserAgendamentos FOREIGN KEY (idUser) REFERENCES users (id)
            );`;
            await conn.query(sql);
            console.log("Tabela agendamentos criada com sucesso!");
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    // insertUpdate
    async insert(agendamentos){
        const conn = await pool.getConnection();
        try{
            NN(agendamentos);
            const sql = "insert into agendamentos (idUser, dataHoraAgendamento,idFuncionario,confirmado)"
            await conn.query(sql, [agendamentos.idUser,agendamentos.dataHoraAgendamento, agendamentos.idFuncionario, agendamentos.confirmado])
            console.log("agendamentos inserido com sucesso!");
        }catch(err){
            console.log(err);
            throw err;
        }finally{
            conn.release();
        }
    }

    // Confirma
    async confirmaAgendamento(agendamentos){
        const conn = await pool.getConnection();
        try{
            NN(agendamentos);
            const sql = "update agendamentos set confirmado = ? where idUser = ? AND (idUser, dataHoraAgendamento,idFuncionario,confirmado)"
            await conn.query(sql, [agendamentos.idUser,agendamentos.dataHoraAgendamento, agendamentos.idFuncionario, agendamentos.confirmado])
            console.log("agendamentos inserido com sucesso!");
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