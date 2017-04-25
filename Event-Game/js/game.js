function guid() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

function SVGElement(tag, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) {
        if (k === 'xlink:href') {
            el.setAttributeNS('http://www.w3.org/1999/xlink', 'href', attrs[k]);
        } else {
            el.setAttribute(k, attrs[k]);
        }
    }
    return el;
}

var Line = function(id, x1, y1, x2, y2, game){
    this.init(id, x1, y1, x2, y2, game);
};
{
    Line.prototype.init = function(id, x1, y1, x2, y2, game){
        this.line = SVGElement('line', {
            id: id,
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
            style: "stroke:rgb(255,0,0);stroke-width:2"
        });

        this.event = null;
        this.item = null;
        this.game = game;

        game.svg.append(this.line);
    };
    Line.prototype.moveEnd = function(x, y){
        $(this.line).attr('x2', x);
        $(this.line).attr('y2', y);
    };
    Line.prototype.clear = function(){
        this.game.svg.children('#' + this.line.id).remove();

        for(var i = 0; i < this.game.lines.length; ++i){
            if(this.game.lines[i] === this){
                this.game.lines.splice(i, 1);
                break;
            }
        }

        if(this.event != null){
            this.event.line = null;
            this.event = null;
        }

        if(this.item != null){
            this.item.line = null;
            this.line = null;
        }

        if(this.game.activeLine === this){
            this.game.activeLine = null;
        }
    };
}

var Event = function(name, width, height, game){
    this.init(name, width, height, game);
};
{
    function clickStart(){
        var line = this.game.setSelectedElement(this);
        line.event = this;
        //this.line = line;
    };

    function clickEnd(){
        var line = this.game.activeLine;

        if(line){
            if(line.event != null){
                this.game.activeLine.clear();
            }else{
                line.event = this;
                line.moveEnd(this.dim[0] + (this.dim[2] / 2), this.dim[1] + (this.dim[3] / 2));
                this.game.activeLine = null;
            }

            this.game.evaluate();
        }
    }

    Event.prototype.init = function(name, width, height, game){
        this.name = name;
        this.dim = [0, 0, width, height, 0, 0];
        this.game = game;
        this.line = null;

        this.element = SVGElement('g', {
            transform: "translate(" + this.dim[0] + "," + this.dim[1] + ")"
        });

        var rect = SVGElement('rect', {
                x: 0,
                y: 0,
                rx: 10,
                ry: 10,
                width: this.dim[2],
                height: this.dim[3],
                stroke: '#CCC',
                'stroke-width': 1
            });

        this.element.appendChild(rect);

        var foreignObject = SVGElement('foreignObject', {
            x: 4,
            y: 8,
            width: this.dim[2] - 8,
            height: this.dim[3] - 16
        });

        this.element.appendChild(foreignObject);

        var p = $("<p class='card-text'></p>");
        p.text(this.name);
        p.off("click");

        foreignObject.appendChild(p[0]);

        // Add events
        var _this = this;
        $(this.element).bind("touchstart mousedown", function(){
            clickStart.call(_this);
        });

        $(this.element).bind("mouseup", function(){
            clickEnd.call(_this);
        });

        $(this.element).bind("touchend", function(ev){
            _this.game.handleTouchEnd(ev);
        });
    };
    Event.prototype.move = function (x, y) {
        this.dim[0] = x;
        this.dim[1] = y;

        this.element.setAttribute('transform', "translate(" + x + "," + y + ")");

        var $element = $(this.element);
        $($element).parent().append($element);
    };
}

