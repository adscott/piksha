n('piksha.media', function (ns) {

  var attributesService = piksha.shared.AttributesService.create();
  var eventService = piksha.media.EventService.create();

  function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
  }

  function createError () {
    return {visible: false};
  }

  function createAttribute(name) {
    return {name: name, error: createError(), id: generateUUID(), saved: false};
  }

  ns.Attributes = React.createClass({
    getInitialState: function () {
      return {attributes: [], attributeSelected: attributesService.definitions()[0].name, error: createError()};
    },
    clearErrors: function () {
      this.setState({error: {visible: false}});
      this.setState({attributes: _.map(this.state.attributes, function (a) {
        return _.assign(a, {error: {visible: false}});
      })});
    },
    addAttribute: function (event) {
      event.preventDefault();

      var shouldBeUnique = attributesService.definitionByName(this.state.attributeSelected).unique;
      var available = !shouldBeUnique || !_.any(this.state.attributes, function (a) { return a.name === this.state.attributeSelected; }, this);

      if (available) {
        this.setState({attributes:  this.state.attributes.concat(createAttribute(this.state.attributeSelected))});
      } else {
        this.setState({error: {visible: true, text: _.capitalize(this.state.attributeSelected) + ' has already been provided.'}});
      }
    },
    attributeSelected: function (event) {
      event.preventDefault();
      this.clearErrors();
      this.setState({attributeSelected: event.target.value});
    },
    save: function (event) {
      var self = this;

      event.preventDefault();
      self.clearErrors();

      var errors = attributesService.errors(self.state.attributes);

      if (_.isEmpty(errors)) {
        eventService.saveAttributes(self.props.photoUrl, self.state.attributes).then(function () {
          var savedAttributes = _.map(self.state.attributes, function (a) {
            a.saved = true;
            return a;
          });
          self.setState({attributes: savedAttributes});
        });
      } else {
        var attributesWithErrors = _.map(self.state.attributes, function (a) {
          return _.contains(_.keys(errors), a.id) ? _.assign(a, {error: {visible: true, text: errors[a.id]}}) : a;
        });

        self.setState({attributes: attributesWithErrors});
      }
    },
    render: function () {
      var self = this;

      var attributes = _.map(this.state.attributes, function (a) {
        var assign = function (value) {
          self.clearErrors();
          self.setState({attributes: _.map(self.state.attributes, function (oldA) {
            return oldA.id === a.id ? _.assign(oldA, value) : oldA;
          })});
        };
        var updateAttribute = function (event) {
          event.preventDefault();
          assign({value: event.target.value});
        };
        var removeAttribute = function (event) {
          event.preventDefault();
          self.clearErrors();
          self.setState({attributes: _.reject(self.state.attributes, function (oldA) { return a.id === oldA.id; })});
        };
        var editAttribute = function (event) {
          event.preventDefault();
          assign({saved: false});
        };
        return <ns.Attribute attribute={a} updateAttribute={updateAttribute} removeAttribute={removeAttribute} editAttribute={editAttribute} />;
      });

      var attributeNames = _.map(attributesService.definitions(), function (d) {
        return <option value={d.name}>{_.capitalize(d.name)}</option>;
      });

      return <form>
          <fieldset className="controls">
            <button onClick={this.save}>Save</button>
            <button onClick={this.addAttribute}>Add Attribute</button>
            <select onChange={this.attributeSelected} value={this.state.attributeSelected}>
              {attributeNames}
            </select>
            <ns.AttributeError visible={this.state.error.visible} errorText={this.state.error.text} />
          </fieldset>
          <fieldset className="attributes">
            <ul>
              {attributes}
            </ul>
          </fieldset>
        </form>;
    }
  });

  ns.Attribute = React.createClass({
    render: function () {
      var editButtonClass = this.props.attribute.saved ? '' : 'disabled';
      return <li className="attribute">
          <label>{_.capitalize(this.props.attribute.name)}</label>
          <input type="text" onChange={this.props.updateAttribute} value={this.props.attribute.value} readOnly={this.props.attribute.saved} />
          <p><a href="#" onClick={this.props.editAttribute} className={editButtonClass}>Edit</a> | <a href="#" onClick={this.props.removeAttribute}>Remove</a></p>
          <ns.AttributeError visible={this.props.attribute.error.visible} errorText={this.props.attribute.error.text} />
        </li>;
    }
  });

  ns.AttributeError = React.createClass({
    getInitialState: function () {
      return {className: 'error'};
    },
    componentWillReceiveProps: function (nextProps) {
      var self = this;
      self.setState({className: nextProps.visible ? 'error present' : 'error'});
      clearTimeout(self.state.timer);
      self.setState({timer: setTimeout(function () {
        self.setState({className: 'error'});
      }, 3000)});
    },
    render: function () {
      return <label className={this.state.className}>{this.props.errorText}</label>;
    }
  });
});
