n('piksha.media', function (ns) {
  ns.Image = React.createClass({
    getInitialState: function () {
      return {content: <div className="spinner" />, status: 'loading'};
    },
    createImageLoadedHandler: function () {
      var self = this;
      return function () { setTimeout(function () { self.setState({content: <img src={self.props.url} />, status: 'loaded'}); }, 500); };
    },
    componentDidMount: function () {
      var img = new Image();
      img.onload = this.createImageLoadedHandler();
      img.src = this.props.url;
    },
    render: function () {
      return <div className={this.state.status}>{this.state.content}</div>;
    }
  });
});