var Item = function(name, imageUrl, imageId, width, height, game){
    this.init(name, imageUrl, imageId, width, height, game);
};
{
    function clickStart(){
        var line = this.game.setSelectedElement(this);
        line.item = this;
        this.line = line;
    };

    function clickEnd(){
        var line = this.game.activeLine;

        if(line){
            if(line.item != null){
                this.game.activeLine.clear();
            }else{
                line.item = this;
                line.moveEnd(this.dim[0] + (this.dim[2] / 2), this.dim[1] + (this.connectTop ? 0 : this.dim[3]));
                this.game.activeLine = null;
            }

            this.game.evaluate();
        }
    }

    Item.prototype.init = function(name, imageUrl, imageId, width, height, game){
        this.src = imageUrl;
        this.name = name;
        this.dim = [0, 0, width, height, 0, 0];
        this.game = game;
        this.line = null;
        this.connectTop = true;

        this.element = SVGElement('g', {
            transform: "translate(" + this.dim[0] + "," + this.dim[1] + ")"
        });

        this.pattern = SVGElement('pattern', {
            id: imageId,
            x: 0,
            y: 0,
            width: 1,
            height: 1,
        });

        this.pattern.appendChild(SVGElement('image', {
            'xlink:href' : imageUrl,
            'width': width,
            'heigh': height,
            'preserveAspectRatio': 'xMidYMid slice'
        }));

        var rect = SVGElement('rect', {
            x: 0,
            y: 0,
            rx: 10,
            ry: 10,
            width: this.dim[2],
            height: this.dim[3],
            stroke: '#CCC',
            'stroke-width': 1,
            fill: 'url(#' + imageId + ')'
        });

        this.element.appendChild(rect);

        var foreignObject = SVGElement('foreignObject', {
            x: 0,
            y: this.dim[3] / 2.0,
            width: this.dim[2],
            height: this.dim[3] / 2.0
        });

        this.element.appendChild(foreignObject);

        var p = $("<p class='card-text'></p>");
        p.text(this.name);
        p.off("click");

        this.textElement = $(p);

        foreignObject.appendChild(p[0]);

        // Add events
        var _this = this;
        $(this.element).bind("touchstart mousedown", function(){
            clickStart.call(_this);
        });

        $(this.element).bind("mouseup", function(){
            clickEnd.call(_this);
        });

        $(this.element).bind("touchend", function(ev){
            _this.game.handleTouchEnd(ev);
        });
    };
    Item.prototype.move = function (x, y) {
        this.dim[0] = x;
        this.dim[1] = y;

        this.element.setAttribute('transform', "translate(" + x + "," + y + ")");

        var $element = $(this.element);
        $($element).parent().append($element);
    };
}

