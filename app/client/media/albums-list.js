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
    albumChosen: function (album) {
      this.props.albumChosen(album);
    },
    render: function () {
      var albumChosen = this.albumChosen;
      return <ul>{this.state.albums.map(function (album) { return <ns.AlbumTile album={album} albumChosen={albumChosen} />; })}</ul>;
    }
  });

  ns.AlbumTile = React.createClass({
    albumChosen: function (e) {
      e.preventDefault();
      this.props.albumChosen(this.props.album.url);
    },
    render: function () {
      return <li className="thumbnail">
        <a href="#" onClick={this.albumChosen}>
          <img src={this.props.album.thumbnail} />
          <span>{this.props.album.title}</span>
        </a>
      </li>;
    }
  });
});
