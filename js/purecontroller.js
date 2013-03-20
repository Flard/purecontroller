var PureController = function(config) {
    this.config = config;

    this.bindings = {
        dimmer: {},
        rgb: {}
    }

    this.animations = {};
};

PureController.prototype.init = function() {
    this.bindDimmerButtons();
    this.bindDimmerOutputs();
    this.bindRgbPresetButtons();
    this.bindRgbOutputs();

    console.log('Ready.');
};

PureController.prototype.bindDimmerButtons = function() {

    var self = this;

    var buttons = document.querySelectorAll('[data-type=channel]');
    for(var i = 0; i<buttons.length;i++) {

        var button = buttons[i];

        // Mouse Down
        button.addEventListener('mousedown', function(e) {

            var targetId = e.target.getAttribute('data-id');
            self.setDimmerValueByName(targetId, 255);

        });

        // Mouse up
        button.addEventListener('mouseup', function(e) {

            var targetId = e.target.getAttribute('data-id');
            self.setDimmerValueByName(targetId, 0);
            e.target.classList.remove('btn-primary');

        });

        // Mouse dblclick
        button.addEventListener('dblclick', function(e) {

            var targetId = e.target.getAttribute('data-id');
            self.setDimmerValueByName(targetId, 255);
            e.target.classList.add('btn-primary');

        });
    }

};

PureController.prototype.bindRgbPresetButtons = function() {
    var self = this;

    var buttons = document.querySelectorAll('[data-type=ledpreset]');

    for(var i=0;i<buttons.length;i++) {

        var button = buttons[i];
        button.addEventListener('click', function(e) {

            var button = e.target;
            var value = button.getAttribute('data-value')
            var fadeTime = button.getAttribute('data-fade');

            if (fadeTime == 0) {
                self.setRgbPreset(value);
            } else {
                self.startRgbTransformation(value, fadeTime);
            }

        });

    }
}

PureController.prototype.bindDimmerOutputs = function() {

    var self = this;
    var outputs = document.querySelectorAll('[data-type=output]');

    for(var i=0; i<outputs.length; i++) {

        var outputEl = outputs[i];
        var channelName = outputEl.getAttribute('data-bind');

        if (typeof this.bindings.dimmer[channelName] === 'undefined') {
            this.bindings.dimmer[channelName] = [outputEl];
        } else {
            this.bindings.dimmer[channelName].push(outputEl);
        }

        outputEl.style.backgroundColor = 'black';
    }

}

PureController.prototype.bindRgbOutputs = function() {
    var self = this;
    var outputs = document.querySelectorAll('[data-type=output-rgb]');

    for(var i=0; i<outputs.length; i++) {

        var outputEl = outputs[i];
        var channelName = outputEl.getAttribute('data-bind');

        if (typeof this.bindings.rgb[channelName] === 'undefined') {
            this.bindings.rgb[channelName] = [outputEl];
        } else {
            this.bindings.rgb[channelName].push(outputEl);
        }

        outputEl.style.backgroundColor = 'black';
    }

}

PureController.prototype.setDimmerValueByName = function(channelName, newValue) {

    // Test for array
    if (channelName.indexOf(',') >= 0) {
        var channelNames = channelName.split(',');
        for(var i=0;i<channelNames.length;i++) {
            this.setDimmerValueByName(channelNames[i], newValue);
        }
        return;
    }

    if (typeof this.config.mapping[channelName] === 'undefined') {
        console.warn('Unknown dimmer name "'+channelName+'"');
        return;
    }

    var address = this.config.mapping[channelName].address;
    this.config.interface.set(address, newValue);

    if (typeof this.bindings.dimmer[channelName] !== 'undefined') {

        var elements = this.bindings.dimmer[channelName];
        for(var i=0;i<elements.length;i++) {
            elements[i].style.backgroundColor = 'rgb('+newValue+','+newValue+','+0+')';
        }

    }
};