var Game = function(allObjects, matchingPairs, width, height, svgAreaPath){
    this.init(allObjects, matchingPairs, width, height, svgAreaPath);
};
{
    var svgPoint = null;

    function getConvertedPoint(x, y){
        svgPoint.x = x;
        svgPoint.y = y;

        return svgPoint.matrixTransform(this.svg[0].getScreenCTM().inverse());
    }

    function shuffleArray(inArray){
        for(var i = 0; i < inArray.length; ++i){
            var newId = Math.floor(Math.random() * inArray.length);
            var temp = inArray[i];
            inArray[i] = inArray[newId];
            inArray[newId] = temp;
        }
    }

    Game.prototype.init = function(allObjects, matchingPairs, width, height, svgAreaPath) {
        this.items = {};
        this.events = [];
        this.svg = $(svgAreaPath);
        this.selectedElement = {
            isSelected: false,
            element: null
        };
        this.activeLine = null;
        this.lines = [];
        this.matchingPairs = matchingPairs;
        this.matchingCount = 0;

        var defs = SVGElement('defs', {});
        this.svg.append(defs);

        svgPoint = this.svg[0].createSVGPoint();

        var id = 0;
        for(var key in allObjects){
            var item = new Item(key, allObjects[key], "imgId_" + id, 250, 180, this);
            this.items[key] = item;

            defs.appendChild(item.pattern);

            ++id;
        }

        this.matchingCount = id;

        var topItems = [];
        var bottomItems = [];
        var top = 10;
        var bottom = height - 190;
        var xStart = (width / 2) - (2 * 220);
        for(var key in matchingPairs){
            var pair = matchingPairs[key];

            topItems.push(this.items[pair[0]]);
            bottomItems.push(this.items[pair[1]]);

            var event = new Event(key, 200, 60, this);
            event.move(xStart, (height / 2.0) - 30);
            this.svg.append(event.element);

            this.events.push(event);

            xStart += 220;
        }

        shuffleArray(topItems);
        shuffleArray(bottomItems);

        xStart = (width / 2) - ((topItems.length >> 1) * 270);
        for(var i = 0; i < topItems.length; ++i){
            var x = xStart + (i * 270);

            topItems[i].move(x, top);
            topItems[i].connectTop = false;
            this.svg.append(topItems[i].element);

            bottomItems[i].move(x, bottom);
            bottomItems[i].connectTop = true;
            this.svg.append(bottomItems[i].element);
        }


        var foreignObject = SVGElement('foreignObject', {
            x: (width / 2) - 100,
            y: (height / 2) + 50,
            width: 200,
            height: 60
        });

        this.svg.append(foreignObject);

        var p = $("<p class='info-message'></p>");
        p.text(this.name);
        p.off("click");
        p.css("display", "none");

        this.textElement = p;

        foreignObject.appendChild(p[0]);

        // Events
        var _this = this;
        this.svg.mousemove(function(ev){
            
            if(_this.activeLine != null){
                var result = getConvertedPoint.call(_this, ev.clientX, ev.clientY);

                _this.activeLine.moveEnd(result.x, result.y);
            }
        });

        this.svg.bind('touchmove', function (ev) {
            var event = ev.originalEvent.touches[0];
            if(_this.activeLine != null){
                var result = getConvertedPoint.call(_this, event.clientX, event.clientY);

                _this.activeLine.moveEnd(result.x, result.y);
            }
        });
    };
    Game.prototype.handleTouchEnd = function(ev){
        var event = ev.originalEvent.changedTouches[0];

        var element = document.elementFromPoint(event.clientX, event.clientY);

        if(element){
            $(element).trigger("mouseup");
        }
    };
    Game.prototype.evaluate = function(){
        var result = true;
        var trueCount = 0;

        for(i = 0; i < this.lines.length; ++i){
            var line = this.lines[i];

            if(line.event){
                var pair = this.matchingPairs[line.event.name];

                if(pair[0] == line.item.name){
                    trueCount++;
                }else if(pair[1] == line.item.name){
                    trueCount++;
                }else{
                    result = false;
                }
            }
        }

        if(result){
            if(result = trueCount == this.matchingCount){
                this.onwin();
            }else{
                this.onok();
            }
        }else{
            this.onfail();
        }

        return result;
    };
    Game.prototype.setSelectedElement = function(element){
        this.selectedElement.isSelected = true;
        this.selectedElement.element = element;

        if(element.line){
            element.line.clear();
        }

        if(this.activeLine){
            this.activeLine.clear();
        }

        var x = element.dim[0] + (element.dim[2] / 2);
        var y = element.dim[1] + (element.dim[3] / 2);

        if(element.connectTop === true){
            y = element.dim[1];
        }else if(element.connectTop === false){
            y = element.dim[1] + element.dim[3];
        }

        this.activeLine = new Line(guid(), x, y, x, y, this);

        this.svg.prepend(this.activeLine.line);

        this.lines.push(this.activeLine);

        return this.activeLine;
    };
    Game.prototype.onwin = function(){
        console.log("WIN");
    }
    Game.prototype.onfail = function(){
        console.log("FAIL");
    }
    Game.prototype.onok = function(){
        console.log("OK");
    }
    Game.prototype.setSubtitles = function(subtitles){
        for(var key in subtitles){
            var item = this.items[key];

            if(item){
                item.textElement.text(item.name + " - " + subtitles[key]);
            }
        }
    }
    Game.prototype.setMessage = function(text){
        var textElement = this.textElement;

        if(text){
            textElement.text(text);
            textElement.show();
        }else{
            textElement.hide();
        }
    }
}