'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _flux = require('flux');

var _StateFunctions = require('./utils/StateFunctions');

var StateFunctions = _interopRequireWildcard(_StateFunctions);

var _functions = require('./functions');

var fn = _interopRequireWildcard(_functions);

var _store = require('./store');

var store = _interopRequireWildcard(_store);

var _AltUtils = require('./utils/AltUtils');

var utils = _interopRequireWildcard(_AltUtils);

var _actions = require('./actions');

var _actions2 = _interopRequireDefault(_actions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } /* global window */


var Alt = function () {
  function Alt() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Alt);

    this.config = config;
    this.serialize = config.serialize || JSON.stringify;
    this.deserialize = config.deserialize || JSON.parse;
    this.dispatcher = config.dispatcher || new _flux.Dispatcher();
    this.batchingFunction = config.batchingFunction || function (callback) {
      return callback();
    };
    this.actions = { global: {} };
    this.stores = {};
    this.storeTransforms = config.storeTransforms || [];
    this.trapAsync = false;
    this._actionsRegistry = {};
    this._initSnapshot = {};
    this._lastSnapshot = {};
  }

  Alt.prototype.dispatch = function dispatch(action, data, details) {
    var _this = this;

    this.batchingFunction(function () {
      var id = Math.random().toString(18).substr(2, 16);

      // support straight dispatching of FSA-style actions
      if (action.hasOwnProperty('type') && action.hasOwnProperty('payload')) {
        var fsaDetails = {
          id: action.type,
          namespace: action.type,
          name: action.type
        };
        return _this.dispatcher.dispatch(utils.fsa(id, action.type, action.payload, fsaDetails));
      }

      if (action.id && action.dispatch) {
        return utils.dispatch(id, action, data, _this);
      }

      return _this.dispatcher.dispatch(utils.fsa(id, action, data, details));
    });
  };

  Alt.prototype.createUnsavedStore = function createUnsavedStore(StoreModel) {
    var key = StoreModel.displayName || '';
    store.createStoreConfig(this.config, StoreModel);
    var Store = store.transformStore(this.storeTransforms, StoreModel);

    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    return fn.isFunction(Store) ? store.createStoreFromClass.apply(store, [this, Store, key].concat(args)) : store.createStoreFromObject(this, Store, key);
  };

  Alt.prototype.createStore = function createStore(StoreModel, iden) {
    var key = iden || StoreModel.displayName || StoreModel.name || '';
    store.createStoreConfig(this.config, StoreModel);
    var Store = store.transformStore(this.storeTransforms, StoreModel);

    /* istanbul ignore next */
    if (module.hot) delete this.stores[key];

    if (this.stores[key] || !key) {
      if (this.stores[key]) {
        utils.warn('A store named ' + key + ' already exists, double check your store ' + 'names or pass in your own custom identifier for each store');
      } else {
        utils.warn('Store name was not specified');
      }

      key = utils.uid(this.stores, key);
    }

    for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
      args[_key2 - 2] = arguments[_key2];
    }

    var storeInstance = fn.isFunction(Store) ? store.createStoreFromClass.apply(store, [this, Store, key].concat(args)) : store.createStoreFromObject(this, Store, key);

    this.stores[key] = storeInstance;
    StateFunctions.saveInitialSnapshot(this, key);

    return storeInstance;
  };

  Alt.prototype.generateActions = function generateActions() {
    var actions = { name: 'global' };

    for (var _len3 = arguments.length, actionNames = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      actionNames[_key3] = arguments[_key3];
    }

    return this.createActions(actionNames.reduce(function (obj, action) {
      obj[action] = utils.dispatchIdentity; //eslint-disable-line
      return obj;
    }, actions));
  };

  Alt.prototype.createAction = function createAction(name, implementation, obj) {
    return (0, _actions2.default)(this, 'global', name, implementation, obj);
  };

  Alt.prototype.createActions = function createActions(ActionsClass) {
    var //eslint-disable-line
    _this3 = this;

    var exportObj = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var actions = {};
    var key = utils.uid(this._actionsRegistry, ActionsClass.displayName || ActionsClass.name || 'Unknown');

    if (fn.isFunction(ActionsClass)) {
      fn.assign(actions, utils.getPrototypeChain(ActionsClass));

      var ActionsGenerator = function (_ActionsClass) {
        _inherits(ActionsGenerator, _ActionsClass);

        function ActionsGenerator() {
          _classCallCheck(this, ActionsGenerator);

          return _possibleConstructorReturn(this, _ActionsClass.apply(this, arguments));
        }

        ActionsGenerator.prototype.generateActions = function generateActions() {
          for (var _len5 = arguments.length, actionNames = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
            actionNames[_key5] = arguments[_key5];
          }

          actionNames.forEach(function (actionName) {
            actions[actionName] = utils.dispatchIdentity;
          });
        };

        return ActionsGenerator;
      }(ActionsClass);

      for (var _len4 = arguments.length, argsForConstructor = Array(_len4 > 2 ? _len4 - 2 : 0), _key4 = 2; _key4 < _len4; _key4++) {
        argsForConstructor[_key4 - 2] = arguments[_key4];
      }

      fn.assign(actions, new (Function.prototype.bind.apply(ActionsGenerator, [null].concat(argsForConstructor)))());
    } else {
      fn.assign(actions, ActionsClass);
    }

    this.actions[key] = this.actions[key] || {};

    fn.eachObject(function (actionName, action) {
      if (!fn.isFunction(action)) {
        exportObj[actionName] = action; //eslint-disable-line
        return;
      }

      // create the action
      exportObj[actionName] = (0, _actions2.default)(_this3, key, actionName, action, exportObj);

      // generate a constant
      var constant = utils.formatAsConstant(actionName);
      exportObj[constant] = exportObj[actionName].id; //eslint-disable-line
    }, [actions]);

    return exportObj;
  };

  Alt.prototype.takeSnapshot = function takeSnapshot() {
    for (var _len6 = arguments.length, storeNames = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
      storeNames[_key6] = arguments[_key6];
    }

    var state = StateFunctions.snapshot(this, storeNames);
    fn.assign(this._lastSnapshot, state);
    return this.serialize(state);
  };

  Alt.prototype.rollback = function rollback() {
    StateFunctions.setAppState(this, this.serialize(this._lastSnapshot), function (storeInst) {
      storeInst.lifecycle('rollback');
      storeInst.emitChange();
    });
  };

  Alt.prototype.recycle = function recycle() {
    for (var _len7 = arguments.length, storeNames = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
      storeNames[_key7] = arguments[_key7];
    }

    var initialSnapshot = storeNames.length ? StateFunctions.filterSnapshots(this, this._initSnapshot, storeNames) : this._initSnapshot;

    StateFunctions.setAppState(this, this.serialize(initialSnapshot), function (storeInst) {
      storeInst.lifecycle('init');
      storeInst.emitChange();
    });
  };

  Alt.prototype.flush = function flush() {
    var state = this.serialize(StateFunctions.snapshot(this));
    this.recycle();
    return state;
  };

  Alt.prototype.bootstrap = function bootstrap(data) {
    StateFunctions.setAppState(this, data, function (storeInst, state) {
      storeInst.lifecycle('bootstrap', state);
      storeInst.emitChange();
    });
  };

  Alt.prototype.prepare = function prepare(storeInst, payload) {
    var data = {};
    if (!storeInst.displayName) {
      throw new ReferenceError('Store provided does not have a name');
    }
    data[storeInst.displayName] = payload;
    return this.serialize(data);
  };

  // Instance type methods for injecting alt into your application as context

  Alt.prototype.addActions = function addActions(name, ActionsClass) {
    for (var _len8 = arguments.length, args = Array(_len8 > 2 ? _len8 - 2 : 0), _key8 = 2; _key8 < _len8; _key8++) {
      args[_key8 - 2] = arguments[_key8];
    }

    this.actions[name] = Array.isArray(ActionsClass) ? this.generateActions.apply(this, ActionsClass) //eslint-disable-line
    : this.createActions.apply(this, [ActionsClass].concat(args));
  };

  Alt.prototype.addStore = function addStore(name, StoreModel) {
    for (var _len9 = arguments.length, args = Array(_len9 > 2 ? _len9 - 2 : 0), _key9 = 2; _key9 < _len9; _key9++) {
      args[_key9 - 2] = arguments[_key9];
    }

    this.createStore.apply(this, [StoreModel, name].concat(args));
  };

  Alt.prototype.getActions = function getActions(name) {
    return this.actions[name];
  };

  Alt.prototype.getStore = function getStore(name) {
    return this.stores[name];
  };

  Alt.debug = function debug(name, alt, win) {
    var key = 'alt.js.org';
    var context = win;
    if (!context && typeof window !== 'undefined') {
      context = window;
    }
    if (typeof context !== 'undefined') {
      context[key] = context[key] || [];
      context[key].push({ name: name, alt: alt });
    }
    return alt;
  };

  return Alt;
}();

exports.default = Alt;
module.exports = exports['default'];