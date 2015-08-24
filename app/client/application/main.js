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
        self.replaceState({route: route, params: params});
      };
    },
    render: function() {
      var routes = {
        overview: <piksha.media.Overview />,
        login: <piksha.auth.LoginDialog />,
        album: <piksha.media.Album key={this.state.params.albumUrl} albumUrl={this.state.params.albumUrl} />,
        photo: <piksha.media.Photo key={this.state.params.photoUrl} photoUrl={this.state.params.photoUrl} albumUrl={this.state.params.albumUrl} />,
        loading: <piksha.application.Loading />
      };
      return routes[this.state.route];
    }
  });
});
