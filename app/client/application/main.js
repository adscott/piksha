n('piksha.application', function (ns) {
  ns.Main = React.createClass({
    getInitialState: function () {
      return {route: 'loading'};
    },
    componentDidMount: function () {
      var self = this;
      piksha.auth.KeyService.create().currentUser().then(
        function () {
          self.setState({route: 'media'});
        },
        function () {
          self.setState({route: 'login'});
        }
      );
    },
    loginSuccess: function () {
      this.setState({route: 'media'});
    },
    render: function() {
      var routes = {
        media: <piksha.media.Overview />,
        login: <piksha.auth.LoginDialog loginSuccess={this.loginSuccess} />,
        loading: <img src="/client/assets/img/loader.gif" />
      };
      return routes[this.state.route];
    }
  });
});
