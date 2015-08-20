n('piksha.application', function (ns) {
  ns.Greeting = React.createClass({
    render: function () {
      return <h1>Hello {_.capitalize(this.props.user)}!</h1>;
    }
  });
});
