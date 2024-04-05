/*jshint esversion: 6 */

var image = ["Atacadista.png","Atacadista2.png","Atacadista3.png"];
var select = 0;

for (let i = 0;i < 99;i++) {
    task(i);
}

function addLittleCar(){
    let item;
    if(localStorage.getItem("item") != null){
        item = localStorage.getItem("item");
        item = JSON.parse(item);
    }else{
        item = [];
    }
    item.push({
        id: window.location.href.split("/")[4],
        name: document.getElementById("name-info").innerText,
        price: document.getElementById("preco-info").innerText.replace("Preço: R$ ",""),
        section: document.getElementById("sec-info").innerText
    });
    localStorage.setItem("item", JSON.stringify(item));
}

function expand(bb){
    document.getElementById("contato").style.height = `${bb}`;
}

function Switch(prevback){
    var spanbackground = document.getElementById("span-background").style.backgroundImage = `url(src/${image[select]})`;
    if(prevback == 0){
        select--;
        select < 0? ((select = 2),(spanbackground)) : spanbackground;
    }else{
        select++;
        select > 2? ((select = 0),(spanbackground)) : spanbackground;
    }
}

function task(i) {
    setTimeout(function() {
        Switch(1);
    }, 3000 * i);
}
//teste
function hideShow(myClass, visible) {	
    let display = document.getElementsByClassName(myClass);
    visible == false? [].forEach.call(display, function (el) { el.style.display = "none";}):[].forEach.call(display, function (el) { el.style.display = "flex";});
}

function checkAll(myClass) {	
    let checkbox = document.getElementsByClassName(myClass);
    [].forEach.call(checkbox, function (el) {el.click();});  
}

function aa(){
    window.scrollTo(0,0);
}

function apper(nsei){
    document.getElementById("menu").style.marginLeft = `${nsei}px`;
}

function toggle(mode, visible){
    document.getElementById(mode).style.display = visible;
}


function search(){

    const resultDiv = document.getElementById("result");

    resultDiv.innerHTML = '';

    let search = (document.getElementById("teste").value).toLowerCase();

    if(search != ''){
        let itemsUnfilted = document.getElementsByTagName("figure");
        let items = [];
        [].forEach.call( itemsUnfilted ,function(num) { items.push((num.children[1].children[0].outerText).toLowerCase());});
        let result = items.filter(s => s.includes(search));
        if(result != ''){
        document.getElementById('cascaded').style.display = "unset";
        [].forEach.call( result , function(g){ resultDiv.innerHTML += `<p>${g}</p>`;});
        }else{
            resultDiv.innerHTML += `<p>Produto não encontrado</p>`;
        }
    }else if(search == ''){
        document.getElementById('cascaded').style.display = "none";
    }
}