PureController.prototype._parseRgbValue = function(values) {
    if (typeof(values) === 'string') {
        values = values.split(',');
    }

    if (values.length == 1) {
        while(values.length < 3) {
            values.push(values[0]);
        }
    }
    if (values.length == 2) {
        var v1 = values[0];
        var v2 = values[1];
        values = [v1, v1, v1, v2, v2, v2];
    }

    if (values.length == 3) {
        for(var i=0;i<3;i++) {
            values.push(values[i]);
        }
    }

    for(var i=0;i<6;i++) {
        if (typeof values[i] === 'string') {
            values[i] = this._parseHexRgb(values[i]);
        }
    }

    return values;
};

PureController.prototype.startRgbTransformation = function(newValue, fadeTime) {
    var self = this;

    var groupName = 'leds';
    if (self.animations[groupName]) window.clearTimeout(self.animations[groupName]);

    var from = this._getCurrentRgb(groupName);
    var to = this._parseRgbValue(newValue);
    var size = from.length;

    var interval = 100;
    var steps = fadeTime / interval;

    var step = 1;
    var fn = function() {

        var values = new Array(size);
        for(var i=0;i<size;i++) {

            var p = (1/steps) * step,
                r = Math.round((to[i][0] * p) + (from[i][0] * (1-p))),
                g = Math.round((to[i][1] * p) + (from[i][1] * (1-p))),
                b = Math.round((to[i][2] * p) + (from[i][2] * (1-p)));
            values[i] = [r,g,b];
        }
        self.setRgbPreset(values);

        if (step < steps) {
            step++;
            self.animations[groupName] = window.setTimeout(fn, interval);
        }

    };

    fn();
};

PureController.prototype.setRgbPreset = function(value) {
    var values = this._parseRgbValue(value);

    var groupName = 'leds';
    var groupNames = this.config.groups[groupName];

    if (this.animations[groupName]) window.clearTimeout(this.animations[groupName]);

    for(var i=0;i<groupNames.length;i++) {

        var color = values[i];

        var elName = groupNames[i];
        var elements = this.bindings.rgb[elName];
        var baseAddress = this.config.mapping[elName].address;

        for(var x=0;x<3;x++) {
            this.config.interface.set(baseAddress+x, color[x]);
        }

        for (var x=0;x<elements.length;x++) {
            elements[x].style.backgroundColor = this._toCssRgb(color);
        }
    }
};

PureController.prototype._getCurrentRgb = function(groupName) {
    var groupNames = this.config.groups[groupName];

    var result = [];
    for(var i=0;i<groupNames.length;i++) {

        var elName = groupNames[i];
        var baseAddress = this.config.mapping[elName].address;

        var r = this.config.interface.get(baseAddress+0),
            g = this.config.interface.get(baseAddress+1),
            b = this.config.interface.get(baseAddress+2);

        result.push([r,g,b]);
    }

    return result;
}

PureController.prototype._parseHexRgb = function(str) {

    if (str[0] == '#') {
        str = str.substr(1);
        //alert(str)
    }
    str = str.toUpperCase();

    var result = [];
    // Ignore any trailing single digit; I don't know what your needs
    // are for this case, so you may want to throw an error or convert
    // the lone digit depending on your needs.
    while (str.length >= 2) {
        result.push(parseInt(str.substring(0, 2), 16));
        str = str.substring(2, str.length);
    }
    return result;

}

PureController.prototype._toCssRgb = function(color) {
    return 'rgb('+color[0]+','+color[1]+','+color[2]+')';
}

var PureDummyInterface = function() {
    var size = 512;
    this.data = new Array(size);
    for(var i=0;i<size;i++) {
        this.data[i] = 0;
    }
};
PureDummyInterface.prototype.set = function(address, value) {
    this.data[address] = value;
}

PureDummyInterface.prototype.get = function(address) {
    return this.data[address];
}
