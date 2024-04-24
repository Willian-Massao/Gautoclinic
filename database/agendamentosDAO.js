const pool  = require("./database");

module.exports  = class agendamentos{
    // criar tabela
    async create(){
        const conn = await pool.getConnection();
        try{
            const sql = `CREATE TABLE if not exists agendamentos (
                id varchar(36) NOT NULL,
                idUser int NOT NULL,
                dataHoraAgendamento datetime NOT NULL,
                idFuncionario int NOT NULL,
                confirmado tinyint NOT NULL DEFAULT '0',
                idProcedimento int NOT NULL,
                price float NOT NULL,
                pagamentoOnline tinyint NOT NULL DEFAULT '0',
                check_ref varchar(36) NOT NULL,
                status varchar(10) NOT NULL DEFAULT 'PENDING',
                KEY IdFuncionarioagendamento_idx (idFuncionario),
                KEY idUserAgendamentos (idUser),
                KEY idProcedimentoAgendamentos_idx (idProcedimento),
                CONSTRAINT IdFuncionarioagendamento FOREIGN KEY (idFuncionario) REFERENCES funcionarios (idFuncionario),
                CONSTRAINT idProcedimentoAgendamentos FOREIGN KEY (idProcedimento) REFERENCES procedimentos (idProcedimentos),
                CONSTRAINT idUserAgendamentos FOREIGN KEY (idUser) REFERENCES users (id));`;
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
            const sql = "insert into agendamentos (id, idUser, dataHoraAgendamento, idProcedimento,idFuncionario, check_ref, price) values (?,?,?,?,?,?,?)"
            await conn.query(sql, [agendamentos.idsumup, agendamentos.idUser,agendamentos.dataHoraAgendamento, agendamentos.idProcedimento ,agendamentos.idFuncionario, agendamentos.check_ref, agendamentos.price])
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

    async findId(agendamentos){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT id FROM agendamentos WHERE idUser = ? and check_ref = ?;`;
            const [rows] = await conn.query(sql, [agendamentos.idUser, agendamentos.check_ref]);
            return rows;
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