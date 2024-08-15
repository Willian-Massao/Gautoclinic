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
                PRIMARY KEY (idUser, idProcedimento, check_ref),
                KEY idUserAgendamentos (idUser),
                KEY idProcedimentoAgendamentos_idx (idProcedimento),
                CONSTRAINT idProcedimentoAgendamentos FOREIGN KEY (idProcedimento) REFERENCES procedimentos (idProcedimentos),
                CONSTRAINT idUserAgendamentos FOREIGN KEY (idUser) REFERENCES users (id));`;
            await conn.query(sql);
            await conn.query(`SET @@global.time_zone = '+03:00';`);
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

    async selecionaAgendamentos(){
        const conn = await pool.getConnection();
        try{
            const sql = `SELECT CONVERT_TZ(dataHoraAgendamento, '+00:00', '-03:00') AS dataHoraAgendamento, status, idProcedimento FROM agendamentos WHERE CONVERT_TZ(dataHoraAgendamento, '+00:00', '-03:00') >= DATE_ADD(DATE(CONVERT_TZ(NOW(), '+00:00', '-03:00')), INTERVAL 1 DAY);`
            const [rows] = await conn.query(sql)
            console.log("agendamentos selecionados");
            return rows;
        }catch(err){
            console.log(err);
            throw err;
        }finally{
            conn.release();
        }
    }

    async select(agendamentos){
        const conn = await pool.getConnection();
        try{
            const sql = "SELECT AG.id, AG.dataHoraAgendamento, AG.dataHoraAgendamento, AG.confirmado, AG.price, AG.pagamentoOnline, AG.check_ref, AG.status, US.name as idUser, PC.nome as idProcedimento FROM agendamentos AG left join users US on US.id = AG.idUser left join procedimentos PC on AG.idProcedimento = PC.idProcedimentos;"
            const [rows] = await conn.query(sql, [agendamentos.data])
            console.log("agendamentos selecionados");
            return rows;
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
            const sql = "UPDATE agendamentos SET confirmado = ?, status = ? WHERE idUser = ? AND check_ref = ?;"
            await conn.query(sql, [agendamentos.confirmado, agendamentos.status, agendamentos.idUser, agendamentos.check_ref])
            console.log("agendamentos atualizado com sucesso!");
        }catch(err){
            console.log(err);
            throw err;
        }finally{
            conn.release();
        }
    }

    async changeStatus(agendamentos){
        // esse só deve ser utilizado na atualização de status da compra
        const conn = await pool.getConnection();
        try{
            NN(agendamentos);
            const sql = "UPDATE agendamentos SET confirmado = ?, status = ? WHERE check_ref = ?;"
            await conn.query(sql, [agendamentos.confirmado, agendamentos.status, agendamentos.check_ref])
            console.log("agendamentos atualizado com sucesso!");
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

    async findUser(agendamentos){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT agend.dataHoraAgendamento, agend.price, agend.status, proc.nome, agend.check_ref FROM agendamentos agend inner join procedimentos proc on proc.idProcedimentos = agend.idProcedimento WHERE idUser = ?;`;
            const [rows] = await conn.query(sql, [agendamentos.idUser]);
            return rows;
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    // async findFunc(agendamentos){
    //     const conn = await pool.getConnection();
    //     try {
    //         const sql = `SELECT AG.id, AG.dataHoraAgendamento, AG.dataHoraAgendamento, AG.confirmado, AG.price, AG.pagamentoOnline, AG.check_ref, AG.status, US.name as idUser, PC.nome as idProcedimento FROM agendamentos AG left join users US on US.id = AG.idUser left join procedimentos PC on AG.idProcedimento = PC.idProcedimentos WHERE idFuncionario = ?;`;
    //         const [rows] = await conn.query(sql, [agendamentos.idFuncionario]);
    //         return rows;
    //     }catch(err){
    //         console.log(err);
    //     }finally{
    //         conn.release();
    //     }
    // }

    async findCheck_ref(agendamentos){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT AG.id, AG.dataHoraAgendamento, AG.dataHoraAgendamento, AG.confirmado, PC.preco AS price, AG.pagamentoOnline, AG.check_ref, AG.status, US.name as nameUser, US.id as idUser, PC.nome as idProcedimento FROM agendamentos AG left join users US on US.id = AG.idUser left join procedimentos PC on AG.idProcedimento = PC.idProcedimentos WHERE idFuncionario = ? and check_ref = ?;`;
            const [rows] = await conn.query(sql, [ agendamentos.idFuncionario, agendamentos.check_ref ]);
            return rows;
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    async verificaHorarioFunc(agendamentos){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT CASE 
    WHEN EXISTS (
        SELECT 1
        FROM agendamentos 
        WHERE 
			idProcedimento = ?
			AND status = 'PAID' 
            AND ABS(TIMESTAMPDIFF(MINUTE, dataHoraAgendamento, ?)) < 60 
    ) 
    THEN 0 
    ELSE 1 
END AS PodeAgendar;`;
            const [rows] = await conn.query(sql, [agendamentos.id, agendamentos.dataHoraAgendamento]);
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
        if(thing[key] === "" || thing[key] === null){
            throw new Error("O Campo " + thing[key] + "veio nulo!");
        };
    });
}