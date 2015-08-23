n('piksha.media', function (ns) {
  ns.Thumbnail = React.createClass({
    getInitialState: function () {
      return {src: '', loaded: ''};
    },
    componentDidMount: function() {
      this.img = new Image();
      this.img.onload = this.createLoadHandler();
      this.img.src = this.props.src;
    },
    createLoadHandler: function () {
      var self = this;
      return function () { self.setState({src: self.props.src, loaded: 'loaded'}); };
    },
    render: function () {
      return <img src={this.state.src} className={this.state.loaded} />;
    }
  });
});
