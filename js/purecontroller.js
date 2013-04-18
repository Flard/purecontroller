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
    this.bindRgbAnims();
    this.bindRgbOutputs();

    console.log('Ready.');
};

PureController.prototype.bindDimmerButtons = function() {

    var self = this;

    var buttons = document.querySelectorAll('[data-type=channel]');
    for(var i = 0; i<buttons.length;i++) {

        var button = buttons[i];

        var fnDown = function(e) {

            var targetId = e.target.getAttribute('data-id');
            self.setDimmerValueByName(targetId, 255);

        };
        var fnUp = function(e) {

            var targetId = e.target.getAttribute('data-id');
            self.setDimmerValueByName(targetId, 0);
            e.target.classList.remove('btn-active');

        };

        var fnLock = function(e) {

            var targetId = e.target.getAttribute('data-id');
            self.setDimmerValueByName(targetId, 255);
            e.target.classList.add('btn-active');

        };

        // Mouse Down
        button.addEventListener('mousedown', fnDown);
        button.addEventListener('touchstart', fnDown);

        // Mouse up
        button.addEventListener('mouseup', fnUp);
        button.addEventListener('touchend', fnDown);

        // Mouse dblclick
        button.addEventListener('dblclick', fnLock);
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

PureController.prototype.bindRgbAnims = function() {
    var self = this;

    var buttons = document.querySelectorAll('[data-type=anim]');

    for(var i=0;i<buttons.length;i++) {
        var button = buttons[i];

        var fnDown = function(e) {

            var button = e.target;
            var effect = button.getAttribute('data-effect')
            var params = button.getAttribute('data-params');
            var group = button.getAttribute('data-group');
            self.startRgbAnimation(group, effect, params);

        };

        var fnUp = function(e) {

            var button = e.target;
            var effect = button.getAttribute('data-effect')
            var group = button.getAttribute('data-group');
            self.stopRgbAnimation(group, effect);
            e.target.classList.remove('btn-active');

        };

        button.addEventListener('mousedown', fnDown);
        button.addEventListener('touchstart', fnDown);
        button.addEventListener('mouseup', fnUp);
        button.addEventListener('touchend', fnUp);
        button.addEventListener('dblclick', function(e) {

            var button = e.target;
            var effect = button.getAttribute('data-effect')
            var params = button.getAttribute('data-params');
            var group = button.getAttribute('data-group');
            self.startRgbAnimation(group, effect, params);
            e.target.classList.add('btn-active');

        });

    }
};

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

PureController.prototype.startRgbAnimation = function(groupName, effectName, params) {
    var baseRgb = this._getCurrentRgb(groupName);

    this.stopRgbAnimation(groupName, effectName);

    var effect = new PureController.fx[effectName](this, groupName, baseRgb, params);
    this.animations[groupName+'.'+effectName] = effect;
    effect.start();
};

PureController.prototype.stopRgbAnimation = function(groupName, effectName) {

    if (this.animations[groupName+'.'+effectName]) {
        this.animations[groupName+'.'+effectName].stop();
    }

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
    if (this.data[address] !== value) {
        this.data[address] = value;
    }
    //if (address == 210) console.log(address+'>'+this.data[address]);
}

PureDummyInterface.prototype.get = function(address) {
    //if (address == 210) console.log(address+'<'+this.data[address]);
    return this.data[address];
}

var PureWebSocketInterface = function() {
    var size = 512;
    this.data = new Array(size);
    for(var i=0;i<size;i++) {
        this.data[i] = 0;
    }
    var ws = this.socket = new WebSocket("ws://192.168.0.77:80/");
    ws.onopen = function() {
        console.log("Connected to WebSocket");
        //ws.send("Hello, Arduino");
        document.getElementById('interface-status').className = 'connected';
    }
    ws.onmessage = function(evt) {
        window.console.log(evt.data);

    };
    ws.onerror = function(evt) {
        window.console.log(evt.data);
       // $("#msg").append("<p> ERROR: "+evt.data+"<p>");
    };
    ws.onclose = function() {
        window.console.log("Websocket Disconnected");
        //debug("socket closed");
        document.getElementById('interface-status').className = 'disconnected';
    };

//    window.setInterval(function() {
//
//    }, 500);
};
PureWebSocketInterface.prototype.set = function(address, value) {
    if (this.data[address] !== value) {
        this.data[address] = value;
    }
    this.socket.send(this._toHex(address)+' '+this._toHex(value));
}

PureWebSocketInterface.prototype._toHex = function(val) {
    return ((val<16)?'0':'')+val.toString(16);
}

PureWebSocketInterface.prototype.get = function(address) {
    //if (address == 210) console.log(address+'<'+this.data[address]);
    return this.data[address];
}

PureController.fx = {};
PureController.fx.strobe = function(controller, groupName, baseRgb, params) {
    var timer = false, step = false;

    params = params.split(',');
    var interval = parseInt(params[0]),
        black = controller._parseRgbValue(params[1]);

    return {
        start: function() {
            timer = window.setInterval(function() {

                if (step) {
                    controller.setRgbPreset(black);
                } else {
                    controller.setRgbPreset(baseRgb);
                }
                step = !step;

            }, interval);
        },
        stop: function() {

            if (timer) {
                window.clearInterval(timer);
            }
            controller.setRgbPreset(baseRgb);
        }
    };
}
PureController.fx.marquee = function(controller, groupName, baseRgb, params) {
    params = params.split('|');

    var interval = parseInt(params[0]),
        values = params[2].split(','),
        dir = (values.length + parseInt(params[1])) % values.length,
        steps = values.length,
        timer = false,
        step = 0;

    return {
        start: function() {
            timer = window.setInterval(function() {

                var v = [];
                for(i=0;i<values.length;i++) {
                    v.push(values[(step+i) % steps]);
                }
                controller.setRgbPreset(v);
                step = (step+dir) % steps;

            }, interval);
        },
        stop: function() {
            if (timer) {
                window.clearInterval(timer);
            }
            controller.setRgbPreset(baseRgb);
        }
    }
}