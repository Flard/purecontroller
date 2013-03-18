var PureController = function(config) {
    this.config = config;

    this.bindings = {
        dimmer: {}
    }
};

PureController.prototype.init = function() {
    console.log('Initializing');
    console.log(this.config);

    this.bindButtons();
    this.bindOutputs();
};

PureController.prototype.bindButtons = function() {

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

PureController.prototype.bindOutputs = function() {

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
}


var PureDummyInterface = function() {

};
PureDummyInterface.prototype.set = function(address, value) {
    console.log(address+':'+value);
}
