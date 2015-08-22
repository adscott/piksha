n('piksha.auth', function (ns) {
  ns.LoginDialog = React.createClass({
    handleSubmit: function (e) {
      e.preventDefault();

      var key = React.findDOMNode(this.refs.key).value.trim();
      var keyService = piksha.auth.KeyService.create();

      keyService.authenticate(key).then(this.props.loginSuccess);
    },
    render: function () {
      return <form onSubmit={this.handleSubmit}>
        <input type="text" placeholder="Your key..." ref="key" />
        <input type="submit" />
      </form>;
    }
  });
});
