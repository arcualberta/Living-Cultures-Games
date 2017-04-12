function DragObject() {
    var dragObject = {};

    this.setData = function (title, data) {
        dragObject[title] = data;
    };

    this.getData = function (title) {
        return dragObject[title];
    };
};

var dragObject = new DragObject();

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
	this.game = null;
	this.offsetX = -1;
	this.offsetY = -1;
	this.div = document.createElement("div");

	this.div.appendChild(this.canvas);

	var div = $(this.div);
	div.addClass("item");
	div.focusin(function(event){
		div.css("resize", "both");
		event.preventDefault();
	});

	div.focusout(function(event){
		div.css("resize", "none");
		event.preventDefault();
	});

	//canvas.attr("draggable", true);
	div.css("width", "100px");
	div.css("position", "absolute");
	div.css("overflow", "hidden");
	div.attr("draggable", true);
	var _this = this;


	div.bind('dragstart', function(ev){
		var event = ev.originalEvent;

        if (event.touches && event.touches.length > 0) {
            event = event.touches[0];
        }

        _this.clickStart(event.pageX - $(ev.target).offset().left, event.pageY - $(ev.target).offset().top);
        dragObject.setData("item", _this);

        return true;
	});
	/*div.mousedown(function(event){
		var rect = _this.div.getBoundingClientRect();
		_this.clickStart(event.clientX - rect.left, event.clientY - rect.top);
	});
	div.mouseup(function(event){
		_this.clickEnd();
	});
	$(document).mousemove(function(event){
		_this.clickDrag(event.pageX, event.pageY);
	});*/
};
Item.prototype.clickStart = function(x, y){
	if(this.game.selectedItem != null){
		$(this.game.seletedItem.canvas).focusout();
	}

	this.offsetX = x;
	this.offsetY = y;

	this.game.seletedItem = this;
	//this.div.focus();
};
Item.prototype.clickDrag = function(x, y){
	if(this.game.seletedItem == this && this.offsetX >= 0){
		$(this.div).css("left", (x - this.offsetX) + "px");
		$(this.div).css("top", (y - this.offsetY) + "px");
	}
};
Item.prototype.clickEnd = function(){
	this.game.seletedItem = null;
	this.offsetX = -1;
	this.offsetY = -1;
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
	this.main = {
		dim: mainDemension,
		canvas: document.createElement("canvas")
	};

	this.main.canvas.width = mainDemension[2];
	this.main.canvas.height = mainDemension[3];

	this.image.onload = function(){
		this.loaded = true;
	};
	this.image.src = imgUrl;

	for(var i = 0; i < componentDimensions.length; ++i){
		var dim = componentDimensions[i];
		this.items.push(new Item(dim[0], dim[1], dim[2], dim[3], game));
	}
};
Puzzle.prototype.update = function(palette){
	var dim = this.main.dim;
	var canvas = this.main.canvas;
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(this.image, dim[0], dim[1], dim[2], dim[3], 0, 0, canvas.width, canvas.height);

	for(var i = 0; i < this.items.length; ++i){
		this.items[i].update(this.image, palette);
	}
};
Puzzle.prototype.setGame = function(game){
	for(var i = 0; i < this.items.length; ++i){
		this.items[i].game = game;
	}
};

var Game = function(gameSection, puzzles){
	this.pallette = new Palette();
	this.puzzles = puzzles;
	this.current = 0;
	this.gameSection = gameSection;
	this.selectedItem = null;

	this.setPuzzle(0);

	$(gameSection).bind('dragover touchstart', function (ev) {
        ev.preventDefault();
    });

	$(gameSection).bind('drop', function(ev){
		var event = ev.originalEvent;
		var data = dragData.getData("item");
		div = $(data.div);

		var x = parseInt(data.offsetX);
        var y = parseInt(data.offsetY);
        
        var scrollX = $(window).scrollLeft();
        var scrollY = $(window).scrollTop();
        
        div.css('left', event.clientX - $(gameSection).offset().left + scrollX - x);
        div.css('top', event.clientY - $(gameSection).offset().top + scrollY - y);
	});
};
Game.prototype.setPuzzle = function(index){
	if(index >= 0 && index < this.puzzles.length){
		this.current = index;
		this.update();

		var puzzle = this.puzzles[index];
		puzzle.setGame(this);
		this.gameSection.innerHtml = "";

		var width = $(document).innerWidth();
		var height = $(document).innerHeight();

		$(puzzle.main.canvas).css("position", 'absolute');
		$(puzzle.main.canvas).css("top", '25px');
		$(puzzle.main.canvas).css("left", (width / 2.0) + 'px');
		$(puzzle.main.canvas).css("height", (height - 50) + 'px');

		this.gameSection.appendChild(puzzle.main.canvas);

		for(var i = 0; i < puzzle.items.length; ++i){
			var item = $(puzzle.items[i].div);
			item.css("top", (Math.random() * (height - 60)) + 'px');
			item.css("left", (Math.random() * (width / 2.0)) + 'px');

			item.attr('tabindex', (i + 1));
			this.gameSection.appendChild(puzzle.items[i].div);
		}
	}
};
Game.prototype.update = function(){
	var convertValue = function(r, g, b){
		var result = Math.max(r, 0) | (Math.max(g, 0) << 8) | (Math.max(b, 0) << 16);

		return result | (0xFF000000);
	}

	var colour = $("#colourSelect")[0].value;
	var int = parseInt(colour);
	var r = 0x000000FF & int;
	var g = 0x000000FF & (int >> 8);
	var b = 0x000000FF & (int >> 16);

	this.pallette[0xFFFFFFFF] = int;
	this.pallette[0xFFAAAAAA] = convertValue(r - 100, g - 110, b - 120);

	var puzzle = this.puzzles[this.current];
	puzzle.update(this.pallette);
};