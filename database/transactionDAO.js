const pool  = require("./database");

module.exports  = class itens{
    // criar tabela
    async create(){
        const conn = await pool.getConnection();
        try{
            const sql = `CREATE TABLE if not exists transaction (
                id varchar(36) NOT NULL,
                idUser int NOT NULL,
                check_ref varchar(32) NOT NULL,
                price float NOT NULL,
                currency varchar(3) NOT NULL,
                pay2mail varchar(255) NOT NULL,
                status varchar(45) NOT NULL,
                date datetime NOT NULL,
                shipping json DEFAULT NULL,
                PRIMARY KEY (id),
                PRIMARY KEY (check_ref),
                KEY \`is user transaction_idx\` (idUser),
                KEY \`check_ref uuid\` (check_ref),
                CONSTRAINT \`is user transaction\` FOREIGN KEY (idUser) REFERENCES users (id)
              )`;
            await conn.query(sql);
            console.log("Tabela transaction criada com sucesso!");
        }catch(err){
            console.log(err);
            throw err;
        }finally{
            conn.release();
        }
    }

    // crud

    // create
    async insert(transaction){
        const conn = await pool.getConnection();
        try{
            NN(transaction);
            const sql = "insert into transaction (id, idUser, check_ref, price, currency, pay2mail, status, date) values (?,?,?,?,?,?,?,?)"
            await conn.query(sql, [transaction.id, transaction.idUser, transaction.check_ref, transaction.price, transaction.currency, transaction.pay2mail, transaction.status, transaction.date])
            console.log("transaction inserido com sucesso!");
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
            const sql = `SELECT * FROM transaction WHERE check_ref = ?`;
            const [rows] = await conn.query(sql, [id]);
            return rows;
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    async findUser(id){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT * FROM transaction WHERE idUser = ?`;
            const [rows] = await conn.query(sql, [id]);
            return rows;
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    async like(trans){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT * FROM transaction WHERE check_ref LIKE ? and idUser = ?`;
            const [rows] = await conn.query(sql, [`${trans.check_ref}%`, trans.idUser]);
            return rows;
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }


    // update
    async update(transaction){
        const conn = await pool.getConnection();
        try {
            NN(transaction);
            const sql = `UPDATE transaction SET status = ? WHERE id = ?`;
            await conn.query(sql, [transaction.status, transaction.id]);
        }catch(err){
            console.log(err);
            throw err;
        }finally{
            conn.release();
        }
    }

    async select(){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT * FROM transaction`;
            const [row] = await conn.query(sql);
            return row;
        }catch(err){
            console.log(err);
            conn.release();
        }finally{
            conn.release();
        }
    }
    async describe(){
        const conn = await pool.getConnection();
        try {
            const sql = `DESCRIBE transaction`;
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