const inputs = document.querySelectorAll(".input");

inputs.forEach(input => {
	if(input.value != ""){
		let parent = input.parentNode.parentNode;
		parent.classList.add("focus");
	}
});

function addcl(){
	let parent = this.parentNode.parentNode;
	parent.classList.add("focus");
}

function remcl(){
	let parent = this.parentNode.parentNode;
	if(this.value == ""){
		parent.classList.remove("focus");
	}
}

inputs.forEach(input => {
	input.addEventListener("focus", addcl);
	input.addEventListener("blur", remcl);
});
