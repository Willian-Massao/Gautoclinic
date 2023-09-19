const sqlite3 = require("sqlite3");
const { openDb } = require("./database");

module.exports  = class itens{
    // criar tabela
    async createTable(){
        openDb().then(db=>{
            db.exec(`create table if not exists item (
                id integer primary key autoincrement,
                name varchar(255),
                price varchar(255),
                image varchar(255),
                section varchar(255)
            )`)
            .then(err => {
                console.log("Tabela item criada com sucesso!");
            }).catch(err => {
                console.log(err);
            });
        })
    }

    // crud

    // create
    async insertItem(item){
        openDb().then(db=>{
            db.exec(`insert into item (name, price, image, section) values ('${item.name}', '${item.price}', '${item.image}', '${item.section}')`)
            .then(err => {
                console.log("Item inserido com sucesso!");
            }).catch(err => {
                console.log(err);
            });
        })
    }

    // read
    async findItemById(id){
        try {
            var db = await openDb();
            var result = await db.get(`SELECT * FROM "item" WHERE "id" = '${id}'`);
            return result;
        }catch(err){
            console.log(err);
        }
    }

    async findItemAll(){
        try {
            var db = await openDb();
            var result = await db.all(`SELECT * FROM "item"`);
            return result;
        }catch(err){
            console.log(err);
        }
    }

    async findItemBySection(section){
        try {
            var db = await openDb();
            var result = await db.all(`SELECT * FROM "item" WHERE "section" = '${section}'`);
            return result;
        }catch(err){
            console.log(err);
        }
    }
}