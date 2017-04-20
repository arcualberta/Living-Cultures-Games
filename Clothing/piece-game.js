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

var Item = function(imgUrl, scale = 1){
	this.game = null;
	this.offsetX = -1;
	this.offsetY = -1;
	this.div = document.createElement("div");
	this.img = new Image();
	this.scale = scale;
	this.imgUrl = imgUrl;
	this.loaded = false;

	var div = $(this.div);
	var _this = this;

	this.img.onload = function(){
		_this.loaded = true;
		_this.updateSize();

		div.css("background-image", 'url(' + imgUrl + ')');
	};	
};
Item.prototype.loadImage = function(){
	this.img.src = this.imgUrl;
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
	if(this.game.seletedItem == this && this.offsetX >= 0 && this.offsetY >= 0){
		var newX = x - this.offsetX;
		var newY = y - this.offsetY;

		if(newX >= 0 && newY >= 0){
			$(this.div).css("left", newX + "px");
			$(this.div).css("top", newY + "px");
		}
	}
};
Item.prototype.clickEnd = function(){
	this.game.seletedItem = null;
	this.offsetX = -1;
	this.offsetY = -1;
};
Item.prototype.updateSize = function(){
	var img = this.img;
	var scale = this.scale;
	var div = $(this.div);

	div.css("width", (img.width * scale) + "px");
	div.css("height", (img.height * scale) + "px");
}
Item.prototype.update = function(img, scale){
	var div = $(this.div);
	this.scale = scale;

	this.updateSize();

	//this.div.appendChild(this.canvas);
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
	div.css("position", "absolute");
	div.css("overflow", "hidden");
    div.css("min-width", "8px");
    div.css("min-height", "8px");
	div.attr("draggable", true);
	var _this = this;


	div.bind('dragstart', function(ev){
		var event = ev.originalEvent;

        if (event.touches && event.touches.length > 0) {
            event = event.touches[0];
        }

        event.dataTransfer.setDragImage(_this.img, -99999, -99999);

        _this.clickStart(event.pageX - $(ev.target).offset().left, event.pageY - $(ev.target).offset().top);
        dragObject.setData("item", _this);

        return true;
	});

	div.bind('dragend mouseup touchend', function(ev){
		_this.clickEnd();
		ev.preventDefault();
	});

	div.bind('drag', function(event){
		_this.clickDrag(event.pageX, event.pageY);
	});
	/*div.mousedown(function(event){
		var rect = _this.div.getBoundingClientRect();
		_this.clickStart(event.clientX - rect.left, event.clientY - rect.top);
	});
	div.mouseup(function(event){
		_this.clickEnd();
	});*/
	$(document).mousemove(function(event){
		_this.clickDrag(event.pageX, event.pageY);
	});
};


var Puzzle = function(imgUrl, componentImages){
	this.loaded = false;
	this.image = new Image();
	this.items = [];
	this.drawHeight = $(document).innerHeight();
	this.drawScale = 1.0;
	this.imgUrl = imgUrl;

	var _this = this;
	this.image.onload = function(){
		_this.loaded = true;
		_this.update();

		for(var i = 0; i < _this.items.length; ++i){
			_this.items[i].loadImage();
		}
	};
	

	for(var i = 0; i < componentImages.length; ++i){
		var dim = componentImages[i];
		this.items.push(new Item(dim, 0.25));
	}

	this.image.src = this.imgUrl;
};
Puzzle.prototype.update = function(){
	if(this.image.height > 0){
		this.drawScale = this.drawHeight / this.image.height;
	}

	for(var i = 0; i < this.items.length; ++i){
		this.items[i].update(this.image, this.drawScale);
	}
};
Puzzle.prototype.setGame = function(game){
	for(var i = 0; i < this.items.length; ++i){
		this.items[i].game = game;
	}
};

var Game = function(selectSection, gameSection, puzzles){
	this.puzzles = puzzles;
	this.current = 0;
	this.gameSection = gameSection;
	this.selectedItem = null;

	/*$(gameSection).bind('dragover touchstart', function (ev) {
        //ev.preventDefault();
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
	});*/

	var _this = this;
	var outDiv = null;
	for(var i = 0; i < puzzles.length; ++i){
		var div = $("<div></div>");
		div.click((function(inVal){
			return function(){ _this.setPuzzle(inVal); };
		})(i));

		div.css("background-image", 'url(' + puzzles[i].image.src + ')');

		$(selectSection).append(div);

		this.puzzles[i].setGame(this);

		if(i == 0){
			outDiv = div;
		}
	}

	setTimeout(function(){
		outDiv.click();
	}, 1000);
};
Game.prototype.setPuzzle = function(index){
	if(index >= 0 && index < this.puzzles.length){
		this.current = index;
		this.update();

		var puzzle = this.puzzles[index];
		$(this.gameSection).empty();

		var width = $(document).innerWidth();
		var height = $(document).innerHeight();

		puzzle.drawHeight = height - 150;

		$(puzzle.image).css("position", 'absolute');
		$(puzzle.image).css("top", '93px');
		$(puzzle.image).css("left", (width / 2.0) + 'px');
		$(puzzle.image).css("height", puzzle.drawHeight + 'px');


		puzzle.update();

		this.gameSection.appendChild(puzzle.image);

		for(var i = 0; i < puzzle.items.length; ++i){
			puzzle.items[i].scale = puzzle.drawScale;
			puzzle.items[i].updateSize();

			var item = $(puzzle.items[i].div);
			item.css("top", (Math.random() * (height - 192) + 92) + 'px');
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

	/*var colour = $("#colourSelect")[0].value;
	var int = parseInt(colour);
	var r = 0x000000FF & int;
	var g = 0x000000FF & (int >> 8);
	var b = 0x000000FF & (int >> 16);

	this.pallette[0xFFFFFFFF] = int;
	this.pallette[0xFFAAAAAA] = convertValue(r - 100, g - 110, b - 120);*/

	var puzzle = this.puzzles[this.current];
	puzzle.update();
};