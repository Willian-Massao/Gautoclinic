const { use } = require("passport");
const pool  = require("./database");

module.exports  = class itens{
    // criar tabela
    async create(){
        const conn = await pool.getConnection();
        try{
            const sql = `CREATE TABLE if not exists users (
                id int NOT NULL AUTO_INCREMENT,
                name varchar(45) NOT NULL,
                email varchar(45) NOT NULL,
                lastname varchar(45) NOT NULL,
                niver date NOT NULL DEFAULT '2000-01-01',
                tel varchar(45) NOT NULL,
                cpf varchar(45) NOT NULL,
                cep varchar(45) NOT NULL,
                city varchar(45) NOT NULL,
                district varchar(45) NOT NULL,
                adress varchar(45) NOT NULL,
                number varchar(45) NOT NULL,
                password varchar(255) NOT NULL,
                salt varchar(255) NOT NULL,
                PRIMARY KEY (id,cpf,email,name),
                KEY INDICEEMAIL (email),
                KEY INDICENAME (name),
                forms json)`;
            await conn.query(sql);
            console.log("Tabela users criada com sucesso!");
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    // crud

    // create
    async insert(users){
        const conn = await pool.getConnection();
        try{
            NN(users);
            const sql = "insert into users (name, email, lastname, niver, tel, cpf, cep, city, district, adress, number, password, salt) values (?,?,?,?,?,?,?,?,?,?,?,?,?)"
            await conn.query(sql, [users.name, users.email, users.lastname, users.niver, users.tel, users.cpf, users.cep, users.city, users.district, users.adress, users.number, users.password, users.salt])
            console.log("users inserido com sucesso!");
        }catch(err){
            console.log(err);
            throw err;
        }finally{
            conn.release();
        }
    }

    async insertFormData(data){
        const conn = await pool.getConnection();
        try{
            NN(data)
            const sql = "UPDATE users SET forms = ? WHERE id = ?;"
            await conn.query(sql, [JSON.stringify(data.forms) , data.id]);
            console.log("Forms adicionado ao usuario com ID: " + data.id);
        }catch(err){
            console.log(err);
            throw err;
        }finally{
            conn.release();
        }
    }

    // read
    async findId(id){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT US.* , case when AD.id is not null then true else false end AS hasAdmin,
            case when FU.idFuncionario is not null then true else false end AS hasFunc FROM users US 
            left join admins AD on US.id = AD.id 
            left join funcionarios FU on US.id = FU.idFuncionario 
            WHERE US.id = ?`;
            const [rows] = await conn.query(sql, [id]);
            return rows[0];
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }
    
    // read
    async gettingById(id){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT * FROM users WHERE id = ?`;
            const [rows] = await conn.query(sql, [id]);
            return rows[0];
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }
    //findEmail
    async findEmail(email){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT US.id, US.email, US.name, US.password, US.salt, case when AD.id is not null then true else false end AS hasAdmin, case when FU.idFuncionario is not null then true else false end AS hasFunc FROM users US left join admins AD on US.id = AD.id left join funcionarios FU on US.id = FU.idFuncionario WHERE US.email = ?;`;
            const [rows] = await conn.query(sql, [email]);
            return rows[0];
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    // update
    async update(users){
        const conn = await pool.getConnection();
        try {
            NN(users);
            const sql = `UPDATE users SET name = ?, email = ?, lastname = ?, niver = ?, tel = ?, cpf = ?, cep = ?, city = ?, district = ?, adress = ?, number = ?, niver = ? WHERE id = ?;`;
            await conn.query(sql, [users.name, users.email, users.lastname, users.niver, users.tel, users.cpf, users.cep, users.city, users.district, users.adress, users.number, users.niver, users.id]);
        }catch(err){
            console.log(err);
            throw err;
        }finally{
            conn.release();
        }
    }

    async updatePass(users){
        const conn = await pool.getConnection();
        try {
            NN(users);
            const sql = `UPDATE users SET password =?, salt =? WHERE id = ?`;
            await conn.query(sql, [users.password, users.salt, users.id]);
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
            const sql = `SELECT id, name, email, lastname, tel, cpf, cep, city, district, adress, number, niver FROM users`;
            const [row] = await conn.query(sql);
            return row;
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    // delete
    async delete(id){
        const conn = await pool.getConnection();
        try {
            const sql = `DELETE FROM users WHERE id = ?`;
            const [row] = await conn.query(sql, [id]);
            return row;
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    async executeQuery(query){
        const conn = await pool.getConnection();
        try {
            const sql = query;
            const [row] = await conn.query(sql);
            return row;
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }
    
    async describe(){
        const conn = await pool.getConnection();
        try {
            const sql = `DESCRIBE users`;
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