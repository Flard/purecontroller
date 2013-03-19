var PureController = function(config) {
    this.config = config;

    this.bindings = {
        dimmer: {}
    }
};

PureController.prototype.init = function() {
    console.log('Initializing');
    console.log(this.config);

    this.bindDimmerButtons();
    this.bindDimmerOutputs();
    this.bindRgbPresetButtons();
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
    console.log(values);
    if (values.length = 1) {
        values = [value, value, value];
    }
    while(values.length < 3) {
        values.push(values[0]);
    }
    if (values.length <= 3) {
        // all six same
        for(i=0;i<5;i++) {
            values.push(values[0]);
            values.push(values[1]);
            values.push(values[2]);
        }
    }
    while(values.length < 6) {
        values.push(values[0]);
    }
    if (values.length <= 6) {
        // 0 1 2
        values.splice(3, 6, values[0], values[1], values[2], values[0], values[1], values[2]);
        // 3 4 5
        // 6 7 8

        // 9 10 11
        values.push(values[9]); values.push(values[10]); values.push(values[11]);
        values.push(values[9]); values.push(values[10]); values.push(values[11]);
    }

    var groupName = 'leds';
    var groupNames = this.config.groups[groupName];

    console.log(values);

};

var PureDummyInterface = function() {

};
PureDummyInterface.prototype.set = function(address, value) {
    console.log(address+':'+value);
}
