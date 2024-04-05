const pool  = require("./database");

module.exports  = class itens{
    // criar tabela
    async create(){
        const conn = await pool.getConnection();
        try{
            const sql = `CREATE TABLE if not exists transaction (
                id VARCHAR(36) NOT NULL,
                idUser INT NOT NULL,
                check_ref VARCHAR(32) NOT NULL,
                price FLOAT NOT NULL,
                currency VARCHAR(3) NOT NULL,
                pay2mail varchar(255) NOT NULL,
                status varchar(45) NOT NULL,
                date DATETIME NOT NULL,
                PRIMARY KEY (id))`;
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
            return rows[0];
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
}

function NN(thing){
    let objKeys = Object.keys(thing);
    objKeys.forEach((key) => {
        if(thing[key] == "" || thing[key] == null){
            throw new Error("O Campo não pode ser nulo!");
        };
    });
}