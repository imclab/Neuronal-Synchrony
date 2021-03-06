(function() {

  var root = this;
  var previousSound = root.Sound || {};
  var callbacks = [], ctx;

  // Force polyfill for Web Audio
  root.addEventListener('load', function() {
    root.AudioContext = root.AudioContext || root.webkitAudioContext;
    Sound._ready = true;
    try {
      Sound.ctx = ctx = new root.AudioContext();
      Sound.has = true;
      _.each(callbacks, function(c) {
        c.call(Sound);
      });
    } catch (e) {
      delete Sound.ctx;
      Sound.has = false;
    }
    callbacks.length = 0;
  }, false);

  var Sound = root.Sound = function(url, callback) {

    Sound.get(url, _.bind(function(buffer) {

      this.buffer = buffer;
      this._ready = true;
      if (_.isFunction(callback)) {
        callback.call(this);
      }
      this.trigger('load');

    }, this));

  };

  _.extend(Sound, {

    _ready: false,

    ready: function(func) {
      if (Sound._ready) {
        func.call(Sound);
        return;
      }
      callbacks.push(func);
    },

    noConflict: function() {
      root.Sound = previousAudio;
      return this;
    },

    get: function(url, callback) {
      var request = new XMLHttpRequest();
      request.open('GET', url, true);
      request.responseType = 'arraybuffer';
      request.onload = function() {
        ctx.decodeAudioData(request.response, function(buffer) {
          if (_.isFunction(callback)) {
            callback(buffer);
          }
        }, function(e) {
          console.log('Error loading', url, e);
        });
      };
      request.send();
    }

  });

  _.extend(Sound.prototype, Backbone.Events, {

    stop: function(options) {

      if (!this.source) {
        return this;
      }

      var params = _.defaults(options || {}, {
        time: ctx.currentTime
      });

      this.source.stop(params.time);
      return this;

    },

    pause: function() {

    },

    play: function(options) {

      var params = _.defaults(options || {}, {
        time: ctx.currentTime,
        loop: false
      });

      this.source = ctx.createBufferSource();
      this.source.buffer = this.buffer;
      this.source.connect(ctx.destination);
      this.source.loop = params.loop;

      this.source.start(params.time);

      return this;

    }

  });

})();