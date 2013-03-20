var PureController = function(config) {
    this.config = config;

    this.bindings = {
        dimmer: {},
        rgb: {}
    }
};

PureController.prototype.init = function() {
    console.log('Initializing');
    console.log(this.config);

    this.bindDimmerButtons();
    this.bindDimmerOutputs();
    this.bindRgbPresetButtons();
    this.bindRgbOutputs();
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

            self.setRgbPreset(value);

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

PureController.prototype.setRgbPreset = function(value) {
    var values = value.split(',');
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

    var groupName = 'leds';
    var groupNames = this.config.groups[groupName];
    for(var i=0;i<groupNames.length;i++) {

        var color = values[i];

        var elName = groupNames[i];
        var elements = this.bindings.rgb[elName];
        var baseAddress = this.config.mapping[elName].address;

        var rgb = this.parseHexRgb(color);

        for(var x=0;x<3;x++) {
            this.config.interface.set(baseAddress+x, rgb[x]);
        }

        for (var x=0;x<elements.length;x++) {
            elements[x].style.backgroundColor = color;
        }
    }
};

PureController.prototype.parseHexRgb = function(str) {

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

var PureDummyInterface = function() {

};
PureDummyInterface.prototype.set = function(address, value) {
    console.log(address+':'+value);
}
