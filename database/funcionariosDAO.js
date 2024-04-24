const pool  = require("./database");

module.exports  = class funcionarios{
    // criar tabela
    async create(){
        const conn = await pool.getConnection();
        try{
            const sql = `CREATE TABLE if not exists funcionarios (
                idFuncionario int NOT NULL AUTO_INCREMENT,
                nome varchar(60) NOT NULL,
                PRIMARY KEY (idFuncionario),
                CONSTRAINT idFuncionario
                FOREIGN KEY (idFuncionario)
                REFERENCES users (id))`;
            await conn.query(sql);
            console.log("Tabela funcionarios criada com sucesso!");
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    // insertUpdate
    async insert(funcionarios){
        const conn = await pool.getConnection();
        try{
            NN(funcionarios);
            const sql = "insert into funcionarios (idFuncionario, nome) values (?, ?)"
            await conn.query(sql, [funcionarios.idUser, funcionarios.nome])
            console.log("funcionarios inserido com sucesso!");
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

    //select
    async select(){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT idFuncionario, Nome FROM funcionarios;`;
            const [rows] = await conn.query(sql);
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