var PureController = function(config) {
    this.config = config;

    this.bindings = {
        dimmer: {},
        rgb: {}
    }

    this.timers = {};

    this.init();
};

PureController.prototype.init = function() {

    var self = this;

    this.addToggleButtonHandlers();
    this.addFlashButtonHandlers();
    this.addFogButtonHandlers();
    this.addLedButtonHandlers();
    this.addFaderHandlers();

    console.log('Ready.');


};

PureController.prototype.addToggleButtonHandlers = function() {
    var self = this;
    var buttons = document.querySelectorAll('[data-type=btn-toggle]');

    var fnDown = function(e) {
        var button = e.target;
        if (button.tagName == 'SPAN') button = button.parentNode;
        button.classList.add('mousedown');
    };

    var fnUp = function(e) {

        var button = e.target;
        if (button.tagName == 'SPAN') button = button.parentNode;

        var isToggled = button.classList.contains('active');
        var output = !isToggled;

        button.classList.remove('mousedown');
        var name = button.getAttribute('data-id');
        self.toggleOutputByName(name, output);

    }

    for(var i=0;i<buttons.length;i++) {

        //buttons[i].addEventListener('mousedown', fnDown);
        buttons[i].addEventListener('touchstart', fnDown);
        //buttons[i].addEventListener('mouseup', fnUp)
        buttons[i].addEventListener('touchend', fnUp)
    }
}

PureController.prototype.addFlashButtonHandlers = function() {
    var self = this;
    var buttons = document.querySelectorAll('[data-type=btn-flash]');

    var fnDown = function(e) {
        var button = e.target;
        if (button.tagName == 'SPAN') button = button.parentNode;

        button.classList.add('active');
        var name = button.getAttribute('data-id');
        self.toggleOutputByName(name, true);
    };

    var fnUp = function(e) {

        var button = e.target;
        if (button.tagName == 'SPAN') button = button.parentNode;

        button.classList.remove('active');
        var name = button.getAttribute('data-id');
        self.toggleOutputByName(name, false);

    }

    for(var i=0;i<buttons.length;i++) {

        //buttons[i].addEventListener('mousedown', fnDown);
        buttons[i].addEventListener('touchstart', fnDown);
        //buttons[i].addEventListener('mouseup', fnUp)
        buttons[i].addEventListener('touchend', fnUp)
    }
}

PureController.prototype.addFogButtonHandlers = function() {
    var self = this;
    var buttons = document.querySelectorAll('[data-type=sbtn-flash], [data-type=sbtn-toggle],[data-type=sbtn-timed]');

    var fnDown = function(e) {
        var button = e.target;
        if (button.tagName == 'SPAN') button = button.parentNode;

        var superButton = button.parentNode.parentNode;
        var action = button.getAttribute('data-type').substring(5);
        var name = superButton.getAttribute('data-id');
        if (action === 'flash') {
            self.toggleOutputByName(name, true);
            button.classList.add('active');
        } else {
            button.classList.add('mousedown');
        }
    };

    var fnRelease = function(superButton) {
        var name = superButton.getAttribute('data-id');
        // release toggle
        var btns = superButton.querySelectorAll('.sbtns .active');
        for(var i=0;i<btns.length;i++) {
            btns[i].classList.remove('active');
        }
        // release timer
        window.clearTimeout(self.timers[name]);
    }

    var fnUp = function(e) {

        var button = e.target;
        if (button.tagName == 'SPAN') button = button.parentNode;

        var superButton = button.parentNode.parentNode;

        var isToggled = button.classList.contains('active');
        var output = !isToggled;

        button.classList.remove('mousedown');
        var name = superButton.getAttribute('data-id');

        var action = button.getAttribute('data-type').substring(5);

        switch(action) {
            case 'flash':
                self.toggleOutputByName(name, false);
                button.classList.remove('active');

                fnRelease(superButton);
                break;
            case 'toggle':
                var isToggled = button.classList.contains('active');
                var output = !isToggled;

                fnRelease(superButton);

                self.toggleOutputByName(name, output);
                if (output) button.classList.add('active');
                else button.classList.remove('active');

                break;
            case 'timed':

                var timerActive = button.classList.contains('active');
                fnRelease(superButton);

                if (e.forceToggle) {
                  timerActive = false;
                }

                if (!timerActive) {
                    self.toggleOutputByName(name, true);
                    self.timers[name] = window.setTimeout(function() {
                        self.toggleOutputByName(name, false);
                        button.classList.remove('active');
                    }, 3000);
                    button.classList.add('active');
                } else {
                    self.toggleOutputByName(name, false);
                    window.clearTimeout(self.timers[name]);
                    button.classList.remove('active');
                }
        }

    }

    for(var i=0;i<buttons.length;i++) {

        //buttons[i].addEventListener('mousedown', fnDown);
        buttons[i].addEventListener('touchstart', fnDown);
        //buttons[i].addEventListener('mouseup', fnUp)
        buttons[i].addEventListener('touchend', fnUp)
    }

    var timedBothBtn = document.getElementById('btn-fog-both-timed');
    timedBothBtn.addEventListener('touchstart', function() {
        var fogButtons = document.querySelectorAll('[data-type=sbtn-timed]');
        for(var i=0;i<fogButtons.length;i++) {
          event = document.createEvent("HTMLEvents");
          event.initEvent("touchend", true, true);
          event.forceToggle = true;
          fogButtons[i].dispatchEvent(event);
        }
    });
}

