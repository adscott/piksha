n('piksha.auth', function (ns) {
  ns.LoginDialog = React.createClass({
    handleSubmit: function (e) {
      e.preventDefault();

      var key = React.findDOMNode(this.refs.key).value.trim();
      var keyService = piksha.auth.KeyService.create();

      keyService.authenticate(key).then(function () { piksha.application.Router.instance().changeRoute('overview'); });
    },
    render: function () {
      return <form id="login" onSubmit={this.handleSubmit}>
        <input type="text" placeholder="Your key..." ref="key" />
        <input type="submit" />
      </form>;
    }
  });
});
