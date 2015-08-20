var PikshaApplication = React.createClass({
  render: function() {
    var message = 'Hello World!';
    return <h1>{message}</h1>;
  }
});

React.render(
  <PikshaApplication />,
  document.getElementById('container')
);