PureController.prototype.toggleOutputByName = function(name, enabled) {

    var value = enabled ? 255 : 0;;
    switch (name.substring(0,3)) {
        case 'fan':
            value = enabled ? document.getElementById('fanMaster').value : 0;
            break;
        case 'fog':
            value = enabled ? document.getElementById('fogMaster').value : 0;
            break;
        case 'acl':
            this.setOutputByName(name+'1', value);
            this.setOutputByName(name+'2', value);
            this.setOutputByName(name+'3', value);
            this.setOutputByName(name+'4', value);
            this.setActiveState(name, value > 0);
            return;
        case 'wod':
            this.setOutputByName('w1', value);
            this.setOutputByName('w3', value);
            this.setOutputByName('w5', value);
            this.setOutputByName('w7', value);
            return;
        case 'wev':
            this.setOutputByName('w2', value);
            this.setOutputByName('w4', value);
            this.setOutputByName('w6', value);
            this.setOutputByName('w8', value);
            return;
        case 'wal':
            this.setOutputByName('w1', value);
            this.setOutputByName('w2', value);
            this.setOutputByName('w3', value);
            this.setOutputByName('w4', value);
            this.setOutputByName('w5', value);
            this.setOutputByName('w6', value);
            this.setOutputByName('w7', value);
            this.setOutputByName('w8', value);
            return;

    }

    this.setOutputByName(name, value);
}

PureController.prototype.setOutputByName = function(name, value) {

    this.setActiveState(name, value > 0);

    if (typeof this.config.mapping[name] === 'undefined') {
        console.warn('Unknown dimmer name "'+name+'"');
        return;
    }

    var address = this.config.mapping[name].address;
    this.config.interface.set(address, value);
}

PureController.prototype.addFaderHandlers = function() {

    var self = this;
    document.getElementById('fanMaster').addEventListener('change', function(e) {
        var fader = e.target;
        var value = fader.value;

        var fan1Button = document.querySelector('[data-id=fan1]');
        if (fan1Button.classList.contains('active')) {
            self.setOutputByName('fan1', value);
        }
        var fan2Button = document.querySelector('[data-id=fan2]');
        if (fan2Button.classList.contains('active')) {
            self.setOutputByName('fan2', value);
        }
    });

    document.getElementById('fogMaster').addEventListener('change', function(e) {
        var fader = e.target;
        var value = fader.value;

        var fan1Button = document.querySelector('[data-id=fog1]');
        if (fan1Button.classList.contains('active')) {
            self.setOutputByName('fog1', value);
        }
        var fan2Button = document.querySelector('[data-id=fog2]');
        if (fan2Button.classList.contains('active')) {
            self.setOutputByName('fog2', value);
        }
    });

}

PureController.prototype.setActiveState = function(name, isActive) {
    var buttons = document.querySelectorAll('[data-id='+name+']');

    for(var i=0;i<buttons.length;i++) {
        var button = buttons[i];
        if (isActive) button.classList.add('active');
        else button.classList.remove('active');
    }
}

PureController.prototype.addLedButtonHandlers = function() {

    var buttons = document.querySelectorAll('[data-type=ledpreset]');
    var fnDown = function(e) {
        var button = e.target;
        if (button.tagName == 'SPAN') button = button.parentNode;
        button.classList.add('mousedown');
    }

    var fnUp = function(e) {
        var button = e.target;
        if (button.tagName == 'SPAN') button = button.parentNode;

        button.classList.remove('mousedown');

        for(var i=0;i<buttons.length;i++) {
            buttons[i].classList.remove('active');
        }

        var value = button.getAttribute('data-value');
        self.setRgbPreset(value);

        button.classList.add('active');
    }

    var self = this;
    for(var i=0;i<buttons.length;i++) {

        //buttons[i].addEventListener('mousedown', fnDown);
        buttons[i].addEventListener('touchstart', fnDown);
        //buttons[i].addEventListener('mouseup', fnUp)
        buttons[i].addEventListener('touchend', fnUp)
    }
}

PureController.prototype.setRgbPreset = function(value) {
    var values = this._parseRgbValue(value);

    var groupName = 'leds';
    var groupNames = this.config.groups[groupName];

    for(var i=0;i<groupNames.length;i++) {

        var color = values[i];

        var elName = groupNames[i];
        //var elements = this.bindings.rgb[elName];
        var baseAddress = this.config.mapping[elName].address;

        for(var x=0;x<3;x++) {
            this.config.interface.set(baseAddress+x, color[x]);
        }

//        for (var x=0;x<elements.length;x++) {
//            elements[x].style.backgroundColor = this._toCssRgb(color);
//        }
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

var PureAjaxInterface = function() {
    this.dirty = {};

    var self = this;

    window.setInterval(function() {

        if (Object.keys(self.dirty).length > 0) {
            console.log(self.dirty);

            var http = new XMLHttpRequest();
            var params = '';
            for (var ch in self.dirty) {
                if (params.length > 0) params += '&';
                params += ch + '=' + self.dirty[ch];
            }
            http.open('POST', 'http://192.168.1.40/set', true);
            http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            //http.setRequestHeader("Content-length", params.length);
            //http.setRequestHeader("Connection", "close");
            http.send(params);

            self.dirty = {};
        }

    }, 100);
};
PureAjaxInterface.prototype.set = function(address, value) {
    this.dirty[address] = value;
}

PureAjaxInterface.prototype.get = function(address) {
    return false;
}
