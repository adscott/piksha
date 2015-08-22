n('piksha.application', function (ns) {
  ns.Greeting = React.createClass({
    getInitialState: function() {
      return {greeting: ''};
    },
    componentDidMount: function() {
      var self = this;
      piksha.auth.KeyService.create().currentUser()
        .then(function (user) {
          self.setState({message: 'Hello ' + _.capitalize(user) + '!'});
        });
    },
    render: function () {
      return <h1>{this.state.message}</h1>;
    }
  });
});
