const { openDb } = require("./database");

module.exports = class pessoa{
    // criar tabela
    async createTable(){
        openDb().then(db=>{
            db.exec(`create table if not exists user (
                id integer primary key autoincrement,
                name varchar(255),
                email varchar(255),
                end varchar(255),
                password varchar(255),
                salt varchar(255)
            )`)
            .then(err => {
                console.log("Tabela user criada com sucesso!");
            }).catch(err => {
                console.log(err);
            });
        })
    }

    // crud

    // create
    async insertPessoa(pessoa){
        openDb().then(db=>{
            console.log(`insert into user (name, email, end, password, salt) values 
            ('${pessoa.name}',
            '${pessoa.email}',
            '${pessoa.end}',
            '${pessoa.password}',
            '${pessoa.salt}')`)
            db.exec(`insert into user (name, email, end, password, salt) values 
            ('${pessoa.name}',
            '${pessoa.email}',
            '${pessoa.end}',
            '${pessoa.password}',
            '${pessoa.salt}')`)
            .then(err => {
                console.log("Pessoa inserida com sucesso!");
            }).catch(err => {
                console.log(err);
            });
        })
    }


    // read
    async findPessoaByEmail(email){
        try {
            var db = await openDb();
            var result = await db.get(`SELECT * FROM "user" WHERE "email" = '${email}'`);
            //console.log(`SELECT * FROM "user" WHERE "email" = '${email}'`);
            //console.log(result);
            return result;
        }catch(err){
            console.log(err);
        }
    }

    async findPessoaById(id){
        try {
            var db = await openDb();
            var result = await db.get(`SELECT * FROM "user" WHERE "id" = ${id}`);
            //console.log(`SELECT * FROM "user" WHERE "id" = ${id}`);
            //console.log(result);
            return result;
        }catch(err){
            console.log(err);
        }
    }

    // update
    async updatePessoa(pessoa){
        openDb().then(db=>{
            db.get(`update user set name = '${pessoa.name}', email = '${pessoa.email}',end = '${pessoa.end}', password = '${pessoa.password}', salt = '${pessoa.salt}' where id = '${id}'`)
            .then(row =>{
                console.log(row);
                return row;
            })
        })
    }

    // delete
    async deletePessoa(){
        openDb().then(db=>{
            db.get(`delete from user where id = '${id}'`)
            .then(row =>{
                console.log(row);
                return row;
            })
        })
    }
}