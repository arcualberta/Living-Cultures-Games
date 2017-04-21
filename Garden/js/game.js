function guid() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

function createDragFunction(img, parent, dragObject) {
    return function (ev) {
        var event = ev.originalEvent;

        if (event.touches && event.touches.length > 0) {
            event = event.touches[0];
        }

        event.dataTransfer.setData('Text', ev.target.id); // This is used to allow object dragging in firefox.

        dragObject.setData("Text", ev.target.id);
        dragObject.setData("x", event.pageX - $(ev.target).offset().left);
        dragObject.setData("y", event.pageY - $(ev.target).offset().top);
        dragObject.setData("parent", parent);
        
        return true;
    };
}

function DragObject() {
    var dragObject = {};

    this.setData = function (title, data) {
        dragObject[title] = data;
    };

    this.getData = function (title) {
        return dragObject[title];
    };
}

function Game(objects, requiredObjects, backgroundImageUrl, imagePanelId, roomDivId) {
    var _this = this;
    var tabIndex = 0;
    var dragData = new DragObject();
    var touchStart = 0;
    this.requiredObjects = requiredObjects;
    this.checkArray = [];

    // Private funcitons
    var attachResizeFunction = function (div) {
        div.focusin(function (event) {
            div.css("resize", "both");
        });

        div.focusout(function (event) {
            div.css("resize", "none");
        });
    };

    // Add touchend event
    $(document).on("touchstart", function (ev) {
        touchStart = Date.now();
    });
    $(document).on("touchend", function (ev) {
        if (touchStart > 0 && Date.now() - touchStart > 301) {
            touchStart = -1;
            var x = ev.originalEvent.changedTouches[0].pageX - window.pageXOffset;
            var y = ev.originalEvent.changedTouches[0].pageY - window.pageYOffset;
            var target = document.elementFromPoint(x, y);

            if (target) {
                $(target).trigger({
                    type: "drop",
                    originalEvent: ev.originalEvent.changedTouches[0]
                });
            }
        }else{
            touchStart = -1;
            var x = ev.originalEvent.changedTouches[0].pageX - window.pageXOffset;
            var y = ev.originalEvent.changedTouches[0].pageY - window.pageYOffset;
            var target = document.elementFromPoint(x, y);
            
            $(target).focus();
        }
    });

    // Setup the main div
    var roomDiv = $('#' + roomDivId);
    roomDiv.css('background-image', 'url(' + backgroundImageUrl + ')');
    roomDiv.bind('dragover touchstart', function (ev) {
        ev.preventDefault();
    });

    roomDiv.bind('drop', function (ev) {
        var event = ev.originalEvent;
        
        ev.preventDefault();
        var data = dragData.getData("Text");
        var parent = dragData.getData("parent");

        var div;
        if (parent === roomDivId) {
            div = $('#' + data);
        } else {
            div = $("<div></div>");
            div.attr('id', guid());
            div.attr('tabindex', ++tabIndex);
            div.bind('dragstart', new createDragFunction(div, roomDivId, dragData));
            div.bind('touchstart', new createDragFunction(div, roomDivId, dragData));
            div.css('position', 'absolute');
            div.attr("draggable", true);
            div.css("overflow", "hidden");
            div.css("min-width", "8px");
            div.css("min-height", "8px");
            div.css("background-repeat", "no-repeat");
            div.css("background-size", "100% 100%");
            div.css("-khtml-user-drag", "element");

            var img = $('#' + data);
            div.attr("data", img.attr("data"));
            div.css("background-image", "url(" + img.attr("src") + ")");
            div.css("width", img.innerWidth() + "px");
            div.css("height", img.innerHeight() + "px");

            roomDiv.append(div);

            attachResizeFunction(div);
        }

        var x = parseInt(dragData.getData("x"));
        var y = parseInt(dragData.getData("y"));
        
        var scrollX = $(window).scrollLeft();
        var scrollY = $(window).scrollTop();
        
        div.css('left', event.clientX - roomDiv.offset().left + scrollX - x);
        div.css('top', event.clientY - roomDiv.offset().top + scrollY - y);

        _this.check();
    });

    // Setup the images
    var imagePanel = $('#' + imagePanelId);
    imagePanel.bind('dragover touchstart', function (ev) {
        ev.preventDefault();
    });
    imagePanel.bind('drop', function (ev) {
        var event = ev.originalEvent;
        ev.preventDefault();
        var data = dragData.getData("Text");
        var parent = dragData.getData("parent");

        if (parent === roomDivId) {
            var img = $('#' + data);
            img.remove();
        }

        _this.check();
    });

    var panels = [];
    for (var key in objects) {
        var value = objects[key];

        var img = new Image();
        $(img).attr('data', key);
        $(img).attr('draggable', true);
        $(img).attr('id', guid());
        $(img).addClass('gameImage');
        $(img).bind('dragstart', new createDragFunction(img, imagePanelId, dragData));
        $(img).bind('touchstart', new createDragFunction(img, imagePanelId, dragData));

        img.src = value;

        panels.push(img);
    }

    for(var i = 0; i < panels.length; ++i){
        var index = Math.floor(Math.random() * panels.length);
        var temp = panels[index];
        panels[index] = panels[i];
        panels[i] = temp;
    }

    for(var i = 0; i < panels.length; ++i){
        imagePanel.append(panels[i]);
    }

    this.roomDiv = roomDiv;
}
;
Game.prototype.check = function () {
    var _this = this;
    var bad = false;
    var length = _this.requiredObjects.length;
    var matchedList = _this.checkArray;
    matchedList.length = 0;
    var totalWrong = 0;
    var totalRight = 0;

    this.roomDiv.children("[data]").each(function () {
        var data = $(this).attr('data');
        var newBad = true;
        

        for (var i = 0; i < length; ++i) {
            if (data === _this.requiredObjects[i]) {
                ++totalRight;

                if (matchedList.indexOf(data) < 0) {
                    matchedList.push(data);
                }

                newBad = false;
                break;
            }
        }

        if(newBad){
            ++totalWrong;
        }

        bad = bad || newBad;
    });

    if (bad) {
        this.onbadobject(totalRight, totalWrong);
    } else if (totalRight === length) {
        this.onwin(totalRight, totalWrong);
    }else{
        this.onnostate(totalRight, totalWrong);
    }
};
Game.prototype.onwin = function () {
};
Game.prototype.onbadobject = function () {

};
Game.prototype.onnostate = function () {

};