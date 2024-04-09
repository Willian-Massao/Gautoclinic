const transactionDAO = require('./database/transactionDAO.js');
require('dotenv/config');
const transactions = new transactionDAO();

async function refreshTransactions() {
    let res = await transactions.select()
    let temp;

    res.forEach(async (trans) => {
        console.log(trans.check_ref)
        if(trans.status == 'PENDING'){
            const apiRes = await fetch('https://api.sumup.com/v0.1/checkouts/' + trans.id,{
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + process.env.sumup_key,
                    'Content-Type': 'application/json'
                }
            });
            temp = await apiRes.json();
            if(temp.status != 'PENDING'){
                transactions.update(temp);
            }
        }
    });
}

setInterval(refreshTransactions, 600000); // 10 minutos