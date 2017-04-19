
requestAnimFrame = (function (callback) {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
                function (callback) {
                    window.setTimeout(callback, maxFrameRate);
                };
    })();

var Game = function(allObjects, matchingPairs, itemsId1, itemsId2, canvasId){
    this.init(allObjects, matchingPairs, itemsId1, itemsId2, canvasId);
};
{
    function addPair(allObject, pair){
        var _this = this;
        var img1 = new Image();
        img1.src = allObject[pair[0]];
        $(img1).attr("data-name", pair[0]);

        $(img1).mousedown(function(event){
            var item = $("[data-name='" + pair[0] + "']");
            var offset = item.offset();

            _this.selectedItem.isSelected = true;
            _this.selectedItem.isItem1 = true;
            _this.selectedItem.name = pair[0];
            _this.selectedItem.mouse[0] = offset.left + (item.innerWidth() / 2.0);
            _this.selectedItem.mouse[1] = offset.top + (item.innerHeight() / 2.0);
        });
        $(img1).mouseup(function(){
            if(!_this.selectedItem.isItem1 && _this.selectedItem.isSelected){
                _this.checkPairs[pair[0]] = _this.selectedItem.name;
                _this.evaluate();
            }
            _this.selectedItem.isSelected = false;
            _this.selectedItem.name = null;
        });

        var img2 = new Image();
        img2.src = allObject[pair[1]];
        $(img2).attr("data-name", pair[1]);

        $(img2).mousedown(function(event){
            var item = $("[data-name='" + pair[1] + "']");
            var offset = item.offset();

            _this.selectedItem.isSelected = true;
            _this.selectedItem.isItem1 = false;
            _this.selectedItem.name = pair[1];
            _this.selectedItem.mouse[0] = offset.left + (item.innerWidth() / 2.0);
            _this.selectedItem.mouse[1] = offset.top + (item.innerHeight() / 2.0);
        });
        $(img2).mouseup(function(){
            if(_this.selectedItem.isItem1 && _this.selectedItem.isSelected){
                _this.checkPairs[_this.selectedItem.name] = pair[1];
                _this.evaluate();
            }
            _this.selectedItem.isSelected = false;
            _this.selectedItem.name = null;
        });

        return [img1, img2];
    };

    function shuffleArray(inArray){
        for(var i = 0; i < inArray.length; ++i){
            var newId = Math.floor(Math.random() * inArray.length);
            var temp = inArray[i];
            inArray[i] = inArray[newId];
            inArray[newId] = temp;
        }
    }

    function drawLoop(){
        var _this = this;

        var draw = function(){
            requestAnimFrame(draw);
            var height = _this.items1Div.innerHeight();
            var canvas = _this.canvas[0];
            
            if(height != canvas.height){
                canvas.height = height;
            }

            var context = canvas.getContext("2d");
            var pairs = _this.checkPairs;

            context.clearRect(0, 0, canvas.width, canvas.height);

            context.beginPath();
            for(var key in pairs){
                if(pairs[key]){
                    var item1 = $("[data-name='" + key + "']");
                    var item2 = $("[data-name='" + pairs[key] + "']");

                    if(item1.length > 0 && item2.length > 0){
                        context.moveTo(0, item1.offset().top + (item1.innerHeight() / 2.0));
                        context.lineTo(canvas.width, item2.offset().top + (item2.innerHeight() / 2.0));
                    }
                }
            }
            if(_this.selectedItem.isSelected){
                var offset = _this.canvas.offset();
                context.moveTo(_this.selectedItem.mouse[0] - offset.left, _this.selectedItem.mouse[1] - offset.top);
                context.lineTo(_this.mouseLocation[0] - offset.left, _this.mouseLocation[1] - offset.top);
            }
            context.stroke();
        };

        draw();
    }

    Game.prototype.init = function(allObjects, matchingPairs, itemsId1, itemsId2, canvasId) {
        var _this = this;

        this.items1 = [];
        this.items2 = [];

        this.checkPairs = {};
        this.matchingPairs = matchingPairs;
        this.selectedItem = {
            isSelected: false,
            isItem1: false,
            name: null,
            mouse: [0, 0]
        };
        this.mouseLocation = [0, 0];

        this.canvas = $(canvasId);
        this.items1Div = $(itemsId1);

        for(var i = 0; i < matchingPairs.length; ++i){
            this.checkPairs[matchingPairs[i][0]] = null;
            var pair = addPair.call(this, allObjects, matchingPairs[i]);
            this.items1.push(pair[0]);

            this.items2.push(pair[1]);
        }

        shuffleArray(this.items1);
        shuffleArray(this.items2);

        for(var i = 0; i < this.items1.length; ++i){
            $(this.items1[i]).attr("draggable", false);
            $(this.items2[i]).attr("draggable", false);

            $(itemsId1).append($(this.items1[i]));
            $(itemsId2).append($(this.items2[i]));
        }

        $(document).mousemove(function(event){
            _this.setMouseLocation(event.pageX, event.pageY);
        });

        drawLoop.call(this);
    };
    Game.prototype.setMouseLocation = function(x, y){
        this.mouseLocation[0] = x;
        this.mouseLocation[1] = y;
    };
    Game.prototype.evaluate = function(){
        for(var i  = 0; i < this.matchingPairs.length; ++i){
            var pair = this.matchingPairs[i];
            if(this.checkPairs[pair[0]] != pair[1]){
                return false;
            }
        }

        this.onwin();
        return true;
    };
}