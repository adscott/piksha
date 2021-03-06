n('piksha.media', function (ns) {
  ns.AlbumsList = React.createClass({
    getInitialState: function() {
      return {albums: []};
    },
    componentDidMount: function() {
      var self = this;
      var mediaService = piksha.media.MediaService.create();
      mediaService.albums().then(function (albums) {
        self.setState({albums: albums});
      });
    },
    render: function () {
      return <ul>{this.state.albums.map(function (album) { return <ns.AlbumTile album={album} />; })}</ul>;
    }
  });

  ns.AlbumTile = React.createClass({
    albumChosen: function (e) {
      e.preventDefault();
      piksha.application.Router.instance().changeRoute('album', {albumUrl: this.props.album.url});
    },
    render: function () {
      return <ns.Thumbnail src={this.props.album.thumbnail} clickHandler={this.albumChosen} title={this.props.album.title} />;
    }
  });
});
