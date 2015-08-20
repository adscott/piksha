n('piksha.application', function (ns) {
  ns.Main = React.createClass({
    getInitialState: function() {
      return {user: ''};
    },
    loginSuccess: function (value) {
      this.setState({user: value});
    },
    render: function() {
      if (this.state.user) {
        return <piksha.application.Greeting user={this.state.user}/>;
      } else {
        return <piksha.auth.LoginDialog loginSuccess={this.loginSuccess}/>;
      }
    }
  });
});
