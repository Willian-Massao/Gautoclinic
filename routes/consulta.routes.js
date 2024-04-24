const routes = require('express').Router();
const helper = require('../helpers/helper');

const userDAO = require('../database/userDAO.js');
const agendamentosDAO = require('../database/agendamentosDAO.js');
const funcionariosDAO = require('../database/funcionariosDAO.js');
const fun2proceDAO = require('../database/funcionariosProcedimentosDAO.js');
const procedimentosDAO = require('../database/procedimentosDAO.js');
const transactionDAO = require('../database/transactionDAO.js');

routes.post('/add/', async (req, res) => {
    const { nascimento, data, time, procedimentos, funcionario, aviso } = req.body;
    const agendamentos = new agendamentosDAO();

    let ListOf = [];

    
    try{
        //verificar se é maior de 18
        if(helper.calcularIdade(nascimento) < 18){
            throw new Error('É necessário ser maior de 18 anos para marcar um procedimento');
        }
        //verificar se a data é 1 dia a frente
        if(helper.calcularData(data) < 1){
            throw new Error('É necessário marcar com 1 dia de antecedência');
        }
        //verificar se foi aceito os termos
        if(aviso != 'on'){
            throw new Error('É necessário aceitar os termos de uso');
        }

        procedimentos.forEach(procedimento => {
            ListOf.push({
                idUser: req.user.id,
                dataHoraAgendamento: `${data} ${time}`,
                idProcedimento: procedimento,
                idFuncionario: funcionario
            });
        });
        console.log(ListOf);
        ListOf.forEach(async agendamento => {
            await agendamentos.insert(agendamento);
        });

        req.flash('success', 'Agendamento realizado com sucesso');
        res.redirect('/marcar');
    }catch(err){
        req.flash('error', err.message);
        res.redirect('/marcar');
    }
});

module.exports = routes;