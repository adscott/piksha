n('piksha.application', function (ns) {
  ns.Main = React.createClass({
    getInitialState: function () {
      piksha.application.Router.instance().subscribe(this.listener());
      return {route: 'loading', params: {}};
    },
    componentDidMount: function () {
      var self = this;
      piksha.auth.KeyService.create().currentUser().then(
        function () {
          self.setState({route: 'overview'});
        },
        function () {
          self.setState({route: 'login'});
        }
      );
    },
    listener: function () {
      var self = this;
      return function (route, params) {
        self.setState({route: route, params: params});
      };
    },
    render: function() {
      var routes = {
        overview: <piksha.media.Overview />,
        login: <piksha.auth.LoginDialog />,
        album: <piksha.media.Album albumUrl={this.state.params.albumUrl} />,
        photo: <piksha.media.Photo photo={this.state.params.photo} albumUrl={this.state.params.albumUrl} />,
        loading: <img src="/client/assets/img/loader.gif" />
      };
      return routes[this.state.route];
    }
  });
});
