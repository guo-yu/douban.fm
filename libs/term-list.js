var List = require('term-list');
var defaults = {
    marker: '\033[36m› \033[0m', // ♪
    markerLength: 2
}

var TermList = function(params) {
    this.menu = new List(params || defaults);
    this.items = [];
}

TermList.prototype.adds = function(items, max) {
    if (!items) return false;
    if (items.length === 0) return false;
    var self = this,
        menu = this.menu,
        limit = 16 || max;
    items.forEach(function(item, index){
        if (index > limit) return false;
        if (typeof(item) === 'object') item.index = index;
        self.items.push(item);
        menu.add(index, typeof(item) === 'string' ? item : item.name);
    });
    return this;
}

TermList.prototype.on = function(event, callback) {
    var menu = this.menu;
    menu.on(event, callback);
    return this;
}

TermList.prototype.start = function(by) {
    this.menu.start();
    if (by) this.menu.select(by);
    return this;
}

TermList.prototype.stop = function() {
    if (this.menu) this.menu.stop();
    return false;
}

TermList.prototype.update = function(index, text) {
    var menu = this.menu;
    var item = this.items[index];
    if (!item) return false;
    var original = (typeof(item) === 'string') ? item : item.name;
    var t = text ? ' ' + text : '';
    menu.at(index).label = original + t;
    menu.draw();
    return false;
}

TermList.prototype.clear = function(index) {
    return this.update(index);
}

exports = module.exports = TermList;
