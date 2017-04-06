var Palette = function(){
	this.default = 0xFF000000;
	this[0xFFFFFFFF] = 0xFFFFAAAA;
	this[0xFFAAAAAA] = 0xFFFF3333;
};

var Item = function(x, y, width, height){
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.canvas = document.createElement("canvas");
	this.canvas.width = width;
	this.canvas.height = height;
};
Item.prototype.update = function(img, pallette){
	var ctx = this.canvas.getContext("2d");
	
	ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	ctx.drawImage(img, this.x, this.y, this.width, this.height, 0, 0, this.canvas.width, this.canvas.height);

	var imgData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
	var data = new Uint32Array(imgData.data.buffer);
	var size = data.length;

	for(var i = 0; i < size; ++i){
		if(data[i] > 0){
			if(pallette[data[i]]){
				data[i] = pallette[data[i]];
			}else{
				data[i] = data[i] & pallette.default;
			}
		}
	}

	ctx.putImageData(imgData, 0, 0);
};


var Puzzle = function(imgUrl, componentDimensions, mainDemension){
	this.loaded = false;
	this.image = new Image();
	this.items = [];
	this.main = mainDemension;

	this.image.onload = function(){
		this.loaded = true;
	};
	this.image.src = imgUrl;

	for(var i = 0; i < componentDimensions.length; ++i){
		var dim = componentDimensions[i];
		this.items.push(new Item(dim[0], dim[1], dim[2], dim[3]));
	}
};
Puzzle.prototype.update = function(palette){
	for(var i = 0; i < this.items.length; ++i){
		this.items[i].update(this.image, palette);
	}
};

var Game = function(pieceSection, gameSection, puzzles){
	this.pallette = new Palette();
	this.puzzles = puzzles;
	this.current = 0;
	this.pieceSection = pieceSection;

	this.setPuzzle(0);
};
Game.prototype.setPuzzle = function(index){
	if(index >= 0 && index < this.puzzles.length){
		this.current = index;
		this.update();

		var puzzle = this.puzzles[index];
		this.pieceSection.innerHtml = "";
		for(var i = 0; i < puzzle.items.length; ++i){
			this.pieceSection.appendChild(puzzle.items[i].canvas);
		}
	}
};
Game.prototype.update = function(){
	var puzzle = this.puzzles[this.current];
	puzzle.update(this.pallette);
};